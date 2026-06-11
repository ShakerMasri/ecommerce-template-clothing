# Clothing Ecommerce Template

Clothing Ecommerce Template is a reusable private full-stack e-commerce starter for future clothing-store client storefronts.

This project was forked from an existing hardened ecommerce starter and is now maintained as a separate clothing-store template. It is being prepared as a real client-ready application, not just a demo. The backend, authentication, authorization, environment configuration, deployment flow, and production safety checks should be treated seriously before launch.

This clothing template now includes size/color product variants, admin variant management, customer-side variant selection/cart/order snapshots, and checkout-time stock reservation. The next hardening checkpoint is final post-reservation review before production/client handoff.

## Tech Stack

- Next.js App Router
- TypeScript
- React
- PostgreSQL
- Prisma ORM
- Better Auth
- Zod
- Cloudinary for product image uploads
- Upstash Redis for production-safe rate limiting
- Nodemailer / SMTP for email verification and password reset emails
- Docker Compose for local PostgreSQL development
- ESLint and Prettier
- Vitest and React Testing Library for unit/component tests
- Playwright for E2E browser tests

## Current Production-Hardening Status

Completed:

- Better Auth migration
- Rate limiting
- Light public product API read rate limiting
- Dedicated resend verification email rate limiting
- Security headers
- Admin/customer authorization audit
- Product API hardening
- Upload API hardening
- Category API hardening
- Order API hardening
- Cart API hardening
- Profile API hardening
- Admin category management page and safe category deletion
- Checkout delivery area selection, delivery price snapshot, and confirmation dialog
- Public legal/customer pages and footer legal links
- Public typed store, delivery, contact/support, and policy/legal config layers for client-safe customization
- CSRF / same-origin checks on protected mutation routes
- Prisma migration-based database workflow
- Environment validation through `src/env.js`
- Unit testing setup with Vitest and React Testing Library
- Unit tests for validation schemas, product APIs, CSRF/same-origin checks, admin authorization, middleware behavior, and rate limiting
- Playwright E2E testing setup
- Staging-safe E2E tests for public pages, customer auth, cart, orders, product display, admin access, admin guards, and admin filter smoke behavior
- Playwright auth-state reuse for stable customer/admin E2E tests
- Checkout-time stock reservation: customer checkout creates a pending order and immediately reserves/decreases stock in the order transaction
- Transaction-safe checkout stock reservation with protection against double reservation, plus cancellation restock protection
- Admin orders page with server-side filters, capped pagination, order cards, details/edit panel, skeleton loading, and mobile-friendly details scrolling
- Order archiving/deletion was intentionally removed so order history remains auditable
- Admin products page with server-side filters, capped pagination, sorting, and edit-form scroll behavior
- Admin categories page with server-side filters, capped pagination, sorting, and safe delete behavior
- Per-product customer stock visibility control
- Product discounts with old price/new price display
- Server-calculated effective product pricing for cart totals and order item price snapshots
- Google sign-in with Better Auth OAuth provider support while keeping email/password auth working
- Production-safe server logging with searchable error reference IDs for unexpected API failures
- Safe route error boundaries for user-facing account, orders, and admin page failures
- Product variant schema foundation for clothing size/color combinations
- Admin product variant management inside the product edit panel
- Customer product pages can require selecting size/color variants when a product has active variants
- Cart rows can distinguish the same product with different selected variants
- Order items can snapshot selected size/color details for historical accuracy
- Variant-first checkout reservation deducts selected `ProductVariant.stock`; customer-orderable product stock is derived from active variant stock

Not started yet:

- Full post-reservation security audit after checkout-time stock reservation is reviewed.
- Full post-variant security audit.
- Caching.

Not supported in this clothing template yet:

- POS integration
- online payments
- SMS
- coupons
- accounting integration
- delivery-company integration
- CSV import
- PWA/offline install support
- multi-tenant SaaS
- feature-plan enforcement

Postponed intentionally:

- Full post-reservation security audit. Checkout-time reservation should be reviewed before production/client handoff.
- Admin-editable delivery pricing dashboard. Delivery areas/prices remain code-managed for now, and existing orders keep delivery snapshots for audit safety.
- PWA support. If considered later, it should be a minimal installable-app checkpoint and must not cache auth, cart, order, profile, stock-sensitive, price-sensitive, or admin data unsafely.

