-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('TERPENES', 'VAPES', 'E_LIQUIDS', 'ACCESSORIES');

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "priceClp" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_isPublished_isArchived_category_idx" ON "Product"("isPublished", "isArchived", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_position_idx" ON "ProductVariant"("productId", "position");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Integrity backstop for the shared schema (DEC-003) and the stock decrement guard (DEC-004).
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_priceClp_check" CHECK ("priceClp" > 0);
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_stock_check" CHECK ("stock" >= 0);
