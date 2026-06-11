# Product Variants Design Contract

This contract defines the first safe product-variant implementation for the clothing ecommerce template.

It is a design document only. Do not treat variants as implemented until the Prisma migration, APIs, UI, admin flow, unit tests, E2E tests, and handoff docs are all updated and reviewed.

## Decision summary

For the first production-safe clothing variant checkpoint:

- A `Product` remains the parent storefront record.
- A `ProductVariant` represents one purchasable option, usually one size/color combination.
- Stock moves to `ProductVariant.stock` for variant products.
- Cart rows reference the selected `ProductVariant`.
- Order items snapshot selected variant details forever.
- Product-level pricing remains the source of price for v1 unless we explicitly approve variant-level pricing later.
- Stock is still deducted only when an admin confirms the order, not when the customer places the order.
- Existing simple products need a compatibility/migration path; old orders must remain readable.

## Non-goals for v1

Do not include these in the first variant implementation:

- online payments
- POS integration
- barcode scanning
- supplier/inventory sync
- CSV import/export
- coupons
- bundles
- variant-level discounts
- per-size/per-color pricing
- multi-warehouse inventory
- customer size guide logic
- AI/image-based fit recommendations
- PWA caching changes
- multi-tenant SaaS or plan enforcement

## Current constraints from the copied template

The current code is safe for simple products, but it is product-level:

- `Product.stock` is the only stock source.
- `CartItem` is unique by `userId + productId`.
- `OrderItem` snapshots product name, slug, image list, unit price, and subtotal.
- `OrderItem` does not snapshot size, color, SKU, or variant label.
- Admin confirmation deducts `Product.stock`.
- Cancelling an already-confirmed order restores `Product.stock`.

Those rules cannot support clothing variants safely because a customer must be able to order multiple options of the same product, such as:

```txt
Classic cotton t-shirt / Black / M
Classic cotton t-shirt / Black / L
Classic cotton t-shirt / White / M
```

## Proposed Prisma model direction

The first migration should be additive and compatibility-first.

Proposed foundation model:

```prisma
model ProductVariant {
  id String @id @default(cuid())

  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  sizeLabel  String? @db.VarChar(40)
  colorLabel String? @db.VarChar(80)

  sizeKey  String @default("") @db.VarChar(40)
  colorKey String @default("") @db.VarChar(80)

  sku       String? @unique @db.VarChar(80)
  stock     Int     @default(0)
  isActive  Boolean @default(true)
  sortOrder Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([productId, sizeKey, colorKey])
  @@index([productId])
  @@index([isActive])
  @@index([sortOrder])
}
```

`sizeKey` and `colorKey` are normalized keys used for database uniqueness. They avoid PostgreSQL nullable-unique edge cases where multiple `NULL` labels could otherwise allow duplicate default combinations for the same product. Future admin/API code should generate these keys from the submitted labels.

Recommended `Product` addition:

```prisma
model Product {
  variants ProductVariant[]
}
```

Recommended `CartItem` transition:

```prisma
model CartItem {
  productId        String
  product          Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  productVariantId String?
  productVariant   ProductVariant? @relation(fields: [productVariantId], references: [id], onDelete: Cascade)

  @@unique([userId, productVariantId])
}
```

Recommended `OrderItem` additions:

```prisma
model OrderItem {
  productVariantId String?
  productVariant   ProductVariant? @relation(fields: [productVariantId], references: [id], onDelete: SetNull)

  variantLabelAtPurchase String?
  sizeLabelAtPurchase    String?
  colorLabelAtPurchase   String?
  skuAtPurchase          String?
}
```

### Open migration question: nullable or required `productVariantId`

The first migration should probably make `CartItem.productVariantId` nullable temporarily so old/simple cart rows do not break during deploy.

However, after the migration and compatibility layer are reviewed, the app should move toward this rule:

```txt
new cart items for variant-enabled products must include productVariantId
```

If we decide every product should get a default variant, a later migration can make `productVariantId` required for all cart rows. Do not make it required in the first migration unless we have a tested backfill strategy.

## Size/color modeling decision

Use plain labels in `ProductVariant` for v1:

```txt
sizeLabel: "S", "M", "L", "XL"
colorLabel: "Black", "White", "Beige"
```

Reason:

- Small clothing stores need simple admin forms.
- It avoids a large option/option-value schema before we know real client needs.
- It is easier to snapshot labels into orders.
- It keeps the first migration understandable.

Do not add separate `Size`, `Color`, `ProductOption`, or `ProductOptionValue` tables in v1 unless a real requirement forces it.

## Pricing decision

For v1, keep pricing at product level:

```txt
unit price = product.discountPrice ?? product.price
```

