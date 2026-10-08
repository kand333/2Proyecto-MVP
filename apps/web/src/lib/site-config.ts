/**
 * Identity of the site: change it here for each project (name, texts, language, browser theme).
 * Colors and fonts live in app/globals.css and app/layout.tsx.
 */
export const siteConfig = {
  name: "Portal Starter",
  description: "Base para construir MVPs con Next.js, PostgreSQL y Prisma.",
  /** BCP 47 language tag: `<html lang>`, number and date formats. */
  locale: "es-CL",
  /** Open Graph locale. */
  openGraphLocale: "es_CL",
  /** Browser UI color, matching `--paper` in globals.css. */
  themeColor: { light: "#fafafa", dark: "#0f1012" },
} as const;
