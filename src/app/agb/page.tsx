// TODO(operator): Diese Seite enthält Platzhaltertext. Bitte finale AGB einsetzen und danach robots.index in metadata entfernen, damit die Seite indexiert wird.
import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata: Metadata = {
  title: "AGB",
  description: "Allgemeine Geschäftsbedingungen von Padora.",
  robots: { index: false },
};

export default function AgbPage() {
  return (
    <ContentPage title="Allgemeine Geschäftsbedingungen">
      <p className="todo">
        TODO(operator): Bitte die finalen AGB durch eine Rechtsberatung prüfen lassen und
        einsetzen.
      </p>
      <h2>Geltungsbereich</h2>
      <p>[Beschreibung des Geltungsbereichs]</p>
      <h2>Vertragsabschluss</h2>
      <p>[Beschreibung, wie der Vertrag zustande kommt]</p>
      <h2>Preise und Zahlung</h2>
      <p>[Angaben zu Preisen in CHF, MwSt. und Zahlungsmethoden]</p>
      <h2>Lieferung</h2>
      <p>[Angaben zu Lieferung und Versand]</p>
      <h2>Rückgabe</h2>
      <p>[Angaben zum Rückgaberecht]</p>
      <h2>Gewährleistung</h2>
      <p>[Angaben zur Gewährleistung]</p>
      <h2>Haftung</h2>
      <p>[Haftungsbeschränkungen]</p>
      <h2>Datenschutz</h2>
      <p>[Verweis auf Datenschutzerklärung]</p>
      <h2>Anwendbares Recht und Gerichtsstand</h2>
      <p>[Es gilt Schweizer Recht. Gerichtsstand: [Ort]]</p>
    </ContentPage>
  );
}
