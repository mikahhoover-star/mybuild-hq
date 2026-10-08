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