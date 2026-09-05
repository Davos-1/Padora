import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata: Metadata = {
  title: "Über uns",
  description:
    "Padora ist eine kleine Schweizer Padel-Marke: eigene 3D-gedruckte Halterungssysteme und sorgfältig ausgewähltes Zubehör.",
};

export default function UeberUnsPage() {
  return (
    <ContentPage
      title="Über uns"
      lead="Padora ist eine kleine Schweizer Marke für Padel-Zubehör – entstanden aus der eigenen Leidenschaft für den Sport."
    >
      <h2>Wie alles begonnen hat</h2>
      <p>
        Padora ist aus einer ganz konkreten Frage entstanden: Wie befestigt man eine Kamera oder
        einen Schläger sauber und sicher an den Zaun eines Padel-Courts? Weil es dafür keine
        überzeugende Lösung gab, haben wir angefangen, eigene Halterungen zu entwickeln – und
        daraus ist Padora geworden.
      </p>
      <h2>Unser eigenes Gitter-System</h2>
      <p>
        Das Herzstück von Padora ist ein modulares Gitter-System, das wir selbst entwerfen und in
        der Schweiz 3D-drucken lassen. Es besteht aus einer stabilen Gitter-Basis, die sich am
        Court-Zaun befestigen lässt, sowie zwei Aufsätzen: dem PadelCam Mount für Actioncams und
        Smartphones sowie der Racket-Wandhalterung für Schläger. Alle Teile sind aufeinander
        abgestimmt und lassen sich beliebig kombinieren.
      </p>
      <h2>Sorgfältig ausgewähltes Zubehör</h2>
      <p>
        Neben unseren eigenen Entwicklungen führen wir zusätzlich ausgewähltes Zubehör von
        Partnern, das wir selbst nutzen und für gut befinden. So findest du bei uns alles rund um
        deine Ausrüstung an einem Ort.
      </p>
      <h2>Entdecke unsere Halterungen</h2>
      <p>
        Schau dir unser komplettes Gitter-System an und finde die passende Kombination für deinen
        Court. <Link href="/shop/halterungen">Zu den Halterungen</Link>
      </p>
    </ContentPage>
  );
}
