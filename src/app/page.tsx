import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { CourtHero } from "@/components/home/CourtHero";
import { ProductFilter } from "@/components/home/ProductFilter";
import { getCourtZones } from "@/components/home/zones";
import { formatChf } from "@/lib/format";
import { bundlePrice } from "@/lib/pricing";
import { getActiveProducts, getProductBySlug } from "@/lib/products";

const usps = [
  { title: "Gratis-Overgrip", text: "Zu jeder Bestellung mit einem Halter." },
  { title: "Lieferung in ca. 1 Woche", text: "Jedes Teil wird nach Bestellung gedruckt." },
  { title: "TWINT, Karte, Rechnung", text: "Versand in der Schweiz, gratis ab CHF 60.–." },
];

const steps = [
  { slug: "gitter-basis", title: "Gitter-Basis einhaken", text: "Die Basis hängt am Gitter und hat eine Schwalbenschwanz-Verbindung." },
  { slug: "padelcam-schwalbenschwanz", title: "Aufsatz aufschieben", text: "PadelCam Halter oder Racket-Halter auf den Schwalbenschwanz schieben." },
  { slug: "racket-halter", title: "Wechseln, wie du willst", text: "Die Basis bleibt am Gitter hängen. Aufsätze lassen sich austauschen." },
];

const setSlugs = ["padelcam-schwalbenschwanz", "racket-halter"];

export default function HomePage() {
  const products = getActiveProducts();
  const base = getProductBySlug("gitter-basis");
  const sets = base
    ? setSlugs.flatMap((slug) => {
        const p = getProductBySlug(slug);
        if (!p?.bundle || p.bundle.mitSku !== base.sku) return [];
        return [{ p, rabatt: p.bundle.rabattProzent, regular: p.preisChf + base.preisChf, price: bundlePrice(p, base) }];
      })
    : [];

  return (
    <>
      <CourtHero zones={getCourtZones()} />

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

      {/* System */}
      <section id="system" className="scroll-mt-16">
        <Container className="flex flex-col gap-8 py-12 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h2 className="max-w-xl">Eine Basis am Gitter. Aufsätze nach Bedarf.</h2>
            <p className="max-w-md text-neutral">
              Mit dem PadelCam Halter oder dem Racket-Halter im Set 20% günstiger. Weitere Aufsätze
              für dieselbe Basis sind in Planung.
            </p>
          </div>

          <ol className="grid gap-3 md:grid-cols-3">
            {steps.map((s, i) => {
              const img = getProductBySlug(s.slug)?.bilder[0];
              return (
                <li key={s.title} className="card flex flex-col gap-3 p-3">
                  {img && (
                    <div className="relative aspect-4/3 overflow-hidden rounded-(--radius-button) bg-line">
                      <Image src={img} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                    </div>
                  )}
                  <div className="flex gap-3 px-1 pb-2">
                    <span className="font-heading text-sm text-brand-dark">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="text-lg">{s.title}</h3>
                      <p className="mt-1 text-sm text-neutral">{s.text}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {base && sets.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {sets.map(({ p, rabatt, regular, price }, i) => {
                const dark = i === 0;
                return (
                  <div
                    key={p.sku}
                    className={
                      dark
                        ? "flex flex-wrap items-end justify-between gap-4 rounded-(--radius-card) bg-ink p-6 text-paper"
                        : "card flex flex-wrap items-end justify-between gap-4 p-6"
                    }
                  >
                    <div className="flex flex-col gap-1">
                      <span className={dark ? "text-xs font-medium tracking-wide text-line uppercase" : "text-xs font-medium tracking-wide text-brand-dark uppercase"}>
                        Set · −{rabatt}%
                      </span>
                      <b className="font-heading text-xl font-medium">
                        {base.name} + {p.name}
                      </b>
                      <span className={dark ? "text-sm text-neutral line-through" : "text-sm text-neutral line-through"}>
                        {formatChf(regular)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={dark ? "font-heading text-2xl font-medium" : "font-heading text-2xl font-medium text-brand-dark"}>
                        {formatChf(price)}
                      </span>
                      {dark ? (
                        <Link
                          href={`/shop/${p.kategorie}/${p.slug}`}
                          className="inline-flex min-h-(--touch-target) items-center rounded-(--radius-button) bg-paper px-5 font-medium text-ink"
                        >
                          Set wählen
                        </Link>
                      ) : (
                        <ButtonLink href={`/shop/${p.kategorie}/${p.slug}`} variant="secondary">
                          Set wählen
                        </ButtonLink>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      {/* Alle Produkte */}
      <section id="produkte" className="scroll-mt-16 border-t border-line bg-surface">
        <Container className="flex flex-col gap-6 py-12 md:py-20">
          <h2>Alle Produkte</h2>
          <ProductFilter products={products} />
        </Container>
      </section>
    </>
  );
}
