-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "compareAtPriceClp" INTEGER;

-- CreateIndex
CREATE INDEX "Product_isFeatured_idx" ON "Product"("isFeatured");

-- A previous price only makes sense above the current price (DEC-017).
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_compareAtPriceClp_check" CHECK ("compareAtPriceClp" IS NULL OR "compareAtPriceClp" > "priceClp");
