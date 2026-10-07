import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage } from "@/components/layout/ContentPage";

export const metadata: Metadata = {
  title: "Über uns",
  description:
    "Padora entwickelt und druckt Halterungen für Padel-Courts: Kamerahalter, Gitter-Basis und Racket-Halter.",
};

export default function UeberUnsPage() {
  return (
    <ContentPage
      title="Über uns"
      lead="Padora entwickelt und druckt Halterungen für Padel-Courts, aus der eigenen Leidenschaft für den Sport."
    >
      <h2>Wie alles begonnen hat</h2>
      <p>
        Padora ist aus einer konkreten Frage entstanden: Wie befestigt man eine Kamera oder ein
        Racket sauber am Court? Weil uns keine überzeugende Lösung gefiel, haben wir angefangen,
        eigene Halter zu entwickeln und auf dem 3D-Drucker zu fertigen.
      </p>
      <h2>Was es heute gibt</h2>
      <p>
        Für die Glaswand gibt es einen PadelCam Halter mit Saugnapf. Am Gitter haken wir die
        Gitter-Basis ein. Sie hat einen Schwalbenschwanz, auf den der PadelCam Halter oder der
        Racket-Halter geschoben wird.
      </p>
      <h2>Was noch kommt</h2>
      <p>
        Der Schwalbenschwanz ist als System gedacht: Auf dieselbe Gitter-Basis sollen später
        weitere Aufsätze passen. Neue Produkte erscheinen im Shop, sobald sie fertig getestet sind.
      </p>
      <h2>Zu den Produkten</h2>
      <p>
        <Link href="/shop">Alle Produkte ansehen</Link>
      </p>
    </ContentPage>
  );
}
