import type { Metadata } from "next";
import { ContentPage } from "@/components/layout/ContentPage";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "So erreichst du Padora per E-Mail oder Instagram.",
};

export default function KontaktPage() {
  return (
    <ContentPage title="Kontakt" lead="Hast du eine Frage? Wir helfen dir gerne weiter.">
      <h2>E-Mail</h2>
      <p>
        Schreib uns an{" "}
        <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
      </p>
      <h2>Instagram</h2>
      <p>
        Folge uns auf{" "}
        <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
        .
      </p>
      <p>Wir antworten in der Regel innert 1–2 Werktagen.</p>
    </ContentPage>
  );
}
