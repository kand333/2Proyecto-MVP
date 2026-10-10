import type { Metadata, Viewport } from "next";
import { Archivo, Geist } from "next/font/google";
import { FlashMessages } from "@/components/ui/flash-messages";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

// Body text (`font-sans`).
const geist = Geist({
  variable: "--font-sans-family",
  subsets: ["latin"],
});

// Titles and wordmark (`font-display`); the width axis feeds `font-stretch-expanded` and `font-stretch-condensed`.
const archivo = Archivo({
  variable: "--font-display-family",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  // Base for the relative URLs of the metadata (canonical, Open Graph).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3100"),
  // Pages set only their own title: "Mi cuenta" becomes "Mi cuenta | <site name>".
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  // Pages without their own Open Graph share these; a page that sets it replaces the whole object.
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.openGraphLocale,
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: siteConfig.themeColor.light },
    { media: "(prefers-color-scheme: dark)", color: siteConfig.themeColor.dark },
  ],
};

/** Shared document shell. The public site (`(site)`) and `/admin` each add their own chrome. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={siteConfig.locale} className={`${geist.variable} ${archivo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <FlashMessages />
      </body>
    </html>
  );
}
