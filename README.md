# Padora Shop

Onlineshop für Padel-Zubehör (padora.ch). Next.js App Router auf
Cloudflare (OpenNext), Cloudflare D1, Payrexx, Resend.

## Entwicklung

```bash
pnpm install
cp .env.example .dev.vars   # Secrets eintragen
pnpm dev                    # http://localhost:3000
pnpm check                  # lint + typecheck
```

## Cloudflare

```bash
pnpm cf:preview             # Build + lokaler Worker-Preview (wrangler)
pnpm cf:deploy              # Build + Deploy
wrangler d1 create padora-shop   # einmalig, ID in wrangler.jsonc eintragen
wrangler d1 migrations apply padora-shop --remote
```

Siehe `CLAUDE.md` für Architektur- und Design-Regeln.

## Go-live-Checkliste

1. `wrangler d1 create padora-shop` → `database_id` in `wrangler.jsonc` eintragen
2. `pnpm db:migrate:remote` (Schema + Platzhalter-Lagerbestand), danach echte Bestände setzen:
   `wrangler d1 execute padora-shop --remote --command "UPDATE inventory SET stock = 12 WHERE variant_sku = 'VP-BAL-3ER'"`
3. Secrets setzen: `wrangler secret put PAYREXX_INSTANCE`, `PAYREXX_API_KEY`, `RESEND_API_KEY`
4. Payrexx-Backend: Webhook-URL `https://padora.ch/api/webhook/payrexx` eintragen
5. Resend: Domain `padora.ch` verifizieren, Absender in `src/lib/config.ts` prüfen
6. Rechtsseiten (`/impressum`, `/agb`, `/datenschutz`) mit finalem Text füllen, `robots.index` entfernen
7. Logo-SVG in `src/components/layout/Logo.tsx` einsetzen, Platzhalterbilder in `public/images/products` ersetzen
8. `pnpm check && pnpm cf:deploy`

Ohne Payrexx-Secrets läuft der Checkout im Mock-Modus (`/checkout/mock-payment`).
