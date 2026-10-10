import "server-only";
import type { ShopSettings as SettingsRecord } from "@/generated/prisma/client";
import { findSettings, saveSettings } from "@/repositories/settings-repository";
import type { PublicShopSettings, ShopSettings } from "@portal/shared/settings";

const toSettings = ({ flatShippingClp, freeShippingFromClp, pickupAddress, transferInstructions }: SettingsRecord): ShopSettings => ({
  flatShippingClp,
  freeShippingFromClp,
  pickupAddress,
  transferInstructions,
});

/** ADMIN view: every field. */
export async function getSettings(): Promise<ShopSettings> {
  return toSettings(await findSettings());
}

export async function updateSettings(data: ShopSettings): Promise<ShopSettings> {
  return toSettings(await saveSettings(data));
}

/** What the cart and checkout show; the transfer details stay for the order page (RF-09). */
export async function getPublicSettings(): Promise<PublicShopSettings> {
  const { flatShippingClp, freeShippingFromClp, pickupAddress } = await findSettings();
  return { flatShippingClp, freeShippingFromClp, pickupAddress };
}
