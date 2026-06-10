-- Remove the cancelled-order archive field after deciding not to keep archived order logic.
DROP INDEX IF EXISTS "Order_adminArchivedAt_idx";

ALTER TABLE "Order" DROP COLUMN IF EXISTS "adminArchivedAt";
