# Product Variants Readiness Audit

This document records the current product, cart, checkout, order, and admin stock flow before adding clothing variants such as size and color.

Variants are **not implemented yet** in this checkpoint. This file exists so the next implementation can be designed safely before Prisma migrations, API changes, checkout changes, and admin UI changes.

## Current status

The current app is product-level, not variant-level:

- `Product.stock` is the only stock source.
- `CartItem` stores `productId` and `quantity`.
- `CartItem` is unique by `userId + productId`, so the same product can only appear once per customer cart.
- `OrderItem` snapshots product name, slug, images, unit price, and subtotal.
- `OrderItem` does not snapshot selected size, selected color, SKU, or variant label.
- Admin stock updates edit `Product.stock` directly.
- Admin order confirmation decrements `Product.stock` when an order moves from `PENDING` to `PROCESSING`.

That flow is safe for simple products, but it is not safe for clothing variants. A clothing order must identify the exact selected variant, usually a size/color combination.

## Current data flow

### Public product loading

Current public product APIs load active products and expose product-level fields:

- product id
- name
- slug
- price
- discount price
- product-level stock
- images
- category
- `showStock`

Product listing and product detail pages use `Product.stock` to decide whether a product is out of stock. `showStock` controls whether the exact product-level stock count is shown to customers, but backend stock validation still runs regardless of display settings.

### Add to cart

Current add-to-cart flow:

1. Customer chooses quantity on a product detail page.
2. Browser sends `productId` and `quantity` to `POST /api/cart/items`.
3. API requires login.
4. API validates same-origin/CSRF protection.
5. API rate-limits the mutation.
6. API validates body shape.
7. API loads the product by `productId`.
8. API rejects archived/missing products.
9. API checks requested quantity against `Product.stock`.
10. API either increments the existing cart row or creates a new row.

Current cart uniqueness is:

```txt
userId + productId
```

That uniqueness is wrong for clothing variants because a customer must be able to add:

```txt
T-shirt / Black / M
T-shirt / Black / L
T-shirt / White / M
```

as separate cart lines.

### Cart display and quantity updates

Current cart loading returns each cart item with its related product. The client calculates the displayed product total from product price/discount and quantity for UI display, but checkout/order creation recalculates totals on the server.

Current quantity update flow checks the new quantity against `Product.stock`. With variants, this must check selected variant stock instead.

### Checkout and order creation

Current order creation is transaction-based and server-controlled:

1. Customer submits delivery fields and an idempotency key.
2. API requires login.
3. API validates same-origin/CSRF protection.
4. API rate-limits order creation.
5. API validates delivery input.
6. API requires an existing user, verified email, and phone number.
7. API handles duplicate idempotency keys safely.
8. API loads cart items for the current user.
9. API rejects empty carts.
10. API rejects archived products.
11. API checks `quantity <= Product.stock`.
12. API calculates effective product price server-side from `discountPrice ?? price`.
13. API calculates delivery price server-side from delivery config.
14. API creates a pending order.
15. API snapshots product name, slug, images, price, subtotal, customer details, and delivery details.
16. API clears the cart.
17. Stock is not deducted yet.

This is a good base. The important future change is that checkout must validate and snapshot the selected variant, not only the product.

### Admin order confirmation and stock deduction

Current stock deduction happens only when an admin changes an order from `PENDING` to `PROCESSING`.

Current confirmation flow:

1. API requires admin authorization server-side.
2. API validates same-origin/CSRF protection.
3. API rate-limits admin mutation.
4. API validates order id and requested status.
5. API checks allowed status transition.
6. If confirming, API loops through order items.
7. API decrements `Product.stock` using an atomic `updateMany` with `stock >= quantity`.
8. API sets `stockDeductedAt` so the same order is not deducted twice.
9. If cancelled after stock deduction, API restores product stock.

This should be preserved, but it must become variant-level:

```txt
ProductVariant.stock decrement/increment, not Product.stock decrement/increment
```

## Variant design direction

### Recommended first schema direction

For the first clothing version, keep the design simple and boring. Do not add normalized global size/color tables yet unless there is a real admin requirement.