Planned next checkpoints:

- Review checkout-time stock reservation on staging with variant/option products.
- Verify admin confirmation is only an approval/status change and does not deduct stock again.
- Verify cancellation restores reserved stock exactly once.
- Run a full security review after the stock-reservation flow is stable.
- Complete production readiness and client handoff review.
- Review caching/performance only after core business rules are stable and real usage or smoke-load results show a need.

## Main Features

### Customer Features

- Register and log in with email/password
- Sign in with Google when OAuth is configured
- View public products
- View product details
- Select available size/color variants when a product has active variants
- See discounted product prices when an admin discount is active
- See exact stock counts only when the admin enables customer stock visibility for that product
- Add products to cart after selecting an available size/color option
- Update cart item quantities
- Remove cart items
- Place cash-on-delivery orders
- Select delivery area / receive option during checkout
- Review product total, delivery price, and final total before confirming an order
- Receive a post-order message explaining that the store owner will confirm the order by WhatsApp or phone
- View public contact/support details from the shared contact config
- View own orders with capped pagination, including delivery details and selected size/color snapshots
- View and update profile information

### Admin Features

- Admin dashboard
- Manage products
- Filter, sort, and paginate admin products server-side
- Upload product images
- Archive and restore products
- Manage stock on size/color options; product stock is derived from active option stock
- Choose whether customers can see exact stock counts per product
- Manage product variants for clothing size/color combinations inside the product edit panel
- Manage variant-level stock for size/color options
- Add optional product discount prices
- Manage categories
- Filter, sort, and paginate admin categories server-side
- Safely delete categories only when no products are related
- View customer orders with contact and delivery details
- Filter and paginate admin orders server-side
- View order cards and open a details/edit panel for each order
- Confirm pending orders as an approval/status step without deducting stock again
- Update order status
- Update payment status
- Add internal order notes

## Security Model

This project follows these rules:

- Never trust the client.
- Frontend checks are only for user experience.
- Protected data and protected actions must be checked on the server.
- Admin actions must require server-side admin authorization.
- Customer data must be scoped to the logged-in user.
- Customer order history must use capped pagination instead of returning every order at once.
- API routes must validate request bodies, route params, and query params.
- API routes must not return password hashes, tokens, secrets, raw database errors, or stack traces.
- Secrets must stay server-side.
- OAuth client secrets must be stored only in local or hosting environment variables, never in Git.
- Google OAuth callback URLs must exactly match the current domain and Better Auth callback route.
- Google sign-in authenticates a user, but admin authorization must still come from the database `User.role`.
- Only variables starting with `NEXT_PUBLIC_` are exposed to the browser.
- This project should not expose secrets through `NEXT_PUBLIC_` variables.
- Prisma is used for database access instead of unsafe raw SQL.
- Passwords must never be stored in plain text.
- Rate limiting should be enabled for auth routes, public APIs, and protected mutation routes.
- Resend verification email requests must have a stricter backend rate limit, not only a frontend cooldown.
- CSRF or same-origin checks should protect cookie-based state-changing requests.
- Admin filters and pagination must be validated server-side; the frontend must not load everything and filter sensitive data locally.
- Product prices and stock decisions must be calculated on the server, not trusted from client-submitted values.
- Discount pricing must be validated server-side and order items must store price snapshots.
- Hiding stock counts from customers is display-only; backend stock validation must still run.
- Stock reservation/deduction must be protected against double deduction. Checkout reserves stock immediately; admin confirmation must not deduct stock again.
- Important business records such as orders should not be hard-deleted unless a separate retention/audit policy is reviewed.

## Requirements

Recommended:

- Node.js 20+
- npm
- Docker Desktop, for local PostgreSQL
- PostgreSQL, local through Docker or hosted in production
- Cloudinary account for production image uploads
- Upstash Redis database for production rate limiting
- SMTP provider for production emails

## Environment Variables

Create a `.env` file from `.env.example`.

On macOS/Linux/Git Bash:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Never commit `.env` or any file containing real secrets.

Required variables:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DB_NAME"

# Better Auth
BETTER_AUTH_SECRET="long-random-production-secret-at-least-32-characters"
BETTER_AUTH_URL="http://localhost:3000"

