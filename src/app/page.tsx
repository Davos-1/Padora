import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { getActiveProducts, getProductBySlug, getProductsByKategorie } from "@/lib/products";

const usps = [
  { title: "Gratis-Overgrip", text: "Zu jeder Bestellung mit einem Halter legen wir eines dazu." },
  { title: "Lieferung in ca. 1 Woche", text: "Jedes Teil wird nach Bestellung gedruckt." },
  { title: "TWINT, Karte, Rechnung", text: "Versand in der Schweiz, gratis ab CHF 60.–." },
];

const steps = [
  { title: "Gitter-Basis einhaken", text: "Die Basis hängt am Gitter des Padel-Courts. Sie hat eine Schwalbenschwanz-Verbindung." },
  { title: "Aufsatz aufschieben", text: "Der PadelCam Halter oder der Racket-Halter wird auf den Schwalbenschwanz geschoben." },
  { title: "Wechseln, wie du willst", text: "Die Basis bleibt am Gitter hängen. Aufsätze lassen sich austauschen." },
];

export default function HomePage() {
  const products = getActiveProducts();
  const system = getProductsByKategorie("system");
  const kamera = getProductsByKategorie("kamera");
  const grips = getProductsByKategorie("grips");
  const hero = getProductBySlug("padelcam-schwalbenschwanz") ?? products[0];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line bg-surface">
        <Container className="grid items-center gap-8 py-12 md:grid-cols-2 md:py-20">
          <div>
            <p className="text-sm font-medium text-brand-dark">3D-gedruckt für Padel-Courts</p>
            <h1 className="mt-3">Deine Kamera und dein Racket am Court. Am Glas oder am Gitter.</h1>
            <p className="mt-4 max-w-prose text-neutral">
              Padora entwickelt Halterungen und druckt sie selbst. Für das Glas gibt es den PadelCam
              Halter mit Saugnapf. Am Gitter hängt die Basis mit Schwalbenschwanz, auf die der
              PadelCam Halter oder der Racket-Halter passt.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/shop/kamera">PadelCam ansehen</ButtonLink>
              <ButtonLink href="/shop/system" variant="secondary">
                Gitter-System
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

      {/* PadelCam */}
      <section>
        <Container className="py-12">
          <div className="flex items-end justify-between gap-4">
            <h2>PadelCam Halter</h2>
            <Link href="/shop/kamera" className="text-sm font-medium text-brand-dark hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <p className="mt-2 max-w-prose text-neutral">
            Zwei Varianten: mit Saugnapf fürs Glas oder mit Schwalbenschwanz für die Gitter-Basis.
          </p>
          <div className="mt-6">
            <ProductGrid products={kamera} />
          </div>
        </Container>
      </section>

      {/* System */}
      <section className="border-y border-line bg-surface">
        <Container className="py-12">
          <h2>Das Schwalbenschwanz-System</h2>
          <p className="mt-2 max-w-prose text-neutral">
            Eine Basis am Gitter, darauf Aufsätze nach Bedarf. Mit dem PadelCam Halter oder dem
            Racket-Halter im Set 20% günstiger.
          </p>
          <ol className="mt-6 grid gap-3 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="card p-5">
                <p className="font-heading text-sm text-brand-dark">Schritt {i + 1}</p>
                <h3 className="mt-1 text-lg">{s.title}</h3>
                <p className="mt-2 text-sm text-neutral">{s.text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8">
            <ProductGrid products={system} />
          </div>
          <div className="card mt-8 p-5">
            <h3 className="text-lg">Weitere Aufsätze folgen</h3>
            <p className="mt-2 max-w-prose text-sm text-neutral">
              Der Schwalbenschwanz ist als System gedacht. Auf dieselbe Basis sollen später weitere
              Aufsätze passen. Neue Teile erscheinen hier, sobald sie fertig getestet sind. Auch
              Mischfarben sind in Planung.
            </p>
          </div>
        </Container>
      </section>

      {/* Overgrips */}
      <section>
        <Container className="py-12">
          <div className="flex items-end justify-between gap-4">
            <h2>Overgrips</h2>
            <Link href="/shop/grips" className="text-sm font-medium text-brand-dark hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <p className="mt-2 max-w-prose text-neutral">
            Mit jeder Bestellung eines Halters bekommst du ein Overgrip gratis. Du kannst sie auch
            einzeln oder im 3er-Set kaufen.
          </p>
          <div className="mt-6">
            <ProductGrid products={grips} />
          </div>
        </Container>
      </section>
    </>
  );
}
