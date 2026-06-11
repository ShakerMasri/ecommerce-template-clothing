-- Add variant-aware cart/order support without changing existing simple-product rows.

-- Cart items can now point to a selected variant. cartLineKey avoids nullable
-- uniqueness problems and allows one customer to keep multiple sizes/colors of
-- the same product as separate cart rows.
ALTER TABLE "CartItem" ADD COLUMN "productVariantId" TEXT;
ALTER TABLE "CartItem" ADD COLUMN "cartLineKey" TEXT;

UPDATE "CartItem"
SET "cartLineKey" = 'product:' || "productId"
WHERE "cartLineKey" IS NULL;

ALTER TABLE "CartItem" ALTER COLUMN "cartLineKey" SET NOT NULL;

DROP INDEX IF EXISTS "CartItem_userId_productId_key";
CREATE UNIQUE INDEX "CartItem_userId_cartLineKey_key" ON "CartItem"("userId", "cartLineKey");
CREATE INDEX "CartItem_productVariantId_idx" ON "CartItem"("productVariantId");

ALTER TABLE "CartItem"
ADD CONSTRAINT "CartItem_productVariantId_fkey"
FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Order items keep a variant reference when available plus immutable display
-- snapshots so historical orders remain accurate after variant edits.
ALTER TABLE "OrderItem" ADD COLUMN "productVariantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "selectedSizeLabel" VARCHAR(40);
ALTER TABLE "OrderItem" ADD COLUMN "selectedColorLabel" VARCHAR(80);
ALTER TABLE "OrderItem" ADD COLUMN "selectedSku" VARCHAR(80);

CREATE INDEX "OrderItem_productVariantId_idx" ON "OrderItem"("productVariantId");

ALTER TABLE "OrderItem"
ADD CONSTRAINT "OrderItem_productVariantId_fkey"
FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
