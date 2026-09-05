/** Shop configuration – business constants (no secrets). */
export const shopConfig = {
  /** Flat shipping rate within Switzerland, CHF incl. VAT. */
  shippingFlatChf: 7.9,
  /** Orders at or above this subtotal ship for free. */
  freeShippingFromChf: 60,
  /** Swiss VAT rate shown on receipts (prices are already incl.). */
  vatRate: 0.081,
  /** Print-on-demand: allow ordering 3D-printed items without stock check. */
  printOnDemand: true,
  /** Operator notification address for order copies. TODO(operator): confirm. */
  operatorEmail: "bestellungen@padora.ch",
  /** Sender used by Resend. TODO(operator): verify domain in Resend. */
  mailFrom: "Padora <shop@padora.ch>",
} as const;
