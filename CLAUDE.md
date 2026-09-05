# Padora Shop

Onlineshop für Padel-Zubehör, Zielmarkt Schweiz. Next.js auf
Cloudflare Pages, Payrexx (TWINT/Karte/QR-Rechnung), Resend, D1.

## Sprache & Konventionen
- UI-Texte: Deutsch (Schweizer Hochdeutsch), NIEMALS ß (immer ss)
- Preise: Format «CHF 29.–», immer inkl. MwSt.
- Währung ausschliesslich CHF, Versand nur in die Schweiz
- Code/Kommentare: Englisch; Commits: Conventional Commits

## Architektur-Regeln
- Produktdaten: /data/products/*.json, validiert via zod
  (types/product.ts). NIE Produktdaten hardcoden.
- Preise im Checkout IMMER serverseitig aus Produktdaten lesen,
  nie vom Client übernehmen
- Lagerbestand & Bestellungen: nur in D1, nie im JSON
- Warenkorb: client-side (localStorage), kein Account-System
- Payment: Payrexx Gateway API — Redirect-Flow, Bestellung wird
  erst nach Webhook-Bestätigung als «paid» markiert
- Secrets (.env): PAYREXX_API_KEY, PAYREXX_INSTANCE,
  RESEND_API_KEY — nie committen

## Design-System (strikt)
- Tokens aus src/styles/tokens.css verwenden, keine Ad-hoc-Farben
- Farben: ink #1A1D21, paper #FAFAF7, brand #147A80 (CTAs),
  brand-dark #0E5C63 (Akzente), neutral #8A8F98, line #ECECE8
- Max. 1 Petrol-CTA pro Viewport, keine Schatten
- Fonts: Space Grotesk (Headlines), Inter (Body) — self-hosted
- Mobile-First, Touch-Targets min. 48px
- Karten: weiss, 12px Radius, 1px Border

## Qualität
- TypeScript strict, keine any
- Vor jedem Commit: pnpm lint && pnpm typecheck
- Katalogseiten statisch (SSG), Interaktivität als Client-Islands

## Deployment (Cloudflare)
- Adapter: @opennextjs/cloudflare (Workers + Static Assets), Config in
  wrangler.jsonc, D1-Binding `DB`, Migrationen in /migrations
- `pnpm cf:preview` = lokaler Worker-Preview, `pnpm cf:deploy` = Deploy
- Lokale Secrets in `.dev.vars` (siehe .env.example)
