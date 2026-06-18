# First Clothing Client Setup Checklist

Use this checklist when turning the reusable ecommerce template into a real store project for the first client.

This checklist is an engineering and handoff aid, not legal advice. Keep each client in a separate repository, database, deployment, Cloudinary folder, Redis database, SMTP configuration, and environment configuration.

## 1. Create the client project safely

- [ ] Create a new private repository for the client project.
- [ ] Do not reuse another client's `.env`, database, Cloudinary folder, Redis token, OAuth client, SMTP credentials, or hosting project.
- [ ] Create a new feature branch before client-specific changes.
- [ ] Confirm `.env`, `.env.*`, `.next`, `node_modules`, Playwright auth state, reports, and local audit files are not tracked by Git.
- [ ] Run `git status --ignored` and check that local secret/build/test files are ignored.

Suggested branch name:

```bash
git switch main
git pull origin main
git switch -c client/client-name-setup
```

## 2. Replace public client-safe config only

Client-specific public values should be changed in typed config files first:

```txt
src/config/store.ts
src/config/contact.ts
src/config/delivery.ts
src/config/legal-business.ts
src/config/policies.ts
```

- [ ] Update store name, short name, metadata title, metadata description, and logo text in `src/config/store.ts`.
- [ ] Update public support email, phone, WhatsApp, support hours, footer contact display, contact-page copy, and public social links in `src/config/contact.ts`.
- [ ] Update delivery labels, prices, default area, pickup/receive-point copy, and agreement labels in `src/config/delivery.ts`.
- [ ] Enter only client-supplied, verified legal identity and registration values in `src/config/legal-business.ts`. Leave unknown values `null`; never guess or use placeholder registration numbers.
- [ ] Confirm the canonical website value is the client-owned production HTTPS `.ps` domain.
- [ ] Ask the client's accountant to approve the tax wording; do not hardcode or infer a tax rate.
- [ ] Review and replace public terms, privacy, shipping, returns, and contact policy copy in `src/config/policies.ts`.
- [ ] Keep public policy text generic until the client reviews or replaces it.
- [ ] Do not place secrets, private client agreements, internal admin-only contacts, private webhook URLs, SMTP credentials, OAuth credentials, database URLs, Redis tokens, or Cloudinary secrets in config files.

Security rule: config-driven display changes are safe only for public storefront data. Pricing, stock, authorization, admin access, order totals, and order snapshots must stay server-controlled.

## 3. Delivery pricing and order snapshot rules

Delivery pricing is currently code-managed, not admin-editable.

- [ ] Confirm delivery areas and prices with the client before staging testing.
- [ ] Keep delivery area `key` values stable after real orders exist.
- [ ] Prefer changing labels/prices for future orders instead of renaming/removing old keys.
- [ ] Test checkout after changing delivery config.
- [ ] Confirm the order stores the selected delivery area and delivery price snapshot.

Why this matters: old orders must remain historically accurate even if delivery prices change later.

## 4. Public assets and license safety

- [ ] Replace template favicon/logo with client-owned or original assets.
- [ ] Use only product photos owned by the client, supplier-approved, original, or properly licensed for commercial use.
- [ ] Remove demo/test product images before launch.
- [ ] Do not use copied Instagram images, copyrighted fashion/model/product photos, brand logos, supplier catalog images, influencer photos, or posters unless the client has permission.
- [ ] Record asset source/permission notes in `docs/asset-license-notes.md` when needed.
- [ ] Run the asset reference scan from `docs/asset-license-notes.md` after adding assets.

## 5. Environment and secrets setup

Create environment values per environment. Do not share secrets between local, staging, and production unless there is a reviewed reason.

- [ ] Copy `.env.example` to `.env` locally.
- [ ] Keep `EMAIL_DELIVERY_MODE="log"` for local and staging unless intentionally testing SMTP.
- [ ] Use `EMAIL_DELIVERY_MODE="smtp"` only after production SMTP is configured and verified.
- [ ] Generate a new long random `BETTER_AUTH_SECRET` for production.
- [ ] Use the real HTTPS domain for production `BETTER_AUTH_URL` and `APP_URL`.
- [ ] Use separate database URLs for staging and production.
- [ ] Use `DATABASE_URL` for runtime and `DIRECT_URL` for Prisma migrations when the provider requires separate pooled/direct URLs.
- [ ] Configure Cloudinary, Upstash Redis, SMTP, and OAuth values only in local `.env` or hosting provider secrets.
- [ ] Never expose secrets through `NEXT_PUBLIC_` variables.

## 6. Google sign-in decision

