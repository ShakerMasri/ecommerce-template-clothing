-- Remove SKU fields from the clothing template.
-- Store owners manage size/color options and stock; SKU/barcode workflows are intentionally out of scope for now.

DROP INDEX IF EXISTS "ProductVariant_sku_key";

ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "sku";
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "selectedSku";
