import { bundlePrice } from "@/lib/pricing";
import { getProductBySlug } from "@/lib/products";
import type { Product } from "@/types/product";
import type { ZoneId } from "./court-zones";

/** Serialisable view model for one court zone; all prices come from product data. */
export type CourtZone = {
  id: ZoneId;
  title: string;
  sub: string;
  tag: string;
  text: string;
  sku: string;
  name: string;
  image: string;
  href: string;
  lieferzeit: string;
  options: Product["varianten"]["optionen"];
  price: number;
  /** Price of the single product when `price` is a set price. */
  regularPrice?: number;
  bundleWithSku?: string;
};

type Def = {
  id: ZoneId;
  slug: string;
  title: string;
  sub: string;
  tag: string;
  text: string;
  withBase: boolean;
};

const DEFS: Def[] = [
  {
    id: "glas",
    slug: "padelcam-glashalter",
    title: "Glaswand",
    sub: "PadelCam Halter mit Saugnapf",
    tag: "Glas",
    text: "Hält mit Saugnapf an der Glaswand. Funktioniert ohne Gitter-Basis.",
    withBase: false,
  },
  {
    id: "gitter",
    slug: "padelcam-schwalbenschwanz",
    title: "Gitter · Kamera",
    sub: "Basis + PadelCam Halter",
    tag: "Gitter · Set −20%",
    text: "Basis am Gitter einhaken, PadelCam Halter auf den Schwalbenschwanz schieben.",
    withBase: true,
  },
  {
    id: "racket",
    slug: "racket-halter",
    title: "Gitter · Racket",
    sub: "Basis + Racket-Halter",
    tag: "Gitter · Set −20%",
    text: "Das Racket liegt zwischen den Punkten nicht mehr auf dem Boden.",
    withBase: true,
  },
];

export function getCourtZones(): CourtZone[] {
  const zones: CourtZone[] = [];
  for (const d of DEFS) {
    const p = getProductBySlug(d.slug);
    if (!p) continue;
    const partner = d.withBase && p.bundle ? getProductBySlug("gitter-basis") : undefined;
    const set = partner && p.bundle?.mitSku === partner.sku;
    zones.push({
      id: d.id,
      title: d.title,
      sub: d.sub,
      tag: d.tag,
      text: d.text,
      sku: p.sku,
      name: set && partner ? `Set ${partner.name} + ${p.name}` : p.name,
      image: p.bilder[0],
      href: `/shop/${p.kategorie}/${p.slug}`,
      lieferzeit: p.lieferzeitText,
      options: p.varianten.optionen,
      price: set && partner ? bundlePrice(p, partner) : p.preisChf,
      ...(set && partner ? { regularPrice: p.preisChf + partner.preisChf, bundleWithSku: partner.sku } : {}),
    });
  }
  return zones;
}
