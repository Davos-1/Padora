import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/ContentPage";
import { formatChf } from "@/lib/format";
import { shopConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Versand & Rückgabe",
  description: "Informationen zu Versand, Lieferzeiten, Rückgabe und Zahlungsmethoden bei Padora.",
};

export default function VersandPage() {
  return (
    <ContentPage
      title="Versand & Rückgabe"
      lead="Wir liefern ausschliesslich innerhalb der Schweiz."
    >
      <h2>Versand</h2>
      <p>
        Wir versenden ausschliesslich innerhalb der Schweiz. Der Versand kostet pauschal{" "}
        {formatChf(shopConfig.shippingFlatChf)} und ist ab einem Bestellwert von{" "}
        {formatChf(shopConfig.freeShippingFromChf)} kostenlos.
      </p>
      <h2>Lieferzeit</h2>
      <ul>
        <li>Overgrips ab Lager: 1–3 Werktage.</li>
        <li>3D-gedruckte Artikel werden nach Bestellung gefertigt: Lieferung in ca. 1 Woche.</li>
        <li>Bei Bestellungen mit gedruckten Artikeln und Overgrips wird alles zusammen versendet.</li>
      </ul>
      <h2>Rückgabe</h2>
      <p>
        Für ungebrauchte Ware gilt ein 14-tägiges Rückgaberecht.
      </p>
      <p className="todo">
        TODO(operator): bitte bestätigen, ob 3D-Druck-Sonderfarben von der Rückgabe
        ausgeschlossen sind.
      </p>
      <h2>Gratis-Overgrip</h2>
      <p>
        Zu jeder Bestellung mit einem Produkt aus Gitter-System oder PadelCam legen wir ein
        Overgrip in der gewählten Farbe gratis dazu.
      </p>
      <h2>Zahlungsmethoden</h2>
      <p>Bezahlung über Payrexx mit TWINT, Kreditkarte oder Rechnung (QR).</p>
    </ContentPage>
  );
}
