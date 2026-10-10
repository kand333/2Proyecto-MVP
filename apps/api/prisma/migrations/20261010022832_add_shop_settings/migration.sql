-- CreateTable
CREATE TABLE "ShopSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "flatShippingClp" INTEGER NOT NULL DEFAULT 0,
    "freeShippingFromClp" INTEGER,
    "pickupAddress" TEXT NOT NULL DEFAULT '',
    "transferInstructions" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopSettings_pkey" PRIMARY KEY ("id")
);

-- Single row (RF-10): only id 1 exists, amounts never negative, and the row is there from the start.
ALTER TABLE "ShopSettings" ADD CONSTRAINT "ShopSettings_single_row_check" CHECK ("id" = 1);
ALTER TABLE "ShopSettings" ADD CONSTRAINT "ShopSettings_amounts_check" CHECK ("flatShippingClp" >= 0 AND ("freeShippingFromClp" IS NULL OR "freeShippingFromClp" >= 0));
INSERT INTO "ShopSettings" ("id", "updatedAt") VALUES (1, CURRENT_TIMESTAMP);
