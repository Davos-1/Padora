import { z } from "zod";

/** Shared client/server validation for the one-page checkout. */
export const PAYMENT_METHODS = ["twint", "card", "invoice"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  twint: "TWINT",
  card: "Kreditkarte",
  invoice: "Rechnung (QR)",
};

export const SHIPPING_METHODS = ["post"] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];
export const shippingMethodLabel: Record<ShippingMethod, string> = { post: "Post (Schweiz)" };

const trimmed = (max: number) => z.string().trim().min(1, "Pflichtfeld").max(max, `Max. ${max} Zeichen`);

export const addressSchema = z.object({
  firstName: trimmed(60),
  lastName: trimmed(60),
  street: trimmed(100),
  zip: z
    .string()
    .trim()
    .regex(/^[1-9]\d{3}$/, "Schweizer PLZ mit 4 Ziffern"),
  city: trimmed(60),
  country: z.literal("CH"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});
export type Address = z.infer<typeof addressSchema>;

export const cartLineSchema = z.object({
  sku: z.string().min(1).max(40),
  variantCode: z.string().max(4).nullable(),
  qty: z.number().int().min(1).max(20),
  bundleWithSku: z.string().max(40).optional(),
});

export const checkoutSchema = z.object({
  email: z.string().trim().email("Ungültige E-Mail-Adresse").max(120),
  address: addressSchema,
  shippingMethod: z.enum(SHIPPING_METHODS),
  paymentMethod: z.enum(PAYMENT_METHODS),
  lines: z.array(cartLineSchema).min(1, "Warenkorb ist leer").max(50),
  /** Colour code of the free overgrip (validated against product data server-side). */
  giftGrip: z.string().max(4).optional(),
  acceptTerms: z.literal(true, { error: "Bitte AGB akzeptieren" }),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type OrderStatus = "pending" | "paid" | "failed" | "shipped";