# Optional Google sign-in / OAuth
# Keep these empty if Google sign-in is not configured for this environment.
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# App URL used when generating email links
APP_URL="http://localhost:3000"

# SMTP email settings
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM_EMAIL=""
SMTP_FROM_NAME="Clothing Ecommerce Template"

# Email delivery mode
# Use "log" for local/staging without real SMTP sending.
# Use "smtp" for production after configuring a real SMTP provider.
EMAIL_DELIVERY_MODE="log"

# Upstash Redis rate limiting
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Cloudinary product image uploads
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
CLOUDINARY_PRODUCT_FOLDER="ecommerce-template-clothing/products"
```

For production, use the real deployed HTTPS domain:

```env
BETTER_AUTH_URL="https://your-domain.com"
APP_URL="https://your-domain.com"
```

Do not use local URLs in production:

```env
BETTER_AUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
```

If Google sign-in is enabled, each environment needs its own Google OAuth client or carefully separated OAuth credentials. The Google Cloud authorized redirect URI must exactly match the deployed domain and Better Auth callback path:

```txt
Local:      http://localhost:3000/api/auth/callback/google
Staging:    https://your-staging-domain.com/api/auth/callback/google
Production: https://your-domain.com/api/auth/callback/google
```

Do not commit real Google OAuth client secrets. Store them only in local `.env` files or hosting provider environment variables.

For Neon/PostgreSQL setups that use connection pooling, keep the application runtime URL and migration/direct URL separate:

```env
# Runtime / app connection, usually pooled if using Neon pooling
DATABASE_URL="postgresql://USER:PASSWORD@HOST-POOLER/DB_NAME?sslmode=require"

# Direct database connection for Prisma migrations
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DB_NAME?sslmode=require"
```

Do not commit real database URLs or credentials.

## Local Development Setup

Install dependencies:

```bash
npm install
```

Start the local PostgreSQL database:

```bash
docker compose up -d
```

Run local Prisma migrations:

```bash
npm run db:migrate:dev
```

Start the development server:

```bash
npm run dev
```

Open the app:

```txt
http://localhost:3000
```

## Database and Prisma

Use this for local development migrations against a local development database:

```bash
npm run db:migrate:dev
```

Use this when applying already-committed migrations to staging/production-style databases:

```bash
npm run db:migrate:deploy
```

Generate the Prisma client:

```bash
npm run db:generate
```

Open Prisma Studio locally:

```bash
npm run db:studio
```

Do not use `prisma db push` against production.

`db push` is only for local development or quick schema experiments. Production and staging should use committed Prisma migrations with `prisma migrate deploy`.

## Useful Scripts

Run unit tests once:

```bash
npm run test:run
```

Run unit tests in watch mode:

```bash
npm run test
```

Generate test coverage:

```bash
npm run test:coverage
```

Run Playwright E2E tests:

```bash
npm run test:e2e
```

Run Playwright E2E tests in headed browser mode:

```bash
npm run test:e2e:headed
```

Open Playwright UI mode:

```bash
npm run test:e2e:ui
```

Open the last Playwright HTML report:

```bash
npm run test:e2e:report
```

Start the local development server:

```bash
npm run dev
```

Build the production app:

```bash
npm run build
```

Start the production server after building:

```bash
npm run start
```

Run ESLint:

```bash
npm run lint
```

Run TypeScript type checking:

```bash
npm run typecheck
```

Run linting and type checking:

```bash
npm run check
```

Recommended local pre-merge checks:

```bash
npm run test:run
npm run typecheck
npm run lint
npm run build
```

Run local development migrations:

```bash
npm run db:migrate:dev
```

Apply committed migrations in staging or production:

```bash
npm run db:migrate:deploy
```

Generate the Prisma client:

```bash
npm run db:generate
```

Open Prisma Studio:

```bash
npm run db:studio
```

## Docker Development Database

The Docker Compose setup is for local development only.

Example local database URL:

```env
DATABASE_URL="postgresql://ecommerce_template_clothing:ecommerce_template_clothing_dev_password@localhost:5436/ecommerce_template_clothing"
```

Do not use the local Docker database for production.

Production should use a hosted PostgreSQL database with a private connection string stored in the deployment provider's secret/environment settings.

## Testing Flow

Recommended testing order:

```txt
unit tests -> manual staging testing -> Playwright E2E tests -> small load/smoke test after tooling/license review
```

Current unit testing stack:

- Vitest
- React Testing Library
- jsdom
- mocked Prisma / external services where needed

Current E2E testing stack:

- Playwright
- Chromium-only browser project for now
- staging-safe base URL
- one worker to avoid free-plan abuse
- saved Playwright auth state for customer/admin sessions
- screenshots, video, and traces only for failures/retries

Unit tests should not touch the staging or production database.

Playwright E2E tests currently run against staging or localhost only. The staging database contains disposable test data only.

Do not run heavy load tests against free staging services. For staging, keep any future load/smoke testing small and safe.

## Playwright E2E Testing

Playwright E2E tests live in:

```txt
tests/e2e/
```

Run all E2E tests:

```bash
npm run test:e2e
```

Run with a visible browser:

```bash
npm run test:e2e:headed
```

Open Playwright UI mode:

```bash
npm run test:e2e:ui
```

Open the latest HTML report:

```bash
npm run test:e2e:report
```

### Required Local E2E Environment

Create this local-only file:

```txt
.env.e2e.local
```

Required values:

```env
E2E_BASE_URL="http://localhost:3000"

