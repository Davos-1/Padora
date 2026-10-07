"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { QuantityStepper } from "./QuantityStepper";
import { ButtonLink } from "@/components/ui/Button";
import { formatChf } from "@/lib/format";
import { shopConfig } from "@/lib/config";

export function CartView() {
  const { ready, lines, totals, setQty, remove, setGiftGrip } = useCart();

  if (!ready) {
    return <p className="py-12 text-center text-neutral">Warenkorb wird geladen …</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center">
        <p className="text-neutral">Dein Warenkorb ist leer.</p>
        <ButtonLink href="/shop" variant="secondary">
          Zum Shop
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <ul className="divide-y divide-line border-y border-line">
        {lines.map((l) =>
          l.gift ? (
            <li key={l.key} className="flex gap-4 py-4">
              <span className="relative block size-20 shrink-0 overflow-hidden rounded-(--radius-button) bg-line md:size-24">
                <Image src={l.product.bilder[0]} alt="" fill sizes="96px" className="object-cover" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{l.product.name}</p>
                    <p className="text-sm text-neutral">Gratis zu jeder Bestellung</p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums">Gratis</p>
                </div>
                <label className="flex items-center gap-3 text-sm text-neutral">
                  Farbe
                  <select
                    value={l.line.variantCode ?? ""}
                    onChange={(e) => setGiftGrip(e.target.value)}
                    className="min-h-12 rounded-(--radius-button) border border-line bg-white px-3 text-ink"
                  >
                    {l.product.varianten.optionen.map((o) => (
                      <option key={o.code} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </li>
          ) : (
          <li key={l.key} className="flex gap-4 py-4">
            <Link
              href={`/shop/${l.product.kategorie}/${l.product.slug}`}
              className="relative block size-20 shrink-0 overflow-hidden rounded-(--radius-button) bg-line md:size-24"
            >
              <Image src={l.product.bilder[0]} alt="" fill sizes="96px" className="object-cover" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {l.product.name}
                    {l.partner && <span className="text-neutral"> + {l.partner.name}</span>}
                  </p>
                  <p className="text-sm text-neutral">
                    {l.variantLabel && <span>{l.variantLabel} · </span>}
                    {l.partner ? (
                      <span>Set, −{l.product.bundle?.rabattProzent}%</span>
                    ) : (
                      <span>{l.product.lieferzeitText}</span>
                    )}
                  </p>
                </div>
                <p className="shrink-0 font-medium tabular-nums">{formatChf(l.lineTotal)}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <QuantityStepper value={l.line.qty} onChange={(q) => setQty(l.key, q)} label={l.product.name} />
                <button
                  type="button"
                  onClick={() => remove(l.key)}
                  className="flex min-h-12 items-center text-sm text-neutral underline-offset-2 hover:text-error hover:underline"
                >
                  Entfernen
                </button>
              </div>
            </div>
          </li>
          ),
        )}
      </ul>

      <aside className="card p-5 lg:sticky lg:top-20">
        <h2 className="text-lg">Zusammenfassung</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral">Zwischensumme</dt>
            <dd className="tabular-nums">{formatChf(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral">Versand (Schweiz)</dt>
            <dd className="tabular-nums">{totals.shipping === 0 ? "Gratis" : formatChf(totals.shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatChf(totals.total)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-neutral">
          {totals.freeShippingRemaining > 0
            ? `Noch ${formatChf(totals.freeShippingRemaining)} bis zum Gratisversand (ab ${formatChf(shopConfig.freeShippingFromChf)}).`
            : "Gratisversand aktiv."}{" "}
          Alle Preise inkl. MwSt.
        </p>
        <ButtonLink href="/checkout" className="mt-5 w-full">
          Zur Kasse
        </ButtonLink>
        <p className="mt-3 text-center text-xs text-neutral">TWINT · Kreditkarte · Rechnung</p>
      </aside>
    </div>
  );
}
