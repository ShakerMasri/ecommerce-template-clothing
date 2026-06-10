-- Add a soft-archive marker for cancelled orders hidden from the admin list.
ALTER TABLE "Order" ADD COLUMN "adminArchivedAt" TIMESTAMP(3);

CREATE INDEX "Order_adminArchivedAt_idx" ON "Order"("adminArchivedAt");
