-- Additive clothing product variant foundation.
-- This migration intentionally does not change cart, checkout, orders, or stock
-- deduction behavior yet. Runtime flows continue using Product.stock until the
-- variant-aware API/UI checkpoints are implemented and tested.

CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sizeLabel" VARCHAR(40),
    "colorLabel" VARCHAR(80),
    "sizeKey" VARCHAR(40) NOT NULL DEFAULT '',
    "colorKey" VARCHAR(80) NOT NULL DEFAULT '',
    "sku" VARCHAR(80),
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductVariant_stock_nonnegative_check" CHECK ("stock" >= 0),
    CONSTRAINT "ProductVariant_sortOrder_nonnegative_check" CHECK ("sortOrder" >= 0)
);

CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");
CREATE UNIQUE INDEX "ProductVariant_productId_sizeKey_colorKey_key" ON "ProductVariant"("productId", "sizeKey", "colorKey");
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX "ProductVariant_isActive_idx" ON "ProductVariant"("isActive");
CREATE INDEX "ProductVariant_sortOrder_idx" ON "ProductVariant"("sortOrder");

ALTER TABLE "ProductVariant"
ADD CONSTRAINT "ProductVariant_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
