import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { FlashMessages } from "@/components/ui/flash-messages";
import { siteConfig } from "@/lib/site-config";
import "./globals.css";

// The only font by default (globals.css maps both `font-sans` and `font-display` to it).
const inter = Inter({
  variable: "--font-sans-family",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Base for the relative URLs of the metadata (canonical, Open Graph).
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
    <html lang={siteConfig.locale} className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <FlashMessages />
      </body>
    </html>
  );
}
