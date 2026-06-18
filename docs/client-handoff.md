# Client Handoff Guide

This guide explains the day-to-day admin workflow for a store built from this clothing ecommerce template. It should be reviewed and customized with each client before launch. Use `docs/first-client-setup-checklist.md` before this handoff review so client-specific config, assets, policies, and environment setup are already checked.

## Admin Responsibilities

The admin can safely manage:

- products, including title, description, price, discount price, category, image, size/color variants, variant stock, and archive/restore status
- categories, including safe deletion only when no products are attached
- order status, payment status, internal notes, and pending order confirmation
- per-product customer stock visibility

The admin should not receive database credentials, hosting secrets, OAuth secrets, SMTP passwords, Cloudinary API secrets, or Redis tokens.

## Product Management

Current product management supports clothing size/color variants. Customer-orderable stock lives on active product variants, and product-level customer stock is derived from active variant stock. Cart rows identify the selected variant, and order items snapshot selected size/color details for historical accuracy.

When adding or editing products:

1. Use clear product names and descriptions.
2. Use only images that the store has the right to use commercially.
3. Set the real product price on the server-managed product record.
4. Add `discountPrice` only when the discounted price is greater than 0 and lower than the original price.
5. Add the real available quantity to the relevant active size/color variants.
6. Keep unavailable combinations inactive or at `0` stock so customers cannot order them.
7. Enable customer stock visibility only when the store wants customers to see the exact stock count.

Customer-facing prices and order item prices are calculated by the server. The client browser must never be trusted to submit product prices.

## Category Management

Categories can be added and updated from the admin dashboard. Category deletion is intentionally blocked when products are still related to that category, because deleting an in-use category could break product organization.

Recommended workflow:

1. Create the category.
2. Assign products to it.
3. Before deleting a category, move or archive related products first.

## Stock and Order Confirmation

Current stock flow:

1. Customer places an order.
2. Checkout validates product, variant, stock, delivery, and pricing server-side inside the checkout transaction.
3. The order is created as pending.
4. Checkout immediately reserves/decreases the selected variant stock.
5. Store owner confirms the order with the customer by WhatsApp or phone.
6. Admin moves the order forward without deducting stock again.
7. If the order is cancelled, reserved stock is restored exactly once when applicable.

This prevents customers from ordering stock that was already reserved by another pending order, while also protecting against double deduction or double restoration.

If stock is no longer enough during checkout, the app should block checkout and show a safe error. The admin should not manually adjust order status to bypass stock or reservation rules.

## Delivery Pricing

Delivery areas and prices are currently code-managed, not editable from the admin dashboard. This was intentionally postponed.

Orders store delivery snapshots, including delivery area and delivery price, so historical orders stay accurate even if delivery prices change later.

If delivery prices need to change, a developer should update the code configuration, test checkout totals, and deploy the change.

## Legal Business Information

The public legal identity is configured in `src/config/legal-business.ts`. Unknown values must remain `null`; do not enter guessed, example, all-zero, or temporary registration numbers.

Before launch, the client must provide and verify:

- Registered electronic store name in Arabic and English.
- Legal provider/business name in Arabic and English.
- Physical business address.
- Commercial registration number.
- Ecommerce registration number.
- Client-owned production HTTPS `.ps` domain.
- Accountant-approved public tax wording, without the developer inventing a rate.

The storefront displays this block in the footer, terms page, and contact page only after the required identity values are complete and publishable. This guard prevents accidental placeholder publication but does not replace legal registration, lawyer review, accountant review, or immutable order/invoice snapshots planned for the next checkpoint.

## Public Policy Pages

Terms, privacy, shipping, returns, and contact-page policy copy are code-managed in the typed public policy config. This template copy is a placeholder and must be reviewed, replaced, or approved by the client before launch.

Do not publish private client agreements, private service terms, credentials, internal escalation contacts, or provider secrets on public policy pages.

## Discounts

Discounts are product-level only for now.

Rules:

- discount price is optional
- discount price must be lower than the original price
- customer UI shows old price and new price when a discount is active
- cart and order totals use the server-calculated effective price
- order items store price snapshots so old orders do not change later

Do not promise coupon codes, automatic campaign discounts, or per-customer discounts unless those features are added later.

## Customer Support Workflow

When a customer reports an issue, collect:

- customer name or order number
- approximate time of the issue
- page/action they were using
- screenshot if available
- any visible error reference such as `err_...`

Do not ask customers for passwords, private tokens, or payment card data.

## Error Reference IDs

If the app shows an error reference like `err_...`, search the deployment logs for that exact ID.

A safe log should help identify:

- route/action that failed
- expected vs unexpected failure type
- related safe identifier, such as order ID or admin/user ID when relevant

Logs must not expose passwords, cookies, OAuth secrets, environment variables, full database URLs, or unnecessary customer personal data.

## Email and SMTP

Local and staging environments may use log-only email delivery. Production should use a real transactional email provider with a verified sending domain.

Production email flows to verify before launch:

- account registration email behavior, if enabled
- password reset email
- email verification flow, if enabled
- sender name and sender address
- links use the real production domain

Do not use personal Gmail SMTP for client production email.

## Google Sign-In

Google sign-in is optional per environment. If enabled, each environment needs correct OAuth credentials and exact callback URLs.

Admin access does not come from Google. Admin access comes from the database-backed `User.role`, and new Google users should remain normal customers unless an authorized developer/admin explicitly changes their role.

## What Requires a Developer

Ask a developer for:

- delivery price changes
- production environment variable changes
- database migrations
- hosting changes
- OAuth callback changes
- email provider changes
- variant schema/checkout changes beyond normal admin-managed size/color setup
- new discount types or coupon features
- POS, online payments, SMS, CSV import, accounting, or delivery-company integrations
- PWA/install support
- data exports or destructive database cleanup
- unexplained repeated error reference IDs

## Client Launch Review

Before launch, review these with the client:

- admin login works
- admin can add/edit/archive/restore products
- admin can manage size/color variants, variant stock, and discounts
- admin can manage categories
- customer can place an order
- admin can move a pending order forward without deducting stock again
- delivery prices are correct
- legal/customer policy pages are customized, client-reviewed, and acceptable
- client understands that delivery pricing is code-managed for now
- client knows who to contact for technical issues
