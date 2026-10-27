import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/standard.css";
import "@fontsource-variable/archivo/standard-italic.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import "./globals.css";
import "./sections.css";
import { site, services } from "@/content/site";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import SmoothScroll from "@/components/motion/SmoothScroll";
import RevealObserver from "@/components/motion/RevealObserver";
import Cursor from "@/components/ui/Cursor";
import EffectsLayer from "@/components/motion/EffectsLayer";
import ScrollProgress from "@/components/ui/ScrollProgress";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://voelectrical.example";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "V.O Electrical Lights Trading — Solar installation & electrical supply",
    template: "%s — V.O Electrical Lights Trading",
  },
  description:
    "Villanueva-Ong Electrical Lights Trading designs, supplies and installs solar systems for homes, farms, businesses and government projects in the Philippines — plus solar street lighting, electrical supplies and electrical works.",
  applicationName: site.legalName,
  keywords: [
    "solar installation Philippines",
    "solar panel installation",
    "solar street lights",
    "solar powered irrigation",
    "electrical supplies Philippines",
    "Villanueva-Ong",
    "V.O Electrical Lights Trading",
  ],
  authors: [{ name: site.legalName }],
  creator: site.legalName,
  publisher: site.legalName,
  category: "Solar installation & electrical supply",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "/",
    siteName: site.legalName,
    title: "V.O Electrical Lights Trading — We wire the sun.",
    description:
      "Solar installation, solar street lighting and electrical supply for homes, farms, businesses and government projects in the Philippines.",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "V.O Electrical Lights Trading — We wire the sun." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "V.O Electrical Lights Trading — We wire the sun.",
    description:
      "Solar installation, solar street lighting and electrical supply in the Philippines.",
    images: ["/og.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#08090b",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Electrician",
      "@id": `${siteUrl}/#organization`,
      name: site.legalName,
      alternateName: site.name,
      description:
        "Solar installation and electrical supply company in the Philippines. Residential, commercial, farm and ground-mounted solar, solar-powered irrigation, solar street lighting, electrical supplies and electrical works.",
      url: siteUrl,
      telephone: site.telephoneHref,
      email: site.email,
      image: `${siteUrl}/og.jpg`,
      logo: `${siteUrl}/brand/logo-512.png`,
      sameAs: [site.facebook],
      areaServed: { "@type": "Country", name: "Philippines" },
      knowsAbout: services.map((s) => s.title),
      makesOffer: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title, description: s.short },
      })),
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: site.legalName,
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll />
        <RevealObserver />
        <Cursor />
        <EffectsLayer />
        <ScrollProgress />
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <div className="grain" aria-hidden="true" />
        <div className="vignette" aria-hidden="true" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