Google sign-in is optional. Do not enable it for the client until the OAuth setup is complete.

- [ ] Decide whether the client actually needs Google sign-in for launch.
- [ ] If not needed, leave `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` empty.
- [ ] If needed, create environment-specific OAuth credentials.
- [ ] Add the exact callback URL for each domain:

```txt
http://localhost:3000/api/auth/callback/google
https://your-staging-domain.com/api/auth/callback/google
https://your-production-domain.com/api/auth/callback/google
```

- [ ] Confirm new Google users are normal customers, not admins.
- [ ] Confirm admin access still comes from the database `User.role`.

## 7. Product and admin setup

- [ ] Create disposable test admin and customer accounts for staging.
- [ ] Create real categories or client-approved placeholder categories.
- [ ] Add a small set of real or approved demo products.
- [ ] Confirm each product image is license-safe.
- [ ] Confirm prices and discounts are correct.
- [ ] Confirm variant size/color combinations are accurate.
- [ ] Confirm active variant stock values are realistic.
- [ ] Keep unavailable variant combinations inactive or at `0` stock.
- [ ] Decide per product whether exact stock count should be visible to customers.
- [ ] Do not promise coupons, POS, online payments, SMS, CSV import, accounting integration, delivery-company integration, or PWA unless intentionally built, enforced server-side where needed, and tested.

## 8. Manual staging verification

Run these before showing the store seriously to the client:

- [ ] Public homepage loads.
- [ ] Product listing loads.
- [ ] Product details load.
- [ ] Register works.
- [ ] Login works.
- [ ] Logout works.
- [ ] Password reset works in the intended email mode.
- [ ] Customer can select an available size/color variant.
- [ ] Customer cannot order unavailable or inactive variant combinations.
- [ ] Customer can add an item to cart.
- [ ] Customer can update and remove cart items.
- [ ] Checkout shows product total, delivery price, and final total.
- [ ] Checkout creates a pending order and reserves/decreases selected variant stock immediately.
- [ ] Customer sees the WhatsApp/phone confirmation message after ordering.
- [ ] Customer orders page shows only that customer's orders.
- [ ] Admin products page works for admins only.
- [ ] Admin categories page works for admins only.
- [ ] Admin orders page works for admins only.
- [ ] Admin can confirm/process a pending order without deducting stock again.
- [ ] Cancellation restores reserved stock exactly once when applicable.
- [ ] Non-admin users cannot access admin pages or admin APIs.
- [ ] Signed-out users cannot access protected pages or protected APIs.
- [ ] Public policy pages show client-reviewed or clearly placeholder text.
- [ ] Footer, terms, and contact pages show the verified legal-business block only after all required identity fields are configured.
- [ ] No example, all-zero, guessed, or placeholder registration values are visible.

## 9. Automated verification

Run the normal checks before opening a pull request:

```bash
npm run check
npm run test:run
npm run build
```

Run E2E only against localhost or staging with disposable test data:

```bash
npm run test:e2e
```

Do not run E2E against production. Do not commit Playwright auth state, screenshots, videos, traces, reports, or `.env.e2e.local`.

## 10. Client handoff review

Before real launch, review these with the client:

- [ ] What the admin can safely manage.
- [ ] What still requires a developer.
- [ ] Delivery prices and receive/pickup rules.
- [ ] Order confirmation workflow.
- [ ] Checkout-time stock reservation and cancellation restore workflow.
- [ ] Product image/license responsibility.
- [ ] Public policy text and legal responsibility.
- [ ] Legal business name, provider name, physical address, commercial registration, ecommerce registration, registered `.ps` domain, and accountant-approved tax wording.
- [ ] Support contact workflow.
- [ ] Error reference reporting workflow.
- [ ] Production deployment checklist.

## 11. Launch gate

Do not launch to real customers until all are true:

- [ ] Production environment variables are set only in the hosting provider.
- [ ] Production domain uses HTTPS.
- [ ] Production database is separate from staging/local.
- [ ] Production database backup and rollback plan exist.
- [ ] Production SMTP provider is configured and verified.
- [ ] Upstash Redis rate limiting is configured.
- [ ] Cloudinary production folder/account is configured.
- [ ] Production migrations use `npm run db:migrate:deploy`.
- [ ] `npm run check`, `npm run test:run`, and `npm run build` pass.
- [ ] Manual customer and admin flows pass on the production domain.
- [ ] Client reviewed handoff, delivery, contact, policy text, legal identity, registration details, and tax wording.
- [ ] Lawyer/accountant review required for this client has been completed and documented outside the public repository.
- [ ] Dependency and asset license notes are reviewed.
