import "server-only";
import { prisma } from "@/lib/prisma";
import type { ShopSettings } from "@portal/shared/settings";

// The single settings row (id 1) is created by the add_shop_settings migration.
const SETTINGS_ID = 1;

export function findSettings() {
  return prisma.shopSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID } });
}

export function saveSettings(data: ShopSettings) {
  return prisma.shopSettings.update({ where: { id: SETTINGS_ID }, data });
}
