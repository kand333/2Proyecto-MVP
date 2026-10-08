/**
 * Identity of the site: change it here for each project (name, texts, language, browser theme).
 * Colors and fonts live in app/globals.css and app/layout.tsx.
 */
export const siteConfig = {
  name: "Terpenos & Vapes",
  description: "Terpenos, cigarrillos electrónicos, líquidos y accesorios para mayores de 18 años en Chile.",
  /** BCP 47 language tag: `<html lang>`, number and date formats. */
  locale: "es-CL",
  /** Open Graph locale. */
  openGraphLocale: "es_CL",
  /** Browser UI color, matching `--paper` in globals.css. */
  themeColor: { light: "#f6f8f5", dark: "#0d1310" },
} as const;