E2E_CUSTOMER_EMAIL="test-customer@example.com"
E2E_CUSTOMER_PASSWORD="local-test-password"

E2E_ADMIN_EMAIL="test-admin@example.com"
E2E_ADMIN_PASSWORD="local-test-password"

E2E_PRODUCT_PATH="/products/example-product"
E2E_ORDER_PRODUCT_PATH="/products/example-product-with-stock"
E2E_DISCOUNT_PRODUCT_PATH="/products/example-discounted-product"
E2E_VISIBLE_STOCK_PRODUCT_PATH="/products/example-visible-stock-product"
E2E_HIDDEN_STOCK_PRODUCT_PATH="/products/example-hidden-stock-product"
```

Do not commit `.env.e2e.local`.

### E2E Safety Rules

- Run E2E tests only against staging or localhost.
- Do not run E2E tests against production.
- Do not commit Playwright auth state.
- Do not commit Playwright screenshots, videos, traces, or reports.
- Keep workers low to avoid abusing free staging services.
- Avoid image upload tests unless Cloudinary usage and cleanup are controlled.
- Avoid email inbox automation while `EMAIL_DELIVERY_MODE="log"`.
- Use dedicated test customer/admin accounts.
- Use products with enough stock for order tests.
- `E2E_ORDER_PRODUCT_PATH` should point to a disposable in-stock product that can safely be ordered during tests.
- `E2E_DISCOUNT_PRODUCT_PATH` should point to an active product with `discountPrice` set below the regular price.
- `E2E_VISIBLE_STOCK_PRODUCT_PATH` should point to an in-stock product with customer stock visibility enabled.
- `E2E_HIDDEN_STOCK_PRODUCT_PATH` should point to an in-stock product with customer stock visibility disabled.

### Playwright Auth State

The E2E suite saves logged-in customer/admin sessions under:

```txt
tests/e2e/.auth/
```

If login state becomes stale, delete that folder and rerun:

```bash
rm -rf tests/e2e/.auth
npm run test:e2e
```

On Windows PowerShell:

```powershell
Remove-Item -Recurse -Force tests/e2e/.auth
npm run test:e2e
```

### Current E2E Coverage

Current Playwright coverage includes:

- public homepage/products smoke tests
- customer login
- customer cart add/cleanup
- customer authenticated pages
- controlled customer order creation with delivery checkout confirmation
- customer order price snapshot checks using the server-calculated effective product price
- discounted product display checks
- customer stock visibility display checks
- guest auth guard behavior
- signed-in customer admin guard behavior
- admin read-only pages
- admin orders read-only API/page behavior
- admin products/categories/orders filter request smoke tests

## Staging Notes

The staging environment may use free plans while testing, such as Render free web service, Neon free Postgres, Upstash free Redis, Cloudinary free plan, and `EMAIL_DELIVERY_MODE="log"`.

Free services are for staging/testing only. Avoid heavy traffic, stress tests, or behavior that could violate provider limits.

Production should use paid/reliable hosting, paid or production-ready database backups, real SMTP configuration, and production secrets separate from staging.

## Production Observability

Unexpected server/API failures should produce a safe, searchable error reference ID such as `err_...`. When a customer or admin reports one of these IDs, search the deployment logs for that exact reference and review the route/action context.

Logging rules:

- Log the route/action and the generated error reference.
- Log safe identifiers when needed, such as order ID or admin/user ID.
- Do not log passwords, tokens, cookies, OAuth secrets, environment variables, database URLs, raw request bodies, or unnecessary customer personal data.
- Normal validation, authentication, and authorization failures should return safe messages and should not create noisy crash logs.

Route error boundaries provide cleaner user-facing failure screens for protected account, orders, and admin areas. They are not a replacement for server logs; they prevent raw technical details from being shown to users.

## Production Deployment Flow

Before deploying:

```bash
npm ci
npm run check
npm run build
```

Apply production migrations during deployment:

```bash
npm run db:migrate:deploy
```

Start the app:

```bash
npm run start
```

Depending on the hosting provider, migrations may run as a release command, deploy hook, or CI/CD step.

Important production rules:

- Do not manually edit the production database schema.
- Do not run `prisma migrate dev` in production.
- Do not run `prisma db push` in production.
- Always commit Prisma migration files.
- Back up the production database before the first real launch and before risky schema changes.

## Production Deployment Checklist

### Environment

- [ ] Production `.env` values are configured only in the hosting provider.
- [ ] `.env` is not committed.
- [ ] `DATABASE_URL` points to the production database.
- [ ] `BETTER_AUTH_SECRET` is long, random, and private.
- [ ] `BETTER_AUTH_URL` uses the real `https://` production domain.
- [ ] `APP_URL` uses the real `https://` production domain.
- [ ] If Google sign-in is enabled, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured only in the hosting provider.
- [ ] If Google sign-in is enabled, the Google Cloud OAuth client includes the exact production callback URL.
- [ ] SMTP credentials are production-ready.
- [ ] Upstash Redis variables are configured.
- [ ] Cloudinary variables are configured.
- [ ] No secret is exposed through a `NEXT_PUBLIC_` variable.

