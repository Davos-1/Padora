import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { inter, spaceGrotesk } from "@/lib/fonts";
import { site } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} – ${site.tagline}`,
    template: `%s – ${site.name}`,
  },
  description:
    "Padora: modulare 3D-gedruckte Halterungen und ausgewählte Padel-Produkte. Versand in der Schweiz, Zahlung mit TWINT, Karte oder Rechnung.",
  openGraph: {
    type: "website",
    locale: "de_CH",
    siteName: site.name,
    url: site.url,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de-CH" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>
        <CartProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-(--radius-button) focus:bg-surface focus:px-4 focus:py-2"
          >
            Zum Inhalt springen
          </a>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