Do not add variant-level price or variant-level discount in v1.

Reason:

- The current pricing system is already server-controlled and tested.
- Variant-level pricing increases admin complexity.
- Clothing size/color usually changes stock, not price, for small stores.

If variant-level pricing becomes necessary later, it should be a separate checkpoint with its own price snapshot tests.

## Availability rules

A variant is customer-orderable only when all are true:

```txt
product.isArchived === false
variant.isActive === true
variant.stock > 0
requested quantity <= variant.stock
```

Frontend disabled buttons are only UX. The API must enforce the same rules server-side.

## Product API contract

Public product detail responses should include active variants for customer selection.

Recommended customer-safe shape:

```ts
type PublicProductVariant = {
  id: string;
  sizeLabel: string | null;
  colorLabel: string | null;
  stock: number;
  isActive: boolean;
};
```

For products where exact stock is hidden, the API can still return enough data for availability selection, but the UI should not expose exact stock counts unless the product's `showStock` allows it.

A safer response shape may separate display from validation data:

```ts
type PublicProductVariant = {
  id: string;
  sizeLabel: string | null;
  colorLabel: string | null;
  isAvailable: boolean;
  displayStock: number | null;
};
```

Recommended rule:

```txt
Return exact variant stock to customers only when product.showStock is true.
```

The backend must still validate real stock even when `displayStock` is `null`.

## Cart API contract

Future `POST /api/cart/items` request for variant products:

```ts
type AddCartItemRequest = {
  productId: string;
  productVariantId: string;
  quantity: number;
};
```

Server rules:

1. Require authenticated user.
2. Validate same-origin/CSRF protection.
3. Rate limit the mutation.
4. Validate `productId`, `productVariantId`, and `quantity`.
5. Load the product and variant in the same transaction.
6. Verify the variant belongs to the product.
7. Reject archived products.
8. Reject inactive variants.
9. Reject insufficient variant stock.
10. Merge cart rows by `userId + productVariantId`, not only `userId + productId`.
11. Never trust price, discount, stock, variant label, or availability from the browser.

Compatibility rule:

```txt
If a product has no variants during the transition period, the old product-level add-to-cart path may remain temporarily, but it must not be used for variant-enabled products.
```

## Cart display/update contract

Cart APIs and UI must display the selected variant details:

```txt
Product name
Size label
Color label
SKU, if present and useful for admin/customer support
Quantity
Server-calculated unit price
Line subtotal
```

Quantity updates must check `ProductVariant.stock`, not `Product.stock`, for variant cart rows.

Deleting a cart row remains row-based and should not need major changes.

## Checkout/order contract

Order creation must continue to be transaction-based and server-controlled.

For each cart item:

1. Reload product and variant from the database.
2. Reject missing products/variants.
3. Reject archived products.
4. Reject inactive variants.
5. Reject insufficient variant stock.
6. Calculate the effective product price server-side.
7. Create `OrderItem` snapshots with product and selected variant labels.
8. Clear the cart only after the order is created successfully.
9. Do not deduct stock yet.

Recommended order item snapshot fields:

```txt
productNameAtPurchase
productSlugAtPurchase
productImagesAtPurchase
variantLabelAtPurchase
sizeLabelAtPurchase
colorLabelAtPurchase
skuAtPurchase
priceAtPurchase
subtotalAmount
quantity
```

`variantLabelAtPurchase` can be generated server-side, for example:

```txt
Black / M
M
Black
Default
```

Old order items without variant fields must still render safely.

## Admin confirmation stock contract

Admin confirmation currently deducts stock when an order moves from `PENDING` to `PROCESSING`. Keep that business rule for v1.

For variant order items:

1. Require server-side admin authorization.
2. Validate same-origin/CSRF protection.
3. Rate limit the mutation.
4. Load the order and item variant IDs inside a transaction.
5. Confirm only legal status transitions.
6. For each variant item, decrement `ProductVariant.stock` with a guarded `updateMany` condition:

```txt
id = item.productVariantId
isActive = true
stock >= item.quantity
```

7. If any decrement fails, abort the transaction and show a clear admin error.
8. Set `stockDeductedAt` once.
9. Prevent double deduction if two admin requests race.

Cancellation after confirmation should increment the same `ProductVariant.stock` back when `stockDeductedAt` is set.

Compatibility rule:

```txt
Old/simple order items without productVariantId may continue using product-level stock restoration/deduction until all simple products are migrated or intentionally supported.
```

## Admin product management contract

The first admin variant UI should be boring and explicit.

Recommended v1 admin fields per variant:

```txt
Size label
Color label
SKU, optional
Stock
Active/inactive
Sort order, optional or hidden initially
```

