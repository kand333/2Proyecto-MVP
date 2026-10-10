/**
 * Identity of the site: change it here for each project (name, texts, language, browser theme).
 * Colors and fonts live in app/globals.css and app/layout.tsx.
 */
export const siteConfig = {
  name: "Terpenex Company",
  description: "Terpenos, cigarrillos electrónicos, líquidos y accesorios para mayores de 18 años, con envío a todo Chile.",
  /** BCP 47 language tag: `<html lang>`, number and date formats. */
  locale: "es-CL",
  /** Open Graph locale. */
  openGraphLocale: "es_CL",
  /** Browser UI color, matching `--paper` in globals.css. */
  themeColor: { light: "#f5f8f2", dark: "#0b120d" },
  /** Contact channels for /contact; empty ones are not shown (real values pending, see docs/spec.md). */
  contact: { whatsapp: "" as string, email: "" as string, instagram: "" as string, hours: "" as string },
  /** Social profile URLs for the footer; empty ones are not shown. */
  social: { instagram: "" as string, facebook: "" as string },
} as const;