Recommended first model:

```prisma
model ProductVariant {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  sizeLabel String
  colorName String
  colorHex  String?
  sku       String?

  stock     Int     @default(0)
  isActive  Boolean @default(true)
  sortOrder Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  cartItems  CartItem[]
  orderItems OrderItem[]

  @@unique([productId, sizeLabel, colorName])
  @@index([productId])
  @@index([sku])
}
```

Keep product price and discount at product level for the first variant release. Do **not** add variant price overrides in the first pass. Variant-level pricing increases pricing, cart, display, discount, checkout, and order snapshot complexity.

### Product stock direction

Do not keep customer-orderable stock split between `Product.stock` and `ProductVariant.stock` forever.

Safer direction:

1. Add variants in an additive migration.
2. Backfill one default variant for each existing product if needed.
3. Move cart, checkout, order confirmation, and stock restoration to variant stock.
4. Treat `Product.stock` as legacy/admin display only during transition, or replace it later with derived stock from variants.
5. Do not let customers order from both product-level stock and variant-level stock at the same time.

### Cart item direction

Future `CartItem` should identify the selected variant.

Recommended end state:

```txt
CartItem.userId + CartItem.productVariantId is unique
```

A cart line should represent exactly one chosen size/color combination.

Future cart item should not trust client-submitted size/color labels. The browser should submit only:

```txt
productVariantId
quantity
```

The server should load the variant and its related product, then validate:

- variant exists,
- variant is active,
- product is not archived,
- requested quantity is within variant stock,
- customer owns the cart row being updated or deleted.

### Order item direction

Future `OrderItem` must continue preserving historical snapshots. It should add variant snapshot fields such as:

```txt
productVariantId nullable relation
variantLabelAtPurchase
sizeLabelAtPurchase
colorNameAtPurchase
colorHexAtPurchase nullable
skuAtPurchase nullable
```

The nullable `productVariantId` relation allows old orders to remain readable if a variant is later deleted or deactivated. Snapshot fields keep old orders accurate even if the admin renames a size/color or changes SKU later.

### Public product API direction

Future public product detail response should include orderable variants with only safe public fields:

- variant id
- size label
- color name
- optional color hex
- availability status
- exact stock only when the product stock visibility setting allows it

Do not expose internal admin-only notes, cost data, private supplier data, or hidden fields.

Product listing can show an aggregated availability state such as:

```txt
available if any active variant has stock > 0
```

For exact stock display, either hide exact counts or show an aggregate only if `showStock` is enabled.

### Customer UI direction

Product detail page should require a valid variant selection before enabling add to cart.

The UI should not allow customers to add unavailable combinations. Backend validation must still reject unavailable variants because hiding UI is not security.

The cart page should display selected variant details on each cart line:

```txt
Classic cotton t-shirt
Size: M
Color: Black
```

Same product with different variants should appear as separate cart lines.

### Admin UI direction

Admin product management should make variants explicit and hard to misunderstand.

Minimum safe admin requirements:

- Admin can add/edit/deactivate variants for a product.
- Admin can set stock per variant.
- Admin can see which variants are active/inactive.
- Admin cannot create duplicate size/color combinations for the same product.
- Admin gets clear validation errors for invalid color hex, negative stock, duplicate SKU, or duplicate size/color combination.
- Product-level stock editing should be hidden or clearly disabled once variant-level stock is active.

Do not add bulk CSV import in the first variant release.

## Files affected by future implementation

### Prisma and database

- `prisma/schema.prisma`
- new Prisma migration for `ProductVariant`
- possible migration/backfill for default variants
- possible later migration to remove or deprecate direct product-level stock

### Validation

- `src/server/validations/cart.ts`
- `src/server/validations/order.ts`
- `src/server/validations/product.ts`
- `src/lib/validations.ts` for admin product create/update schemas

Note: `src/lib/validations.ts` was not included in this audit zip, but current admin product routes import product create/update schemas from it. It must be reviewed before implementing variants.

### Public APIs

