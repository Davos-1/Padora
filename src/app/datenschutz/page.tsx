// TODO(operator): Diese Seite enthält Platzhaltertext. Bitte finale Datenschutzerklärung einsetzen und danach robots.index in metadata entfernen, damit die Seite indexiert wird.
import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung von Padora.",
  robots: { index: false },
};

export default function DatenschutzPage() {
  return (
    <ContentPage title="Datenschutzerklärung">
      <p className="todo">
        TODO(operator): Bitte die finale Datenschutzerklärung durch eine Rechtsberatung prüfen
        lassen und einsetzen.
      </p>
      <h2>Verantwortlicher</h2>
      <p>[Name und Adresse des Verantwortlichen]</p>
      <h2>Erhobene Daten bei Bestellung</h2>
      <p>[Angaben zu Name, Adresse, E-Mail und weiteren bei der Bestellung erfassten Daten]</p>
      <h2>Zahlungsabwicklung</h2>
      <p>Die Zahlungsabwicklung erfolgt über Payrexx. [Details zur Datenweitergabe]</p>
      <h2>E-Mail-Versand</h2>
      <p>Bestellbestätigungen werden über Resend versendet. [Details zur Datenweitergabe]</p>
      <h2>Hosting</h2>
      <p>Diese Website wird über Cloudflare gehostet. [Details]</p>
      <h2>Warenkorb</h2>
      <p>
        Der Warenkorb wird lokal im Browser (localStorage) gespeichert. Es findet kein Tracking
        statt, ausser technisch notwendigen Cookies.
      </p>
      <h2>Rechte der Betroffenen</h2>
      <p>[Angaben zu Auskunft, Berichtigung, Löschung etc.]</p>
      <h2>Kontakt</h2>
      <p>[Kontaktangaben für Datenschutzanfragen]</p>
    </ContentPage>
  );
}
