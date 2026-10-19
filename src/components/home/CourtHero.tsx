"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { ColorSwatches } from "@/components/product/ColorSwatches";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatChf } from "@/lib/format";
import { PadelCourt } from "./PadelCourt";
import type { ZoneSelection } from "./court-zones";
import type { CourtZone } from "./zones";

const DEFAULT_COLOR = "PET";

export function CourtHero({ zones }: { zones: CourtZone[] }) {
  const [zone, setZone] = useState<ZoneSelection>("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [added, setAdded] = useState(false);
  const cart = useCart();
  const current = zones.find((z) => z.id === zone);

  function select(next: ZoneSelection) {
    setZone(next);
    setAdded(false);
  }

  const options = current?.options ?? [];
  const colorCode = options.some((o) => o.code === color) ? color : (options[0]?.code ?? "");

  function onAdd() {
    if (!current || added) return;
    cart.add({
      sku: current.sku,
      variantCode: colorCode || null,
      qty: 1,
      ...(current.bundleWithSku ? { bundleWithSku: current.bundleWithSku } : {}),
    });
    setAdded(true);
  }

  return (
    <section
      id="court"
      aria-label="Court-Auswahl"
      className="relative flex scroll-mt-16 flex-col overflow-hidden border-b border-line bg-line md:block md:h-[calc(100dvh-4rem)] md:min-h-[680px]"
    >
      <div className="relative order-2 h-[60svh] min-h-[360px] md:absolute md:inset-0 md:h-auto">
        <PadelCourt active={zone} onZoneChange={select} />
      </div>

      <div className="card z-10 order-1 m-(--container-pad) flex flex-col gap-5 bg-surface/90 p-5 backdrop-blur-sm md:absolute md:top-8 md:bottom-8 md:left-8 md:m-0 md:w-[min(420px,calc(100%-4rem))] md:justify-center md:overflow-auto md:p-8">
        <p className="text-sm font-medium text-brand-dark">3D-gedruckt für Padel-Courts</p>
        <h1>Wo willst du filmen?</h1>
        <p className="text-neutral">
          Tipp auf eine Wand im Court. Am Glas hält der Saugnapf, am Gitter hängt die Basis mit
          Schwalbenschwanz.
        </p>
        <div role="tablist" aria-label="Wand wählen" className="flex flex-col gap-2">
          {zones.map((z) => {
            const on = z.id === zone;
            return (
              <button
                key={z.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => select(on ? "" : z.id)}
                className={cn(
                  "flex min-h-15 items-center gap-3 rounded-(--radius-card) border p-2 pr-4 text-left transition-colors duration-(--duration-fast)",
                  on ? "border-ink bg-surface" : "border-line bg-paper hover:border-neutral",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full border",
                    on ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink",
                  )}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={cn("transition-transform duration-(--duration-base)", on && "rotate-45")}
                  >
                    <path d="M8 2v12M2 8h12" />
                  </svg>
                </span>
                <span className="flex flex-col">
                  <b className="font-medium text-ink">{z.title}</b>
                  <span className="text-sm text-neutral">{z.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {current && (
        <div className="card z-10 order-3 m-(--container-pad) flex flex-col gap-3 p-3 md:absolute md:top-8 md:right-8 md:m-0 md:w-80">
          <div className="relative aspect-video overflow-hidden rounded-(--radius-button) bg-line">
            <Image src={current.image} alt={current.name} fill sizes="320px" className="object-cover" />
          </div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium tracking-wide text-brand-dark uppercase">{current.tag}</span>
            <span className="text-neutral">{current.lieferzeit}</span>
          </div>
          <h2 className="text-lg">{current.name}</h2>
          <p className="text-sm text-neutral">{current.text}</p>
          {options.length > 0 && <ColorSwatches options={options} value={colorCode} onChange={setColor} />}
          <div className="flex items-baseline justify-between gap-2 border-t border-line pt-3">
            <span className="text-sm text-neutral">
              {current.regularPrice ? `statt ${formatChf(current.regularPrice)}` : "inkl. Gratis-Overgrip"}
            </span>
            <span className="font-heading text-2xl font-medium text-brand-dark">{formatChf(current.price)}</span>
          </div>
          <Button onClick={onAdd} aria-disabled={added}>
            {added ? "✓ Im Warenkorb" : "In den Warenkorb"}
          </Button>
          <p role="status" aria-live="polite" className="text-sm">
            {added ? (
              <Link href="/warenkorb" className="font-medium text-brand-dark underline underline-offset-2">
                Zum Warenkorb
              </Link>
            ) : (
              <Link href={current.href} className="text-neutral underline underline-offset-2 hover:text-ink">
                Produktdetails
              </Link>
            )}
          </p>
        </div>
      )}
    </section>
  );
}
