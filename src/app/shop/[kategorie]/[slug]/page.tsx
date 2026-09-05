import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Accordion, type AccordionItem } from "@/components/ui/Accordion";
import { LieferzeitBadge } from "@/components/ui/LieferzeitBadge";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { Gallery } from "@/components/product/Gallery";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { getActiveProducts, getCrossSell, getProductBySku, getProductBySlug } from "@/lib/products";
import { renderMarkdown } from "@/lib/markdown";
import { bundlePrice } from "@/lib/pricing";
import { formatChf } from "@/lib/format";
import { kategorieMeta } from "@/types/product";

export const dynamicParams = false;

export function generateStaticParams() {
  return getActiveProducts().map((p) => ({ kategorie: p.kategorie, slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[kategorie]/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  const description = product.beschreibung.split(/\n\s*\n/)[0]?.replace(/\*\*/g, "") ?? "";
  return {
    title: product.name,
    description,
    openGraph: { title: product.name, description, images: product.bilder.map((b) => ({ url: b })) },
  };
}

export default async function ProduktPage({ params }: PageProps<"/shop/[kategorie]/[slug]">) {
  const { kategorie, slug } = await params;
  const product = getProductBySlug(slug);
  if (!product || product.kategorie !== kategorie) notFound();

  const partner = product.bundle ? getProductBySku(product.bundle.mitSku) : undefined;
  const bundle = partner ? { partner, setPrice: bundlePrice(product, partner) } : undefined;
  const crossSell = getCrossSell(product);
  const catMeta = kategorieMeta[product.kategorie];

  const accordion: AccordionItem[] = [
    { title: "Beschreibung", content: <div className="prose-padora">{renderMarkdown(product.beschreibung)}</div> },
  ];
  const details: Array<[string, string | undefined]> = [
    ["Material", product.details.material],
    ["Masse", product.details.masse],
    ["Kompatibilität", product.details.kompatibilitaet],
  ];
  if (details.some(([, v]) => v)) {
    accordion.push({
      title: "Details",
      content: (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          {details
            .filter((d): d is [string, string] => Boolean(d[1]))
            .map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-neutral">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
        </dl>
      ),
    });
  }
  accordion.push({
    title: "Lieferung",
    content: (
      <p>
        {product.lieferzeitText}. Versand nur innerhalb der Schweiz, gratis ab CHF 60.–. Alle Preise inkl. MwSt.
      </p>
    ),
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    image: product.bilder,
    description: product.beschreibung,
    offers: {
      "@type": "Offer",
      priceCurrency: "CHF",
      price: product.preisChf.toFixed(2),
      availability: "https://schema.org/InStock",
      shippingDetails: { "@type": "OfferShippingDetails", shippingDestination: { "@type": "DefinedRegion", addressCountry: "CH" } },
    },
  };

  return (
    <Container className="pt-6 pb-28 md:py-12">
      <Breadcrumbs
        items={[
          { href: "/", label: "Home" },
          { href: "/shop", label: "Shop" },
          { href: `/shop/${product.kategorie}`, label: catMeta.label },
          { label: product.name },
        ]}
      />

      <div className="mt-4 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Gallery images={product.bilder} alt={product.name} />

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm text-brand-dark">{catMeta.label}</p>
            <h1 className="mt-1">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="text-lg font-medium text-ink">{formatChf(product.preisChf)}</p>
              <LieferzeitBadge text={product.lieferzeitText} />
            </div>
            <p className="text-xs text-neutral">inkl. MwSt., zzgl. Versand</p>
          </div>

          <ProductPurchase product={product} bundle={bundle} />

          <Accordion items={accordion} />
        </div>
      </div>

      {crossSell.length > 0 && (
        <section className="mt-16">
          <h2>Passt dazu</h2>
          <div className="mt-6">
            <ProductGrid products={crossSell} />
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </Container>
  );
}
