-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShippingMethod" AS ENUM ('DELIVERY', 'PICKUP');

-- CreateTable
CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "accessToken" TEXT NOT NULL,
    "userId" UUID,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "birthDate" DATE NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "shippingMethod" "ShippingMethod" NOT NULL,
    "region" TEXT,
    "commune" TEXT,
    "street" TEXT,
    "addressExtra" TEXT,
    "subtotalClp" INTEGER NOT NULL,
    "discountClp" INTEGER NOT NULL DEFAULT 0,
    "shippingClp" INTEGER NOT NULL,
    "totalClp" INTEGER NOT NULL,
    "discountCode" TEXT,
    "trackingNumber" TEXT,
    "paidAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "variantId" UUID NOT NULL,
    "productName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "unitPriceClp" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_email_idx" ON "Order"("email");

-- CreateIndex
CREATE INDEX "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_redeemedOrderId_key" ON "Subscriber"("redeemedOrderId");

-- AddForeignKey
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_redeemedOrderId_fkey" FOREIGN KEY ("redeemedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Integrity backstop for the server-side totals (DEC-003) and quantities (RF-06: 1-10 per line).
ALTER TABLE "Order" ADD CONSTRAINT "Order_amounts_check" CHECK (
  "subtotalClp" >= 0 AND "discountClp" >= 0 AND "shippingClp" >= 0 AND "discountClp" <= "subtotalClp"
  AND "totalClp" = "subtotalClp" - "discountClp" + "shippingClp"
);
ALTER TABLE "Order" ADD CONSTRAINT "Order_delivery_address_check" CHECK (
  "shippingMethod" = 'PICKUP' OR ("region" IS NOT NULL AND "commune" IS NOT NULL AND "street" IS NOT NULL)
);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_check" CHECK ("quantity" BETWEEN 1 AND 10);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_unitPriceClp_check" CHECK ("unitPriceClp" > 0);
