// TODO(operator): Diese Seite enthält Platzhaltertext. Bitte finalen Impressum-Text einsetzen und danach robots.index in metadata entfernen, damit die Seite indexiert wird.
import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum von Padora.",
  robots: { index: false },
};

export default function ImpressumPage() {
  return (
    <ContentPage title="Impressum">
      <p className="todo">
        TODO(operator): Bitte den finalen Impressum-Text gemäss Schweizer Recht einsetzen.
      </p>
      <h2>Firma</h2>
      <p>[Firmenname]</p>
      <h2>Adresse</h2>
      <p>[Strasse, PLZ Ort, Schweiz]</p>
      <h2>E-Mail</h2>
      <p>[E-Mail-Adresse]</p>
      <h2>UID</h2>
      <p>[UID-Nummer]</p>
      <h2>Verantwortlich für den Inhalt</h2>
      <p>[Name der verantwortlichen Person]</p>
    </ContentPage>
  );
}
