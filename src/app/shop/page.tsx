import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CategoryTile } from "@/components/shop/CategoryTile";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { getActiveProducts } from "@/lib/products";
import { KATEGORIEN } from "@/types/product";

export const metadata: Metadata = {
  title: "Shop",
  description: "Alle Padora-Produkte: Halterungen, Rackets, Taschen, Bälle, Grips und Schutz.",
};

export default function ShopPage() {
  const products = getActiveProducts();
  return (
    <Container className="py-8 md:py-12">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Shop" }]} />
      <h1 className="mt-4">Shop</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {KATEGORIEN.map((k) => {
          const items = products.filter((p) => p.kategorie === k);
          return <CategoryTile key={k} kategorie={k} image={items[0]?.bilder[0]} count={items.length} />;
        })}
      </div>
      <h2 className="mt-12">Alle Produkte</h2>
      <div className="mt-6">
        <ProductGrid products={products} />
      </div>
    </Container>
  );
}
