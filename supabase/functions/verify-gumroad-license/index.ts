// Supabase Edge Function: verify-gumroad-license
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
// Set GUMROAD_PRODUCT_ID to the Gumroad product ID from the seller dashboard.
// Deploy with JWT verification enabled. This function independently checks the user token.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const headers = {
  'Access-Control-Allow-Origin': 'https://mikahhoover-star.github.io',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Vary': 'Origin',
};
function respond(status: number, message: string) {
  return new Response(JSON.stringify({ message }), { status, headers });
}
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return respond(405, 'Method not allowed');
  try {
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return respond(401, 'Please sign in');
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const productId = Deno.env.get('GUMROAD_PRODUCT_ID');
    if (!url || !anon || !serviceKey || !productId) return respond(503, 'Purchase verification is not configured');
    const auth = createClient(url, anon, { auth: { persistSession: false } });
    const { data: { user }, error: userError } = await auth.auth.getUser(token);
    if (userError || !user?.email) return respond(401, 'Please sign in again');
    const input = await request.json().catch(() => null);
    const license = typeof input?.license_key === 'string' ? input.license_key.trim() : '';
    if (!license || license.length > 512) return respond(400, 'Enter a valid license key');
    const form = new URLSearchParams({
      product_id: productId,
      license_key: license,
      increment_uses_count: 'false',
    });
    const verification = await fetch('https://api.gumroad.com/v2/licenses/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(10000),
    });
    if (!verification.ok) return respond(403, 'License verification failed');
    const result = await verification.json();
    const purchase = result?.purchase;
    if (!result?.success || !purchase || (purchase.product_id && purchase.product_id !== productId) || purchase.refunded || purchase.disputed ||
        purchase.chargebacked || purchase.subscription_cancelled_at) {
      return respond(403, 'This purchase is not eligible for access');
    }
    // Bind a purchase to the account email. If a buyer used another email, support must resolve it.
    const buyerEmail = String(purchase.email || '').trim().toLowerCase();
    if (!buyerEmail || buyerEmail !== user.email.toLowerCase()) {
      return respond(403, 'Please sign in with the email used for your purchase');
    }
    const saleId = String(purchase.id || '');
    if (!saleId) return respond(403, 'Purchase record is incomplete');
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    // Never store the raw license key in the database or browser.
    // A sale ID is unique; a reused key cannot be claimed by a different account.
    const { error } = await admin.from('purchase_entitlements').upsert({
      user_id: user.id,
      gumroad_sale_id: saleId,
      product_id: productId,
      status: 'active',
      verified_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) {
      // Do not disclose database details or whether another account has claimed the purchase.
      return respond(409, 'This purchase could not be linked to your account. Contact support.');
    }
    return respond(200, 'Purchase verified');
  } catch {
    return respond(500, 'Could not verify purchase right now');
  }
});
