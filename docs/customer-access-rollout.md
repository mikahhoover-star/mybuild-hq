# Secure purchase access — implementation checklist

**Status: foundation only; not deployed.** Do not merge as a completed security fix. The current GitHub Pages site relies on a client-editable localStorage flag and must not be treated as a secure paywall.

## Backend prerequisites
1. In Supabase SQL Editor run `supabase/migrations/20261008_customer_access.sql`. Existing policies with the same names may need reconciliation if rerunning.
2. Deploy a Supabase Edge Function that requires a valid Supabase user JWT, accepts a Gumroad license key, calls Gumroad's verify endpoint **server-side**, checks the configured product ID, and verifies `success`, sale status, refunded/disputed/chargebacked flags and any relevant license restrictions.
3. Using the service role **only on the server**, upsert an entitlement for the authenticated user and Gumroad sale. Never expose service-role credentials in GitHub Pages.
4. On every protected data request, enforce entitlement on the server (or via RLS referencing an active entitlement). A UI-only check is not a paywall; GitHub Pages publishes all frontend source.
5. Handle refunds, revocations and chargebacks via verified Gumroad webhook or periodic server reconciliation. Ensure license ownership/reuse policy is explicit.
6. Move customer project saves to `project_data`, keyed by `auth.uid()`. On first login, offer import of the existing `mybuildhq_v1` browser data **without overwriting** a newer server copy; retain JSON export/import.
7. Update UI only after backend and policies are deployed and tested. Do not remove local data or current access path prematurely.

## Gumroad seller action
Enable license keys for the product, if not already enabled. In the product's content/receipt delivery, place the direct app URL: https://mikahhoover-star.github.io/mybuild-hq/ and explain that customers must sign up with their purchase email and enter their license key. Confirm receipt with a real purchase and refund flow. Seller settings cannot be edited from this repository.

## Test plan
- New account without purchase cannot read another user's project or entitlement.
- Valid paid license unlocks only the corresponding authenticated account.
- Invalid/refunded/revoked license does not unlock.
- Existing customer can sign out/in and restore their data across devices.
- Mobile and desktop navigation, export/import and checkout all pass.

See issue #3.
## Deployment runbook (owner/admin required)
1. Back up the existing Supabase database and verify the project URL matches the frontend.
2. Apply `supabase/migrations/20261008_customer_access.sql` in the Supabase SQL Editor. This migration is rerunnable for the named RLS policies.
3. Configure the function environment with `GUMROAD_PRODUCT_ID` set to the **existing** product ID, and Supabase server secrets `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Keep the service-role key outside GitHub and the browser.
4. Deploy `supabase/functions/verify-gumroad-license` with JWT verification **enabled**. Do not disable authentication to work around failed requests.
5. In Supabase Authentication URL Configuration, allow the production GitHub Pages redirect for email confirmation and password reset. Verify recovery email templates and SMTP delivery.
6. Enable Gumroad license keys on the existing product and place the app link in the receipt/delivery content. Provide a seller-assisted recovery route for buyers who previously received receipts without license keys.
7. Run `node scripts/check-site.mjs`, then the full `docs/prelaunch-tests.md` matrix on a staging environment. The static check does not substitute for live purchase tests.
8. Verify refund and dispute reconciliation is operational before claiming access is automatically revoked. Current Edge Function only checks purchase status when a license is verified; it does **not** implement ongoing revocation.
9. Merge draft PR #4 only after all prerequisites pass, then smoke-test the production GitHub Pages deployment.

## Important limitations
- A static GitHub Pages website cannot keep frontend source code private. RLS secures customer cloud data, not downloadable frontend code.
- Cloud saving is currently **manual**. Browser-local project changes are not automatically synchronized.
- A purchaser without a license key cannot self-verify through the current API integration. The seller must enable keys or implement a separate verified order lookup.
- Existing purchasers should never be asked to buy the same product again solely because their receipt lacks a key.
- A database migration and Edge Function cannot be deployed by a GitHub commit alone.
