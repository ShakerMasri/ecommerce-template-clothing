# Production Readiness Checklist

Use this checklist before the first real client launch and before any major production release.

## 0. Client Setup Gate

- [ ] `docs/first-client-setup-checklist.md` is completed for this client.
- [ ] Client-specific public config has been reviewed.
- [ ] Client-specific assets and product images have been reviewed for commercial-use rights.
- [ ] Public policy text has been replaced, reviewed, or explicitly accepted by the client as placeholder-based copy.
- [ ] No unfinished add-on is advertised as included in the launch package.

## 1. Source Control

- [ ] Work is merged through a reviewed pull request.
- [ ] `main` is up to date.
- [ ] No unrelated changes are included.
- [ ] `.env`, `.env.local`, `.env.e2e.local`, Playwright auth state, reports, traces, screenshots, and videos are not committed.
- [ ] The README and handoff docs match the current behavior.
- [ ] A Git tag is created only after the deployed commit is known.

## 2. Required Checks

Run locally or in CI:

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
```

Run E2E only against local or staging test data:

```bash
npm run test:e2e
```

Do not run E2E or load tests against production unless a separate production-safe plan exists.

## 3. Environment Variables

Production values must be set only in the hosting provider or secret manager.

Verify:

- [ ] `DATABASE_URL` points to the production database.
- [ ] `DIRECT_URL` is configured for Prisma migrations when needed.
- [ ] `BETTER_AUTH_SECRET` is long, random, and private.
- [ ] `BETTER_AUTH_URL` uses the real production HTTPS domain.
- [ ] `APP_URL` uses the real production HTTPS domain.
- [ ] Google OAuth variables are configured only if Google sign-in is enabled.
- [ ] SMTP variables are configured for the production email provider.
- [ ] `EMAIL_DELIVERY_MODE="smtp"` is used only after SMTP is verified.
- [ ] Upstash Redis variables are configured for rate limiting.
- [ ] Cloudinary variables are configured for product uploads.
- [ ] No secret uses a `NEXT_PUBLIC_` prefix.

## 4. Domain and OAuth

Before launch:

- [ ] Real domain points to the production deployment.
- [ ] HTTPS is active.
- [ ] `BETTER_AUTH_URL` and `APP_URL` match the real domain.
- [ ] Google OAuth callback URL exactly matches the production callback route if Google sign-in is enabled.
- [ ] Password reset and verification links use the production domain.

## 5. Database and Prisma

Before launch:

- [ ] All migration files are committed.
- [ ] Production deployment uses `npm run db:migrate:deploy`.
- [ ] Production never uses `prisma db push`.
- [ ] Production never uses `prisma migrate dev`.
- [ ] A backup exists before first launch.
- [ ] Restore/rollback process is known.
- [ ] Test/staging data is not mixed with real production data.

## 6. Security Review

Verify:

- [ ] Admin pages require server-side admin checks.
- [ ] Admin APIs require server-side `ADMIN` role checks.
- [ ] Customer APIs are scoped to the logged-in user.
- [ ] Cart and order mutations validate input server-side.
- [ ] Product prices and discount logic are calculated server-side.
- [ ] Stock deduction happens only through the reviewed admin confirmation flow.
- [ ] CSRF/same-origin checks protect cookie-based mutation routes.
- [ ] Rate limiting works with production Redis.
- [ ] API errors do not leak stack traces, raw database errors, tokens, cookies, or secrets.
- [ ] Logs do not include passwords, request cookies, OAuth secrets, env vars, or full database URLs.
- [ ] New Google users do not receive admin access unless their database role is explicitly changed.

## 7. Manual Customer Flow

On staging or production candidate:

- [ ] Register/login works.
- [ ] Google sign-in works if enabled.
- [ ] Logout works.
- [ ] Product listing works.
- [ ] Product details work.
- [ ] Discounted product shows old and new price.
- [ ] Stock visibility follows the admin setting.
- [ ] Customer can add item to cart.
- [ ] Cart totals use the effective server price.
- [ ] Customer can select delivery area/details.
- [ ] Checkout confirmation shows product total, delivery price, and final total.
- [ ] Order is created as pending.
- [ ] Customer sees the post-order confirmation/contact message.
- [ ] Customer orders page shows only that customer's orders.

## 8. Manual Admin Flow

On staging or production candidate:

- [ ] Admin dashboard loads.
- [ ] Admin products page loads.
- [ ] Admin can create/edit/archive/restore product.
- [ ] Admin can update stock.
- [ ] Admin can set and remove discount price.
- [ ] Admin can toggle customer stock visibility.
- [ ] Admin categories page loads.
- [ ] Admin can create/update category.
- [ ] Admin category deletion is blocked when products are attached.
- [ ] Admin orders page loads.
- [ ] Admin can filter/paginate orders.
- [ ] Admin can view contact and delivery details.
- [ ] Admin can confirm a pending order.
- [ ] Stock decreases exactly once after confirmation.
- [ ] Double confirmation does not double-deduct stock.
- [ ] Insufficient-stock confirmation fails safely.
- [ ] Admin can update payment status and internal notes.

## 9. Observability

Before handoff:

- [ ] Unexpected API failures return a safe error reference ID.
- [ ] The same error reference can be found in deployment logs.
- [ ] Route error boundaries show a clean user-facing failure screen.
- [ ] Normal validation/auth errors do not create noisy crash logs.
- [ ] The client knows to report `err_...` references with the page/action and time.

## 10. Email

Verify in production mode with the real provider:

- [ ] Password reset email sends.
- [ ] Email verification sends if enabled.
- [ ] Sender domain is verified.
- [ ] Links open the production domain.
- [ ] Emails do not expose internal staging URLs.
- [ ] Failed email delivery is logged safely.

## 11. Legal, Licensing, and Assets

Before client delivery:

- [ ] Product images are owned by the client or licensed for commercial use.
- [ ] Icons, fonts, and other assets are allowed for commercial use.
- [ ] Dependency license inventory has been reviewed.
- [ ] Legal/customer policy pages are reviewed by the client or a qualified legal reviewer.
- [ ] Client agreement clearly covers ownership, usage rights, maintenance, and support expectations.

## 12. Caching and Performance

Caching is intentionally postponed until core behavior is stable and real measurements justify it.

Avoid caching:

- cart data
- orders
- profile/account data
- admin pages
- authenticated API responses
- stock-sensitive or price-sensitive data without a clear invalidation plan

Safe future candidates:

- static legal/customer policy pages
- optimized product images through Cloudinary/Next image behavior
- public product listing only after a careful revalidation strategy is designed

## Launch Decision

The app is launch-ready only when:

- [ ] required checks pass
- [ ] staging/manual tests pass
- [ ] production env vars are correct
- [ ] database backup/rollback plan exists
- [ ] SMTP works in production
- [ ] Google sign-in works if enabled
- [ ] client reviewed the handoff guide
- [ ] no known high-risk bugs remain
