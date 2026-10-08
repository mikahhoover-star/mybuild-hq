# Customer support playbook

## Purchased but received only a receipt

1. Confirm the customer is contacting the seller through a trusted channel and ask for the **Gumroad receipt/order identifier**, not payment-card details or passwords.
2. Look up the order in the Gumroad seller dashboard. Confirm it is for MyBuild HQ, paid, and not refunded or disputed.
3. If license keys can be enabled or issued for existing orders, use Gumroad's supported seller workflow and have the buyer sign in with the purchase email.
4. If no license can be issued, do not tell the customer to purchase again. Provide a seller-controlled entitlement recovery method once it has been implemented and audited.
5. Never request the customer's account password or full card number. Never manually insert a paid entitlement without checking ownership of the order.

## Customer cannot log in

- Confirm the customer uses the email tied to their MyBuild HQ account.
- Use the Forgot password action on the website.
- Confirm email confirmation and recovery redirect URLs are configured in Supabase.
- Do not ask for password or one-time authentication codes.

## Customer has lost project data

- Ask whether they are on the same browser/device and account.
- Ask whether they have a MyBuild HQ JSON backup.
- On the development branch, Save to Account and Load Account Copy are manual actions, not continuous synchronization.
- Before any import or cloud overwrite, export the existing browser data.
- Do not promise recovery of browser-local data if storage has been erased and no backup exists.

## Refund or chargeback

- Follow Gumroad's seller workflow.
- Treat refund, dispute and chargeback events as reasons to revoke server entitlements.
- **Automatic revocation is not yet implemented.** Do not promise immediate revocation.
