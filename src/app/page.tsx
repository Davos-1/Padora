import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { CategoryTile } from "@/components/shop/CategoryTile";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { getActiveProducts, getProductsByKategorie } from "@/lib/products";
import { KATEGORIEN } from "@/types/product";

const usps = [
  { title: "Versand in der Schweiz", text: "Gratis ab CHF 60.–, sonst CHF 7.90." },
  { title: "TWINT, Karte, Rechnung", text: "Sicher bezahlen via Payrexx." },
  { title: "Eigenentwicklung", text: "Halterungen designt und gedruckt in der Schweiz." },
];

export default function HomePage() {
  const products = getActiveProducts();
  const mounts = getProductsByKategorie("halterungen");
  const hero = mounts[0];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-surface">
        <Container className="grid items-center gap-8 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-sm font-medium text-brand-dark">Modulares Gittersystem</p>
            <h1 className="mt-3">Eine Basis. Jeder Aufsatz. Kamera und Racket immer am richtigen Ort.</h1>
            <p className="mt-4 max-w-prose text-neutral">
              Die Padora Gitter-Basis hält am Zaun oder an der Wand. Darauf rastet der PadelCam Mount
              für deine Action-Cam oder die Racket-Wandhalterung ein. 3D-gedruckt in der Schweiz.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/shop/halterungen">Gittersystem entdecken</ButtonLink>
              <ButtonLink href="/shop" variant="secondary">
                Alle Produkte
              </ButtonLink>
            </div>
          </div>
          {hero && (
            <div className="card relative aspect-square overflow-hidden md:aspect-4/3">
              <Image src={hero.bilder[0]} alt={hero.name} fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
          )}
        </Container>
      </section>

      {/* USP bar */}
      <section aria-label="Vorteile" className="border-b border-line">
        <Container className="grid gap-4 py-6 sm:grid-cols-3">
          {usps.map((u) => (
            <div key={u.title} className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-dark" />
              <div>
                <p className="text-sm font-medium text-ink">{u.title}</p>
                <p className="text-sm text-neutral">{u.text}</p>
              </div>
            </div>
          ))}
        </Container>
      </section>

      {/* Categories */}
      <section>
        <Container className="py-12">
          <div className="flex items-end justify-between gap-4">
            <h2>Kategorien</h2>
            <Link href="/shop" className="text-sm font-medium text-brand-dark hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KATEGORIEN.map((k) => {
              const items = products.filter((p) => p.kategorie === k);
              return <CategoryTile key={k} kategorie={k} image={items[0]?.bilder[0]} count={items.length} />;
            })}
          </div>
        </Container>
      </section>

      {/* Featured mounts */}
      <section className="border-t border-line bg-surface">
        <Container className="py-12">
          <h2>Das Gittersystem</h2>
          <p className="mt-2 max-w-prose text-neutral">
            Basis kaufen, Aufsätze kombinieren. Als Set 20% günstiger.
          </p>
          <div className="mt-6">
            <ProductGrid products={mounts} />
          </div>
        </Container>
      </section>
    </>
  );
}