### Database

- [ ] All Prisma migrations are committed.
- [ ] Production uses `npm run db:migrate:deploy`.
- [ ] Production does not use `prisma db push`.
- [ ] Production does not use `prisma migrate dev`.
- [ ] A database backup plan exists.
- [ ] A rollback plan exists.

### Security

- [ ] Admin pages are protected server-side.
- [ ] Admin APIs check the `ADMIN` role server-side.
- [ ] Customer APIs check the logged-in user's ID server-side.
- [ ] Cart and order APIs are scoped to the authenticated user.
- [ ] CSRF / same-origin checks protect protected mutation routes.
- [ ] Rate limiting works in production with Upstash Redis.
- [ ] Security headers are active on the deployed app.
- [ ] API responses do not expose password hashes.
- [ ] API responses do not expose tokens or secrets.
- [ ] API responses do not expose raw stack traces or raw database errors.
- [ ] Login, registration, password reset, public product APIs, and protected mutation APIs are rate limited.
- [ ] OAuth sign-in does not grant admin privileges unless the database `User.role` is explicitly set to `ADMIN`.
- [ ] OAuth secrets are not committed and are not exposed through `NEXT_PUBLIC_` variables.

### Application Testing

- [ ] Register works on the deployed domain.
- [ ] Login works on the deployed domain.
- [ ] Google sign-in works on the deployed domain if OAuth is enabled.
- [ ] New Google sign-in users receive normal customer permissions only.
- [ ] Logout works on the deployed domain.
- [ ] Password reset emails work.
- [ ] Email verification flow works, if enabled.
- [ ] Public product listing works.
- [ ] Public product details work.
- [ ] Product stock count visibility follows the admin product setting.
- [ ] Variant products show selectable size/color choices without exposing internal inventory-only fields to customers.
- [ ] Out-of-stock or inactive variants cannot be ordered.
- [ ] The same product with different selected variants creates separate cart lines.
- [ ] Discounted products show old and new prices correctly.
- [ ] Cart totals use the server-calculated effective product price.
- [ ] Cart actions work while logged in.
- [ ] Checkout creates an order once.
- [ ] Checkout requires delivery area/details where applicable.
- [ ] Checkout confirmation dialog shows product total, delivery price, and final total.
- [ ] Checkout creates a pending order and reserves stock immediately.
- [ ] Admin confirmation approves the order without deducting stock again.
- [ ] Checkout/order item price snapshots use the server-calculated effective product price.
- [ ] Order items snapshot selected size/color for variant orders.
- [ ] Customer sees the WhatsApp/phone confirmation message after placing an order.
- [ ] Admin can confirm a pending order without changing stock again.
- [ ] Checkout fails clearly if stock is no longer enough.
- [ ] Cancelling an order restores reserved stock exactly once when stock was reserved.
- [ ] Duplicate checkout protection works.
- [ ] Customer orders page only shows the current user's orders.
- [ ] Customer orders API uses capped pagination and ignores forged user/customer query params.
- [ ] Customer orders page shows delivery details for the user's own orders.
- [ ] Admin products page works for admins.
- [ ] Admin product filters, sorting, pagination, archive/restore, stock update, variant management, and edit-scroll behavior work.
- [ ] Admin upload works for admins.
- [ ] Admin categories page works for admins.
- [ ] Admin category filters, sorting, pagination, and safe delete behavior work.
- [ ] Admin orders page works for admins.
- [ ] Admin order filters, pagination, card list, details panel, status updates, payment updates, notes, and confirm action work.
- [ ] Admin orders page shows customer contact and delivery details.
- [ ] Non-admin users cannot access admin APIs.
- [ ] Signed-out users cannot access protected APIs.

