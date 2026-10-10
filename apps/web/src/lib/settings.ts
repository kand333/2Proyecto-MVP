import type { ShopSettings } from "@portal/shared/settings";
import { sendJson } from "./api-client";

export const ADMIN_SETTINGS_PATH = "/admin/settings";

/** Replaces the shop settings; checkout uses them at once (RF-10). */
export const saveSettings = (data: ShopSettings) => sendJson<ShopSettings>("PUT", "/api/admin/settings", data);

/**
 * Amount typed in a form: empty is "not entered" (the schema asks for it, or null where allowed);
 * dots and spaces are thousands separators ("3.990" → 3990).
 */
export function parseAmount(text: string): number | undefined {
  const digits = text.replace(/[\s.$]/g, "");
  return digits === "" ? undefined : Number(digits);
}