- `src/app/api/products/route.ts`
- `src/app/api/products/[slug]/route.ts`
- `src/app/api/cart/route.ts`
- `src/app/api/cart/items/route.ts`
- `src/app/api/cart/items/[id]/route.ts`
- `src/app/api/orders/route.ts`

### Admin APIs

- `src/app/api/admin/products/route.ts`
- `src/app/api/admin/products/[id]/route.ts`
- `src/app/api/admin/products/[id]/stock/route.ts`
- likely new `src/app/api/admin/products/[id]/variants/*` routes
- `src/app/api/admin/orders/[id]/status/route.ts`

### Frontend components

- `src/components/products/ProductDetailClient.tsx`
- `src/components/products/ProductCard.tsx`
- `src/components/products/ProductListingClient.tsx`
- `src/components/cart/AddToCartControls.tsx`
- `src/components/cart/CartClient.tsx`
- `src/app/admin/products/AdminProductsClient.tsx`
- `src/components/admin/AdminOrdersClient.tsx`

### Tests

- `src/server/validations/cart.test.ts`
- `src/server/validations/order.test.ts`
- `src/server/validations/product.test.ts`
- `src/server/pricing.test.ts` if pricing input shape changes
- cart API tests
- order API tests
- admin product API tests
- admin order status tests
- Playwright customer cart/order/product display tests

## Required test cases for the future variant implementation

### Unit/API tests

- Add to cart rejects missing `productVariantId`.
- Add to cart rejects inactive variants.
- Add to cart rejects variants whose product is archived.
- Add to cart rejects quantity above selected variant stock.
- Same variant merges quantity in cart.
- Same product with different variants creates separate cart rows.
- Cart update checks selected variant stock.
- Checkout rejects stale cart rows where variant became inactive.
- Checkout rejects stale cart rows where product became archived.
- Checkout rejects insufficient selected variant stock.
- Checkout snapshots size/color/SKU/variant label.
- Checkout calculates product prices server-side and does not trust client price.
- Admin confirmation decrements selected variant stock once.
- Admin confirmation fails if selected variant stock is insufficient.
- Cancelling after stock deduction restores selected variant stock.
- Admin APIs reject non-admin users.
- Admin variant create/update validates duplicate size/color combinations.

### E2E tests

- Customer cannot add product before selecting a valid size/color.
- Unavailable size/color option is disabled in UI.
- Backend still rejects unavailable variant if request is manipulated.
- Customer can add two sizes of the same product and sees two cart rows.
- Checkout shows selected size/color in order confirmation or order history.
- Admin can confirm an order and only the selected variant stock decreases.
- Old order still shows original selected size/color after admin edits the variant later.

## Security rules to preserve

- Never trust client-submitted price, stock, size label, color name, SKU, or admin permission.
- Client should submit only ids and form values; server loads trusted product/variant records.
- Keep CSRF/same-origin checks on cart, order, and admin mutations.
- Keep rate limiting on cart, order, and admin mutations.
- Keep customer cart/order ownership checks server-side.
- Keep admin authorization server-side.
- Keep order snapshots so old orders do not change after product/variant edits.
- Do not log secrets, cookies, tokens, raw request bodies, or unnecessary customer PII.
- Do not cache authenticated cart/order/admin pages unsafely.

## What not to build in the first variant release

Do not combine variants with unrelated features:

- no POS integration,
- no online payments,
- no SMS,
- no coupons,
- no accounting integration,
- no delivery-company integration,
- no CSV import,
- no PWA caching,
- no multi-tenant SaaS,
- no Basic/Pro plan enforcement,
- no fake add-on registry.

## Recommended next checkpoint after this audit

The next safe implementation checkpoint should be a written schema/API design review, not a migration yet.

Recommended next file:

```txt
docs/product-variants-implementation-design.md
```

That design should decide:

- exact Prisma schema,
- migration/backfill strategy,
- whether `Product.stock` remains temporarily,
- API request/response shapes,
- admin variant UI shape,
- order snapshot fields,
- test list,
- rollback plan.

Only after that review should we create a Prisma migration and runtime code patch.
