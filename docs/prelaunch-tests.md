# MyBuild HQ — pre-launch test checklist

Run these tests on a staging Supabase project before merging PR #4.

## Account and entitlement tests
- [ ] Unauthenticated requests cannot read or write `project_data`.
- [ ] Authenticated user without entitlement cannot read or write `project_data`.
- [ ] User A with an active entitlement can create, read, edit, and delete only A's project.
- [ ] User A cannot read, overwrite, or delete user B's project even if A knows B's UUID.
- [ ] User with revoked entitlement cannot read or write a project.
- [ ] Browser cannot insert or modify `purchase_entitlements` directly.
- [ ] Invalid Gumroad key is rejected by Edge Function.
- [ ] A valid license issued to a different email is rejected.
- [ ] A sale claimed by one account cannot be claimed by another.
- [ ] A refunded or disputed sale is rejected.
- [ ] A valid license verifies and creates a server entitlement.
- [ ] Returning customer can access their project on a second device.
- [ ] Expired or revoked purchases are reflected in server entitlements.

## Data safety
- [ ] Existing browser data is backed up before migrating.
- [ ] First cloud sync does not overwrite an existing cloud project.
- [ ] A failed network request does not destroy the local copy.
- [ ] Export and import round trip preserves all supported project sections.
- [ ] Invalid backup does not replace saved data.
- [ ] Canceling import leaves saved data unchanged.
- [ ] Project editing retains unsaved form entries during unrelated rerenders.

## Purchase and app experience
- [ ] Gumroad product receipt contains a working direct app link.
- [ ] Gumroad license key generation is enabled and tested.
- [ ] New purchaser receives instructions and can unlock access.
- [ ] Existing purchaser without a license key has a supported recovery path.
- [ ] Signup email verification and password login work on iPhone and desktop.
- [ ] Checkout shows $24.99 as one-time payment with no subscription.
- [ ] Home screen icon and manifest load at the GitHub Pages subpath.
- [ ] Verify accessibility, responsive layout, and browser console errors.

**Current status:** these are tests to perform, not passed test results. No staging deployment has been performed.

## Database authorization regression cases

- [ ] Signed-out visitor cannot read or write either database table.
- [ ] Signed-in customer without an entitlement cannot read, insert, update, or delete project data.
- [ ] Customer with a revoked entitlement cannot read, insert, update, or delete project data.
- [ ] Customer with an active entitlement for another product cannot read, insert, update, or delete MyBuild HQ project data.
- [ ] Customer with an active MyBuild HQ entitlement can access only their own project.
- [ ] Customer cannot create, modify, or revoke their own entitlement from the browser.
- [ ] Attempting to claim the same Gumroad sale from a different account fails.
- [ ] Invalid JSON backup containing null entries, wrong field types, or excessively long custom checklist items is rejected without replacing browser data.
- [ ] A cloud save from another device triggers a revision conflict rather than overwriting silently.
- [ ] Only one app script and one auth script exist in the generated HTML.

## Shared browser and license recovery

- [ ] A signed-in user without an entitlement can sign out from the license gate.
- [ ] A buyer can sign in with the purchase email after signing out of a different account.
- [ ] A shared-device user can export the browser backup before intentionally clearing local data.
- [ ] Canceling either clear-data confirmation preserves the browser project and its owner.
- [ ] Clearing browser data does not delete any cloud project or entitlement.
- [ ] A refund/chargeback is reflected in the entitlement status after backend reconciliation; do not claim automatic revocation before this exists.
- [ ] Gumroad verification times out gracefully during API outages.