### Testing

- [ ] Unit tests pass with `npm run test:run`.
- [ ] TypeScript passes with `npm run typecheck`.
- [ ] ESLint passes with `npm run lint`.
- [ ] Production build passes with `npm run build`.
- [ ] Manual customer flow is tested on staging.
- [ ] Manual admin flow is tested on staging.
- [ ] Playwright E2E tests pass with `npm run test:e2e`.
- [ ] Playwright auth state and test artifacts are not committed.
- [ ] Any future load/smoke test is small, staging-safe, and reviewed for licensing/tooling risk before use.

### Repository

- [ ] `.env` files are ignored.
- [ ] `.env.example` is safe to commit.
- [ ] Generated Prisma files are not committed.
- [ ] `node_modules` is not committed.
- [ ] `.next` is not committed.
- [ ] README is up to date.
- [ ] First-client setup checklist is complete for this client.
- [ ] If this commit was deployed as a release, the matching Git tag exists and points to the deployed commit.
- [ ] Dependency licenses are reviewed before commercial delivery.

## Release Versioning

Use Git tags for deployed releases only. Do not describe a version as released or tagged until the tag has actually been created and pushed.

This clothing template repository starts as its own project. Do not reuse old source-repo tag claims. Create the first checkpoint tag only after the fork audit, docs cleanup, dependency review, and local checks pass in this repository.

Recommended version format:

```txt
v0.1.0-clothing-fork-audit  clothing fork audit checkpoint
v0.2.0-clothing-branding-config  safe clothing branding/config checkpoint
v0.3.0-product-variants-design  variants design documentation checkpoint
v0.4.0-admin-product-variants  admin variant management checkpoint
v0.5.0-customer-product-variants  customer variant ordering checkpoint
v0.6.0-checkout-stock-reservation  checkout-time stock reservation checkpoint
v1.0.0  first production clothing-store launch
v1.0.1  production bug fix
v1.1.0  small feature release
v2.0.0  major or breaking release
```

Use descriptive checkpoint tags before production when helpful, and reserve `v1.0.0` for the first real production launch.

Create a release tag only after checks pass and after the matching commit is merged/deployed:

```bash
npm run check
npm run build
git status
git tag -a v0.1.0-clothing-fork-audit -m "Clothing fork audit checkpoint"
git push origin v0.1.0-clothing-fork-audit
```

Replace `v0.1.0-clothing-fork-audit` with the version you actually intend to release. Tag the exact commit that is reviewed or deployed.

For production releases, prefer this flow:

```txt
feature branch -> pull request -> main -> deployment -> version tag
```

## Current Business Logic Notes

### Template Configuration

Public client-safe template values live in typed config files:

