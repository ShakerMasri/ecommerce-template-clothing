-- Add optional sale pricing for products.
ALTER TABLE "Product" ADD COLUMN "discountPrice" DECIMAL(10, 2);
