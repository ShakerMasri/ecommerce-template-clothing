-- Add delivery snapshot fields to orders.
-- Text fields are nullable and new numeric/boolean fields have safe defaults,
-- so the migration remains non-destructive for existing test/staging rows.
ALTER TABLE "Order"
ADD COLUMN "deliveryAreaKey" TEXT,
ADD COLUMN "deliveryPrice" DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN "deliveryCity" TEXT,
ADD COLUMN "deliveryAddress" TEXT,
ADD COLUMN "deliveryNotes" TEXT,
ADD COLUMN "pickupAgreementAccepted" BOOLEAN NOT NULL DEFAULT false;
