# Product Variants Plan

Product variants are planned for clothing sizes/colors, but they are not customer-facing yet. This document exists so the feature is designed safely before checkout, cart, order, or admin UI changes.


## Design Contract

The first safe implementation contract is documented in:

```txt
docs/product-variants-design-contract.md
```

Treat that contract as the source of truth before starting any Prisma migration or runtime code change. The contract currently chooses a boring v1 direction: one `ProductVariant` per purchasable size/color combination, product-level pricing for v1, variant-level stock, cart rows keyed by selected variant, and order item snapshots for selected variant labels.

## Current Status

Current storefront behavior still uses product-level stock. A customer adds a product to the cart without choosing a size or color. Orders snapshot product name and effective product price, but they do not snapshot selected size/color yet.

The first implementation checkpoint may add the `ProductVariant` database foundation, but variants must still not be advertised as supported until cart, checkout, order snapshots, admin UI, and tests are implemented and reviewed.

## Goals

A safe variant implementation should support:

- sizes such as XS, S, M, L, XL, or client-defined labels
- colors such as Black, White, Beige, Navy, or client-defined labels
- variant-level availability
- variant-level stock
- cart items tied to a chosen variant
- checkout validation that rejects unavailable or out-of-stock variants
- order item snapshots that preserve selected variant details forever
- admin management that is clear enough for small clothing stores

## Non-Goals For The First Variant Checkpoint

Do not include these in the first variant implementation unless deliberately approved later:

- POS integration
- online payments
- barcode/scanning workflows
- supplier inventory sync
- CSV import
- advanced bundles
- coupons
- per-size pricing unless strongly needed
- multi-warehouse inventory

## Data Model Questions To Resolve First

Before writing a migration, decide:

1. Should a product have many variants where each variant is one size/color combination?
2. Should size and color be free-text labels, controlled config values, or database-managed options?
3. Should each variant have its own stock count? Usually yes.
4. Should a variant be independently archived/disabled?
5. Should a product remain orderable if it has no variants?
6. How will existing product-level stock migrate?

## Likely Safer First Schema Direction

A boring first design is usually:

- `Product` remains the parent record.
- `ProductVariant` stores one purchasable size/color combination.
- `ProductVariant.stock` controls available quantity.
- `ProductVariant.isActive` controls whether the combination can be purchased.
- `CartItem` references `productVariantId`, not only `productId`, when variants are enabled.
- `OrderItem` snapshots product name, variant labels, unit price, and quantity.

This needs careful migration planning because the current cart/order flow is product-based.

## Required Data Flow

### Product Page

1. Server returns product and active variants.
2. UI only allows selectable combinations that are active and in stock.
3. Add-to-cart submits only identifiers, such as `productId` and `variantId`, never price or stock.

### Cart API

1. API validates the logged-in user.
2. API validates `variantId`.
3. API checks that the variant belongs to the product.
4. API checks variant availability and stock.
5. API stores cart rows uniquely by user + variant.
6. API calculates prices server-side.

### Checkout / Order API

1. API reloads cart from the database.
2. API validates all selected variants again.
3. API calculates product totals and delivery totals server-side.
4. API creates order and order items in a transaction.
5. Order items snapshot product name, selected size/color labels, unit price, and quantity.
6. Stock should decrease during checkout-time reservation, and admin confirmation must not deduct stock again.

### Admin Confirmation

1. Admin confirms pending order.
2. Transaction checks each variant stock.
3. Stock decreases per variant exactly once.
4. If stock is insufficient, confirmation fails clearly.
5. Duplicate checkout/admin confirmation must not double-deduct stock.

## Security Requirements

- Never trust client-submitted price, discount, stock, or availability.
- Never trust hidden/disabled frontend buttons as security.
- Admin APIs must require server-side `ADMIN` authorization.
- Customer APIs must scope cart and orders to the logged-in user.
- Variant IDs must be validated against the database.
- Order snapshots must preserve historical variant details after product edits.
- Logs must not expose secrets, cookies, tokens, or full customer PII-heavy request bodies.

