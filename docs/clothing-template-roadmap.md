# Clothing Template Roadmap

This roadmap keeps the clothing-store template honest and production-safe. Do not advertise a feature to clients until it is implemented, tested, documented, and reviewed for security and handoff impact.

## Current Safe Base

The current app supports a normal clothing storefront with implemented size/color variant ordering:

- public product listing and product detail pages
- email/password auth and optional Google sign-in
- cart and cash-on-delivery order flow
- delivery area selection with delivery price snapshots
- admin product/category/order management
- product size/color variants
- variant-level customer-orderable stock
- variant selection on product pages
- variant-aware cart lines
- order item size/color snapshots
- checkout-time stock reservation
- optional product-level discounts
- optional customer-visible stock counts
- public contact, delivery, and policy config

## First Clothing Fork Checkpoint

Before using this as a reusable demo or client base, complete this fork audit:

- [ ] README describes this repo as a clothing-store template.
- [ ] Old copied-repo tag/version claims are removed.
- [ ] No old non-clothing product-category wording or client-specific branding remains unless intentionally generic test fixture data.
- [ ] `.env.example` contains only safe placeholders.
- [ ] `.env`, `.env.e2e.local`, `.next`, `node_modules`, Playwright auth state, reports, and test artifacts are ignored and untracked.
- [ ] Public config files contain only public client-safe values.
- [ ] Public policy text is clearly placeholder copy and not legal advice.
- [ ] Asset/license notes are clothing-store focused.
- [ ] No unfinished feature is advertised as implemented.
- [ ] Product variants are documented as implemented, tested, and still requiring careful client data setup.

## Supported Now

These are safe to offer after normal client setup and launch testing:

- clothing-store branding through typed config
- product/category/order admin management
- cash-on-delivery order workflow
- delivery price snapshots
- size/color product variants
- variant-level stock
- variant-aware cart and order snapshots
- checkout-time stock reservation
- product-level discounts
- client-specific policy/contact copy after review

## Planned Later

These require separate design and implementation checkpoints:

1. **Render demo/staging verification**
   - Use disposable staging accounts, products, images, database, Redis, and Cloudinary resources.
   - Keep SMTP in log mode unless intentionally testing a real provider.
   - Do not run heavy load tests or E2E tests against production.

2. **Light UI, accessibility, and license review**
   - Verify mobile layout, keyboard focus states, RTL, icon accessible names, and public placeholder behavior.
   - Use original copy and client-owned assets only.
   - Avoid paid UI kits, copied templates, unclear-license images, and proprietary snippets.

3. **Broader production-readiness/security audit**
   - Recheck auth, authorization, CSRF/same-origin checks, rate limiting, logging, caching, stock reservation, cancellation restore, and customer ownership rules after staging is stable.

4. **Minimal PWA, only if intentionally chosen later**
   - Manifest-only or near-manifest-only first.
   - Do not cache authenticated pages, cart, orders, admin, profile, stock-sensitive data, or price-sensitive data.

## Intentionally Out of Scope For Now

Do not build or sell these as included features yet:

- multi-tenant SaaS
- Basic/Pro feature-plan enforcement
- POS integration
- online payment gateways
- SMS
- coupons
- accounting integration
- delivery-company integration
- CSV import
- complex PWA/offline behavior

## Safe Next Step

After this audit branch, the next safe step is Render demo/staging verification with disposable data. Do not change checkout, cart, order, stock reservation, Prisma schema, admin authorization, CSRF, rate limiting, or backend validation during the staging-docs cleanup unless a specific issue is found and reviewed first.