Admin validation rules:

- product name, slug, price, category, and images stay product-level
- variant stock must be a non-negative integer
- at least one label or a generated default variant should exist for purchasable products
- no duplicate size/color combination for the same product
- SKU must be unique when provided
- inactive variants cannot be added to cart
- archived products make all variants unavailable for customers

Admin UX rules:

- clearly show which stock number belongs to which size/color
- avoid one giant free-text blob for variants
- warn before removing/deactivating a variant that may be in carts or historical orders
- prefer deactivation over hard delete for variants that were ordered before

## Migration phases

### Phase 1: additive schema foundation

Add `ProductVariant` and the `Product.variants` relation only.

Do not add `CartItem.productVariantId` or `OrderItem.productVariantId` in this first checkpoint. Those fields require coordinated API, UI, stock-confirmation, and snapshot changes.

Do not remove `Product.stock` yet. Runtime behavior should continue using product-level stock until the variant-aware checkpoints are implemented and tested.

### Phase 2: backfill/default variants

For each active product, create a default variant using the current product-level stock.

Possible default:

```txt
sizeLabel = null
colorLabel = null
variantLabel = "Default"
stock = Product.stock
isActive = true
```

This phase allows existing simple products to keep working while the UI learns variants.

### Phase 3: cart/order references and API compatibility layer

Add nullable `CartItem.productVariantId` and `OrderItem.productVariantId`, then update product, cart, checkout, order, and admin status APIs to understand variant rows.

For new cart items:

```txt
variant-enabled product => productVariantId required
legacy/simple product => temporary product-level fallback allowed only if reviewed
```

### Phase 4: admin variant UI

Add admin controls to create/edit/deactivate variants.

Avoid hard deletion if the variant has order history.

### Phase 5: tests and docs

Add unit/API/E2E coverage before advertising variants.

### Phase 6: cleanup decision

After the first client-safe variant release, decide whether to:

- keep product-level stock as a legacy summary/fallback field, or
- remove/ignore `Product.stock` in a later migration.

Do not remove `Product.stock` in the first migration.

## Required unit/API tests

Add tests for:

- cart add rejects missing variant for variant-enabled product
- cart add rejects variant that does not belong to product
- cart add rejects inactive variant
- cart add rejects out-of-stock variant
- cart add merges rows by selected variant
- two variants of the same product can exist as separate cart lines
- cart quantity update validates variant stock
- checkout rejects stale inactive/missing variant
- checkout snapshots size/color/SKU labels
- checkout total still uses server-calculated product effective price
- customer order response includes selected variant snapshot
- admin confirmation decrements variant stock once
- admin confirmation blocks insufficient variant stock
- duplicate/racing confirmation does not double-deduct
- cancellation after confirmation restores variant stock once
- non-admin users cannot manage variants
- public API does not expose exact variant stock when `showStock` is false, if that rule is adopted

## Required E2E tests

Add focused E2E coverage for:

- customer selects size/color and adds to cart
- cart shows selected size/color
- same product with two different variants appears as two cart rows
- customer places an order with selected variant
- customer orders page shows selected size/color snapshot
- unavailable/out-of-stock variant cannot be ordered
- admin confirms a variant order and stock decreases once

Keep E2E staging-safe:

- use disposable products
- avoid real payment
- avoid real inbox automation
- avoid image upload unless Cloudinary cleanup is controlled
- avoid heavy test load on free staging services

## Deployment and rollback notes

Before applying a variant migration to staging/production:

- back up the database
- run the migration on a disposable copy first if possible
- test local migration and rollback path
- seed or create test products with multiple variants
- run unit tests, typecheck, lint, build, and focused E2E
- manually test customer cart/order and admin confirmation

Rollback warning:

```txt
Once real orders include variant snapshot fields, rolling back code that cannot display those fields may degrade customer/admin support views.
```

Avoid destructive migrations until the variant release is stable.

## Handoff impact

Client handoff docs must explain:

- how to create sizes/colors
- how stock works per variant
- why old orders keep old selected size/color labels
- why deactivating a variant is safer than deleting it
- why price and stock are validated server-side
- why checkout may reject a variant that looked available earlier

## Approval checklist before implementation

Do not start the migration branch until these are accepted:

- [x] ProductVariant foundation model direction accepted.
- [ ] Product-level pricing for v1 accepted.
- [ ] Plain size/color labels for v1 accepted.
- [ ] `CartItem` uniqueness migration strategy accepted.
- [ ] Order snapshot fields accepted.
- [ ] Admin variant UI scope accepted.
- [ ] Legacy/simple product fallback strategy accepted.
- [ ] Test plan accepted.
- [ ] Rollback/data backup plan accepted.
