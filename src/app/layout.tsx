import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import TrackingPixels from "@/components/tracking-pixels";
import ChatBotWidget from "@/components/ChatBotWidget";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { PublicChrome } from "@/components/public-chrome";

import { getSeoSettings, getSchemaSettings } from "@/lib/seo/repository";
import { buildMetadata } from "@/lib/seo/metadata";
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "@/lib/seo/schema";
import { SchemaScript } from "@/components/seo/schema-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  // Falls back gracefully if the DB / settings table aren't ready yet (e.g.
  // during initial migrations) so the build never crashes on a fresh clone.
  try {
    const seo = await getSeoSettings();
    return buildMetadata(seo, { path: "/" });
  } catch {
    return {
      title: "Agadir Directory",
      description: "Discover the best of Agadir, Morocco.",
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Site-wide JSON-LD (Organization + WebSite). Per-page generators may
  // emit additional blocks (BreadcrumbList, LocalBusiness, CollectionPage…)
  // — schema.org explicitly allows multiple JSON-LD blocks per document.
  let schemas: unknown[] = [];
  try {
    const [seo, schemaCfg] = await Promise.all([
      getSeoSettings(),
      getSchemaSettings(),
    ]);
    schemas = [
      buildWebSiteSchema(seo, schemaCfg),
      buildOrganizationSchema(seo, schemaCfg),
    ];
  } catch {
    schemas = [];
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthSessionProvider>
          <PublicChrome>{children}</PublicChrome>
        </AuthSessionProvider>
        <Toaster />
        <ChatBotWidget />
        <TrackingPixels />
        {schemas.length > 0 && <SchemaScript data={schemas} />}
      </body>
    </html>
  );
}
