import { z } from "zod";

export const KATEGORIEN = ["halterungen", "rackets", "taschen", "baelle", "grips", "schutz"] as const;
export type Kategorie = (typeof KATEGORIEN)[number];

export const kategorieMeta: Record<Kategorie, { label: string; beschreibung: string }> = {
  halterungen: {
    label: "Halterungen",
    beschreibung: "Modulares Gittersystem aus dem 3D-Drucker: Basis plus Aufsätze für Kamera und Racket.",
  },
  rackets: { label: "Rackets", beschreibung: "Ausgewählte Padel-Rackets für Einsteiger bis Fortgeschrittene." },
  taschen: { label: "Taschen", beschreibung: "Paletero und Rucksack für Racket, Bälle und Ausrüstung." },
  baelle: { label: "Bälle", beschreibung: "Druckbälle für Training und Match." },
  grips: { label: "Grips", beschreibung: "Overgrips für sicheren Halt, einzeln oder im Set." },
  schutz: { label: "Schutz", beschreibung: "Stützen und Schutz für Ellbogen und Gelenke." },
};

const variantOptionSchema = z.object({
  code: z.string().regex(/^[A-Z0-9]{1,4}$/, "Variant code must be 1–4 uppercase letters/digits (used as SKU suffix)"),
  label: z.string().min(1),
  hex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "hex must be a 6-digit hex colour like #147A80")
    .optional(),
});

export const productSchema = z
  .object({
    sku: z.string().regex(/^VP-[A-Z]{3}-[A-Z0-9]{2,5}$/, "SKU must look like VP-XXX-YYYY"),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase kebab-case"),
    name: z.string().min(1),
    kategorie: z.enum(KATEGORIEN),
    preisChf: z.number().positive().multipleOf(0.05, "CHF prices are rounded to 5 Rappen"),
    beschreibung: z.string().min(1),
    details: z
      .object({
        material: z.string().optional(),
        masse: z.string().optional(),
        kompatibilitaet: z.string().optional(),
      })
      .default({}),
    varianten: z.object({
      typ: z.enum(["farbe", "groesse"]).nullable(),
      optionen: z.array(variantOptionSchema),
    }),
    bundle: z
      .object({
        mitSku: z.string(),
        rabattProzent: z.number().min(0).max(100),
      })
      .optional(),
    quelle: z.enum(["print", "import"]),
    lieferzeitText: z.string().min(1),
    bilder: z.array(z.string().startsWith("/images/products/")).min(1),
    /** Optional 3D mesh, built from assets/models via `pnpm build:mesh`. */
    modell3d: z
      .string()
      .regex(/^\/models\/[a-z0-9-]+\.pdm$/, "modell3d must look like /models/<slug>.pdm")
      .optional(),
    aktiv: z.boolean(),
  })
  .superRefine((p, ctx) => {
    if (p.varianten.typ === null && p.varianten.optionen.length > 0) {
      ctx.addIssue({ code: "custom", path: ["varianten"], message: "typ is null but optionen is not empty" });
    }
    if (p.varianten.typ !== null && p.varianten.optionen.length === 0) {
      ctx.addIssue({ code: "custom", path: ["varianten"], message: `typ "${p.varianten.typ}" requires at least one option` });
    }
    if (p.varianten.typ === "farbe" && p.varianten.optionen.some((o) => !o.hex)) {
      ctx.addIssue({ code: "custom", path: ["varianten", "optionen"], message: "colour variants need a hex value" });
    }
    const codes = p.varianten.optionen.map((o) => o.code);
    if (new Set(codes).size !== codes.length) {
      ctx.addIssue({ code: "custom", path: ["varianten", "optionen"], message: "duplicate variant codes" });
    }
  });

export type Product = z.infer<typeof productSchema>;
export type VariantOption = z.infer<typeof variantOptionSchema>;