## Required Tests

Unit/API tests should cover:

- unavailable variant cannot be added to cart
- out-of-stock variant cannot be added to cart
- cart uniqueness is per selected variant
- checkout rejects stale/unavailable variants
- order snapshots include selected size/color labels
- checkout reservation deducts correct variant stock
- double confirmation does not double-deduct
- insufficient stock blocks confirmation
- non-admin users cannot manage variants

E2E tests should cover the critical happy path and one or two failure paths:

- customer selects size/color and adds to cart
- customer checks out with selected variant
- customer order page shows selected size/color
- customer places order and stock decreases once; admin confirmation does not change stock again
- unavailable variant cannot be ordered

## Migration Safety

Before a migration:

- back up staging/production data
- decide how existing products get default variants or remain product-level temporarily
- avoid destructive changes in the first migration
- keep old order snapshots readable
- run unit tests, E2E tests, typecheck, lint, and build

## Recommended Implementation Order

1. Finalize schema design in a PR discussion.
2. Add the additive `ProductVariant` database foundation only.
3. Add product API read support for active variants.
4. Add server validation schemas for variant input.
5. Update cart API and cart UI to require selected variants where needed.
6. Update checkout/order API and order item snapshots.
7. Update admin product UI for variant management.
8. Update checkout reservation and admin cancellation stock logic for variants.
9. Add unit/API tests.
10. Add focused E2E tests.
11. Update handoff docs.

Do not combine this with frontend redesign, PWA, payment, POS, or other unrelated features.

## Admin Variant Management Checkpoint

The next implemented checkpoint adds admin-only product variant management. It should remain intentionally separate from customer cart/order support.

Implemented scope for this checkpoint:

- admin-only variant create/update/deactivate APIs
- server-side validation for size label, color label, stock, active state, and sort order
- normalized `sizeKey` / `colorKey` generation in the API layer
- duplicate size/color combination protection through the database unique constraint
- admin product responses include variants for management screens
- admin UI can add, edit, and deactivate variants while clearly warning that checkout still uses product-level stock

Still not implemented after this checkpoint:

- customer variant selector
- `CartItem.productVariantId`
- variant-aware checkout validation
- order item variant snapshots
- variant stock deduction during checkout reservation
- variant-aware cancellation/restock behavior

Do not advertise customer-facing size/color ordering until the cart, order, stock-confirmation, and E2E checkpoints are complete.


## Admin Variant Edit Panel Cleanup

Variant editing should live inside the selected product edit panel, not inside every product card in the paginated list. The product list should stay lightweight for searching, filtering, archiving/restoring, and quick product-level stock updates during the transition period.

This checkpoint keeps variants admin-only but improves the admin mental model:

- click **Edit** on a product before managing its variants
- show current `Product.stock` as the stock source still used by checkout today
- show active variant stock total as the future clothing inventory summary
- do not auto-sync `Product.stock` from variants yet because variant products use selected `ProductVariant.stock` as the source of truth

Final clothing variant behavior should use the sum of active variant stock as the displayed product stock summary for variant-enabled products, while stock reservation happens on the selected `ProductVariant`. That should happen only after cart rows, order snapshots, checkout validation, and admin cancellation all store/use `productVariantId` safely.

## Customer variant ordering checkpoint

Customer ordering is now intended to be variant-aware:

- Simple products continue to use `Product.stock`.
- Products with active variants require the customer to choose a variant before adding to cart.
- Variant products use `ProductVariant.stock` as the checkout reservation and cancellation stock source.
- Public product listing/detail stock should display the sum of active variant stock when a product has variants.
- Cart rows are keyed by a stable `cartLineKey` so the same product can appear as separate size/color lines.
- Order items snapshot selected size and color so historical orders stay accurate after variant edits.
- Checkout reservation deducts `ProductVariant.stock` for variant order items and still deducts `Product.stock` for simple products.

This checkpoint still keeps product-level pricing only. Variant-specific prices, image-per-variant, CSV import, POS, payments, coupons, SMS, and PWA remain out of scope.
