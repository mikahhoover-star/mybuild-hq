# MyBuild HQ

**Your Build. Your Plan. Your HQ.**

A homeowner-focused building project organizer for budgets, bids, material selections, decisions, progress, contractor questions, checklists, and punch lists.

- Website: https://mikahhoover-star.github.io/mybuild-hq/
- Checkout: https://mikah50.gumroad.com/l/mybuild-hq
- Price displayed on website: **$24.99 one time**, no subscription.
- Current deployment: static GitHub Pages.
- Authentication: Supabase Auth.
- Purchase verification: Gumroad via a Supabase Edge Function **on the development branch only**.
- Project data: browser localStorage, with manual cloud save/load planned via Supabase.

## Development

This is a plain HTML/CSS/JavaScript project. There is no frontend build step.

Run static checks using Node.js 22:

```bash
node scripts/check-site.mjs
```

The GitHub Actions workflow runs the same checks on pushes and pull requests. Syntax checks are not a substitute for browser, security, payment, or database integration testing.

## Deployment

**Do not merge the draft security work until the backend is deployed and tested.** The migration and Edge Function are not deployed by GitHub Pages.

- Database: `supabase/migrations/20261008_customer_access.sql`
- Edge Function: `supabase/functions/verify-gumroad-license/index.ts`
- Deployment checklist: `docs/customer-access-rollout.md`
- Acceptance checklist: `docs/prelaunch-tests.md`

Never commit Supabase service-role keys, Gumroad seller access tokens, customer records, or private license keys. Publishable Supabase keys are intentionally client-side.

## Customer access and backups

Buyers should receive the website URL and purchase instructions through Gumroad. Existing buyers who have only a receipt must **not** be asked to repurchase; support must resolve their access.

Local browser data is not guaranteed to sync automatically. Export a backup before changing browsers, devices, or accounts. Cloud saving on the development branch is manual.

## Security note

GitHub Pages hosts public source code. A client-side paywall alone cannot keep source private. Supabase RLS is intended to protect cloud project data. The secure purchase flow is not production-ready until deployed, tested, and reconciled with refunds.
