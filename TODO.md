# Padora v2 – offene Punkte

Die Seite zeigt nur, was es gibt. Diese Punkte sind noch offen.

## Bilder (Platzhalter ersetzen)
Ordner: `public/images/products/`, Format WebP, je 2 Bilder pro Produkt (`<slug>-1.webp`, `<slug>-2.webp`).
- [ ] gitter-basis
- [ ] padelcam-schwalbenschwanz
- [ ] padelcam-glashalter (aktuell eine Kopie der Schwalbenschwanz-Bilder)
- [ ] racket-halter
- [ ] overgrip-einzeln, overgrips-3er-set
- [ ] Logo (`src/components/layout/Logo.tsx`)

## 3D-Modelle
- [ ] STL von padelcam-schwalbenschwanz, padelcam-glashalter und racket-halter nach `assets/models/` legen, `pnpm build:mesh` ausführen, `modell3d` in den JSON-Dateien setzen

## Produktdaten
- [ ] Endgültige Produktnamen festlegen (aktuell Arbeitsnamen)
- [ ] Preis PadelCam Glashalter bestätigen (aktuell CHF 29.90, wie der Schwalbenschwanz-Halter)
- [ ] Preise prüfen: Basis 19.90, PadelCam Schwalbenschwanz 29.90, Racket-Halter 24.90 (je CHF 5.– weniger als vorher)
- [ ] Set-Rabatt 20% (Basis + Aufsatz) behalten oder anpassen
- [ ] Material, Masse und Passung ergänzen (Glasdicke, Gitterstärke, Kameraanschluss, passende Rackets)
- [ ] Mischfarben (CFS) als Varianten ergänzen

## Gratis-Overgrip
- [ ] Regel bestätigen: aktuell 1 Gratis-Overgrip pro Bestellung, sobald ein Nicht-Grip-Produkt im Warenkorb ist (nicht pro Stück)
- [ ] Echten Lagerbestand der Overgrips setzen (Migration `0002_seed_inventory.sql` hat Platzhalter 25)

## Später
- [ ] Weitere Aufsätze für den Schwalbenschwanz als Produkte aufnehmen
- [ ] Rechtsseiten (Impressum, AGB, Datenschutz) final füllen
- [ ] Rückgabe bei gedruckten Artikeln in `/versand` und AGB klären
