# Clothing Template Roadmap

This roadmap keeps the clothing-store template honest and production-safe. Do not advertise a feature to clients until it is implemented, tested, documented, and reviewed for security and handoff impact.

## Current Safe Base

The current app supports a normal clothing storefront with product-level inventory:

- public product listing and product detail pages
- email/password auth and optional Google sign-in
- cart and cash-on-delivery order flow
- delivery area selection with delivery price snapshots
- admin product/category/order management
- product-level stock management
- optional product-level discounts
- optional customer-visible stock counts
- public contact, delivery, and policy config

## First Clothing Fork Checkpoint

Before changing product logic, complete this fork audit:

- [ ] README describes this repo as a clothing-store template.
- [ ] Old copied-repo tag/version claims are removed.
- [ ] No old non-clothing product-category wording or client-specific branding remains unless intentionally generic.
- [ ] `.env.example` contains only safe placeholders.
- [ ] `.env`, `.env.e2e.local`, `.next`, `node_modules`, Playwright auth state, reports, and test artifacts are ignored and untracked.
- [ ] Public config files contain only public client-safe values.
- [ ] Public policy text is clearly placeholder copy and not legal advice.
- [ ] Asset/license notes are clothing-store focused.
- [ ] No unfinished feature is advertised as implemented.
- [ ] Product variants are documented as planned/design-needed, not supported.

## Supported Now

These are safe to offer after normal client setup and launch testing:

- clothing-store branding through typed config
- product/category/order admin management
- cash-on-delivery order workflow
- delivery price snapshots
- product-level stock and discounts
- client-specific policy/contact copy after review

## Planned Later

These require separate design and implementation checkpoints:

1. **Product variants for sizes/colors**
   - Must be designed before migrations.
   - Stock should usually live on the variant, not only the product.
   - Cart and order snapshots must include selected variant details.
   - See `docs/product-variants-plan.md`.

2. **Safer clothing frontend polish**
   - Use original copy and client-owned assets only.
   - Avoid paid UI kits, copied templates, unclear-license images, and proprietary snippets.

3. **Minimal PWA, only if intentionally chosen later**
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

After this audit, the next safe technical step is usually improving typed clothing branding/homepage config, not variants. Variants should start only after the schema, data flow, stock rules, cart identity, order snapshots, admin UI, and tests are reviewed.