- `src/config/store.ts` for public store name, description, metadata, and localized logo text.
- `src/config/delivery.ts` for delivery areas, prices, labels, defaults, and receive/pickup-point rules.
- `src/config/contact.ts` for public support email, phone, WhatsApp, support hours, footer contact display, contact-page text, and public social links.
- `src/config/policies.ts` for public terms, privacy, shipping, returns, contact policy copy, last-updated labels, and legal-page footer labels.

Only public display and storefront policy values belong in these files. Secrets, SMTP credentials, OAuth credentials, database URLs, private webhooks, internal admin-only contacts, and private client agreements must stay out of source code and in the correct server-side environment/secrets system. Public policy copy in the template is placeholder text, not legal advice, and must be reviewed/replaced for each client before launch.

### Checkout and Delivery

Delivery areas/prices currently live in code configuration, not in an admin-editable database table.

Current delivery options:

- Nablus receive/pickup point: 0 NIS
- West Bank cities: 20 NIS
- Jerusalem: 30 NIS
- 48 lands: 70 NIS
- West Jerusalem + Ein Rafa + Ein Naqouba + Abu Ghosh: 45 NIS

Orders store a snapshot of the selected delivery area, delivery price, city/address/details, notes, and pickup agreement status. This is intentional so old orders remain historically accurate even if delivery prices change later.

### Current Stock Reservation Flow

The current order flow is:

1. Customer places an order.
2. Checkout validates product, variant, stock, delivery, and pricing server-side inside a database transaction.
3. The order is created as `PENDING`.
4. Checkout immediately reserves/decreases stock.
5. Orders deduct the selected `ProductVariant.stock`.
6. Product-level stock is not customer-orderable; public product stock is derived from active variant stock.
7. The store owner confirms the order by WhatsApp or phone and moves it to processing without deducting stock again.
8. If the order is cancelled, the same stock source is restored exactly once when stock was reserved.

Stock reservation is tracked with `stockDeductedAt`, which now means inventory has already been reduced for the order. This marker prevents double deduction and controls whether cancellation should restock.

Known next hardening checkpoint:

- Complete final local, E2E, and staging verification for the post-reservation audit branch before merging.

### Filtering and Pagination

Admin orders, products, and categories use server-side filters and capped pagination instead of loading every record into the browser. Customer order history also uses capped pagination. This keeps dashboards and account pages faster as data grows and avoids exposing or loading more data than the current screen needs.

### Order Retention

Cancelled orders are not hard-deleted or archived by default. Keeping order history visible is safer for audit, customer support, inventory debugging, and dispute handling.

### Stock Visibility Control

Admins can choose whether customers can see exact stock counts per product. This is a display choice only; backend stock validation still runs regardless of whether the count is visible to customers. Public APIs must not expose exact product or variant stock when stock visibility is disabled; they should expose availability booleans instead.

### Product Discounts

Admins can add an optional discounted price to products. Customers see the discounted price with the original price shown as the old price, and order items keep price snapshots so historical orders do not change if product prices or discounts change later.

The server calculates the effective product price for cart/order totals. The client must not be trusted to submit product prices or discount values.

### Product Variants Status

This template now includes clothing variant support for size/color combinations.

Implemented:

- Prisma schema and migrations for `ProductVariant` records.
- Admin-managed variants inside the product edit panel.
- Variant-level stock fields and active/inactive variant status.
- Customer product pages can require variant selection for products with active variants.
- Cart rows can identify the selected variant, so the same product can appear as separate size/color lines.
- Checkout validates product/variant availability server-side.
- Order items snapshot selected size/color values so historical orders remain accurate after variant edits.
- Checkout-time reservation deducts from the selected `ProductVariant.stock`.

Customer-facing rule:

- Customers should see size/color and availability. Barcode-style inventory workflows are intentionally out of scope for this template right now.

Stock-source rule:

- Customer-orderable stock uses `ProductVariant.stock` as the source of truth.
- Product-level stock is derived from active variant stock for storefront display.
- Products need at least one active in-stock option before customers can order them.

Current stock-reservation rule:

- Checkout reserves stock immediately in a transaction.
- Admin confirmation does not deduct stock again.
- Admin cancellation restores reserved stock exactly once.

See `docs/product-variants-plan.md` and `docs/product-variants-design-contract.md` before changing variant/order behavior.

### Google Sign-in

