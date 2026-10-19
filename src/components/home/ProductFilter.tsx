"use client";

import { useState } from "react";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { cn } from "@/lib/cn";
import type { Product } from "@/types/product";

export type FilterId = "alle" | "glas" | "gitter" | "grips";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "alle", label: "Alle" },
  { id: "glas", label: "Glas" },
  { id: "gitter", label: "Gitter" },
  { id: "grips", label: "Grips" },
];

/** A product belongs to exactly one filter group (Alle shows everything). */
export function filterGroup(p: Product): Exclude<FilterId, "alle"> {
  if (p.kategorie === "grips") return "grips";
  return p.slug === "padelcam-glashalter" ? "glas" : "gitter";
}

export function ProductFilter({ products }: { products: Product[] }) {
  const [filter, setFilter] = useState<FilterId>("alle");
  const shown = filter === "alle" ? products : products.filter((p) => filterGroup(p) === filter);
  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Produkte filtern" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "min-h-(--touch-target) rounded-(--radius-pill) border px-4 text-sm font-medium transition-colors duration-(--duration-fast)",
              filter === f.id ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink hover:border-neutral",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ProductGrid products={shown} />
    </div>
  );
}
