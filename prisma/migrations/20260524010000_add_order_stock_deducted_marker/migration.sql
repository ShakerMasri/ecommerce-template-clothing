-- Add a marker for whether an order has already affected product stock.
-- Existing non-cancelled orders were created before stock reduction moved to
-- admin confirmation, so they are backfilled as already deducted to prevent
-- double-decrementing stock when they are later processed.
ALTER TABLE "Order" ADD COLUMN "stockDeductedAt" TIMESTAMP(3);

UPDATE "Order"
SET "stockDeductedAt" = "createdAt"
WHERE "status" <> 'CANCELLED';