Google sign-in is supported through Better Auth OAuth configuration while email/password authentication remains available. Google OAuth credentials are optional per environment, so the app can run without Google sign-in when `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is not configured.

Google authentication does not decide admin access. Admin permissions still come from the database-backed user role and must be enforced by server-side authorization checks.

Each deployed environment needs the correct Google OAuth callback URL:

```txt
http://localhost:3000/api/auth/callback/google
https://your-staging-domain.com/api/auth/callback/google
https://your-production-domain.com/api/auth/callback/google
```

### Planned Delivery Pricing Dashboard

Delivery areas/prices still live in code configuration. The next safe improvement is to move them to an admin-managed database table while preserving the existing order delivery area/price snapshots for audit-safe historical orders.

## Branch Workflow

Use feature branches for changes:

```bash
git switch main
git pull origin main
git switch -c feature-name
```

After changes are tested:

```bash
npm run check
npm run build
git status
git add path/to/changed-file path/to/another-changed-file
git commit -m "clear commit message"
git push -u origin feature-name
```

Open a pull request, review the changes, then merge into `main`.

Do not make production changes directly on `main` unless it is an emergency hotfix.

## Authentication and Authorization

Authentication answers:

```txt
Who is the user?
```

Authorization answers:

```txt
What is this user allowed to do?
```

This project must check both.

Examples:

- A signed-in customer can access their own cart.
- A signed-in customer must not access another customer's cart or orders.
- A signed-in customer must not access admin APIs.
- An admin can access admin APIs.
- Hiding admin buttons in the frontend is not enough.

Protected server routes and API routes must always check authorization server-side.

## File and Secret Safety

Do not commit:

```txt
.env
.env.local
.env.production
.env.staging
.env.backup
.env.e2e.local
node_modules/
.next/
generated/
tests/e2e/.auth/
test-results/
playwright-report/
blob-report/
```

Safe to commit:

```txt
.env.example
prisma/schema.prisma
prisma/migrations/
src/
public/
README.md
package.json
package-lock.json
```

## Email Delivery Notes

For local development and staging, use:

```env
EMAIL_DELIVERY_MODE="log"
```

This prevents real emails from being sent while still allowing the app to test email flows safely.

For production, configure a real SMTP provider and use:

```env
EMAIL_DELIVERY_MODE="smtp"
```

Do not use personal Gmail SMTP for production client email. Use a real transactional email provider and verify the sending domain.

## Client Handoff and Launch Docs

Additional handoff documents live in:

```txt
docs/clothing-template-roadmap.md
docs/product-variants-plan.md
docs/first-client-setup-checklist.md
docs/client-handoff.md
docs/production-readiness-checklist.md
```

Use these documents during first-client setup and final client review so the client-specific configuration stays safe, the client understands what they can manage, environment values stay private, and launch checks pass before real customer traffic.

## Legal and Licensing Notes

Before commercial delivery:

- Review dependency licenses.
- Review image/icon/font licenses.
- Do not use paid templates, copied UI kits, or proprietary assets without permission.
- Do not commit licensed assets unless the client has the right to use them.
- Keep proof of license or permission for commercial assets.

## Project Notes

This app is still being hardened for production as a clothing-store template. It has passed the typed store/delivery/contact/policy config, checkout delivery, admin category, checkout-time stock reservation, admin order approval, admin filtering, customer stock visibility, product discount, Google sign-in, product variant foundation, admin variant management, customer variant ordering, critical E2E coverage, production-safe API logging, and route error boundary checkpoints, but it should not be treated as fully production-ready until a full security review, the production environment, launch checklist, staging tests, and client review are complete.

Next safest checkpoints:

1. Review checkout-time stock reservation for variant/option orders on staging.
2. Verify admin confirmation is an approval step that does not deduct stock again.
3. Verify reserved stock is restored exactly once when an order is cancelled.
4. Run a full security review after the stock-reservation flow is stable.
5. Verify Google sign-in on staging/production with exact callback URLs and separate environment secrets if OAuth is enabled for the client.
6. Complete the production readiness checklist and client handoff guide.
7. Review caching/performance after launch testing or measured usage shows a real need.

Before launch, complete the production deployment checklist, review the handoff docs with the client, and test the full customer and admin flows on the deployed domain.
