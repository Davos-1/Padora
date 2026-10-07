import type { Product } from "@/types/product";
import { shopConfig } from "./config";
import { bundlePrice, roundChf } from "./pricing";
import { getProductBySku, variantSku } from "./products";

/**
 * Cart state lives in localStorage only (no account system). Lines store
 * references (SKU + variant), never prices – prices are always resolved from
 * product data, on the client for display and on the server for checkout.
 */
export type CartLine = {
  sku: string;
  /** Variant code (colour / size) or null for products without variants. */
  variantCode: string | null;
  qty: number;
  /** Set to the partner SKU when bought as a discounted bundle. */
  bundleWithSku?: string;
};

export type CartState = {
  lines: CartLine[];
  /** Colour code of the free overgrip that comes with every order (default WHT). */
  giftGrip?: string;
};

/** Every order containing a non-grip product includes one free overgrip. */
export const GIFT_GRIP_SKU = "VP-GRP-1ER";
export const GIFT_GRIP_DEFAULT = "WHT";
export const GIFT_LINE_KEY = "gift";

export const CART_STORAGE_KEY = "padora.cart.v1";
export const MAX_QTY = 20;

export const emptyCart: CartState = { lines: [] };

export function lineKey(line: Pick<CartLine, "sku" | "variantCode" | "bundleWithSku">): string {
  return `${line.sku}|${line.variantCode ?? ""}|${line.bundleWithSku ?? ""}`;
}

function clampQty(qty: number): number {
  return Math.max(0, Math.min(MAX_QTY, Math.floor(qty)));
}

export function addLine(state: CartState, line: CartLine): CartState {
  const key = lineKey(line);
  const existing = state.lines.find((l) => lineKey(l) === key);
  if (existing) {
    return setQty(state, key, existing.qty + line.qty);
  }
  const qty = clampQty(line.qty);
  return qty === 0 ? state : { ...state, lines: [...state.lines, { ...line, qty }] };
}

export function setQty(state: CartState, key: string, qty: number): CartState {
  const next = clampQty(qty);
  return {
    ...state,
    lines: state.lines.flatMap((l) => (lineKey(l) === key ? (next === 0 ? [] : [{ ...l, qty: next }]) : [l])),
  };
}

export function removeLine(state: CartState, key: string): CartState {
  return { ...state, lines: state.lines.filter((l) => lineKey(l) !== key) };
}

export function setGiftGrip(state: CartState, code: string): CartState {
  return { ...state, giftGrip: code };
}

export function itemCount(state: CartState): number {
  return state.lines.reduce((n, l) => n + l.qty, 0);
}

/** Resolved line with product data and computed prices. */
export type ResolvedLine = {
  key: string;
  line: CartLine;
  product: Product;
  partner?: Product;
  variantLabel: string | null;
  variantSku: string;
  unitPrice: number;
  lineTotal: number;
  /** True for the free overgrip added automatically (not a stored cart line). */
  gift?: boolean;
};

/**
 * Resolves cart lines against the product catalogue. Lines whose product no
 * longer exists (or is inactive) are dropped silently – the catalogue wins.
 */
export function resolveLines(state: CartState): ResolvedLine[] {
  const out: ResolvedLine[] = [];
  for (const line of state.lines) {
    const product = getProductBySku(line.sku);
    if (!product || !product.aktiv) continue;
    const option = line.variantCode ? product.varianten.optionen.find((o) => o.code === line.variantCode) : undefined;
    if (line.variantCode && !option) continue;

    let partner: Product | undefined;
    let unitPrice = product.preisChf;
    if (line.bundleWithSku) {
      partner = getProductBySku(line.bundleWithSku);
      if (!partner || product.bundle?.mitSku !== partner.sku) continue;
      unitPrice = bundlePrice(product, partner);
    }

    out.push({
      key: lineKey(line),
      line,
      product,
      partner,
      variantLabel: option?.label ?? null,
      variantSku: variantSku(product, line.variantCode),
      unitPrice,
      lineTotal: roundChf(unitPrice * line.qty),
    });
  }

  const giftLine = resolveGiftLine(out, state.giftGrip);
  if (giftLine) out.push(giftLine);
  return out;
}

function resolveGiftLine(lines: ResolvedLine[], code: string | undefined): ResolvedLine | null {
  if (!lines.some((l) => l.product.kategorie !== "grips")) return null;
  const product = getProductBySku(GIFT_GRIP_SKU);
  if (!product || !product.aktiv) return null;
  const options = product.varianten.optionen;
  const option = options.find((o) => o.code === code) ?? options.find((o) => o.code === GIFT_GRIP_DEFAULT) ?? options[0];
  if (!option) return null;
  return {
    key: GIFT_LINE_KEY,
    line: { sku: product.sku, variantCode: option.code, qty: 1 },
    product,
    variantLabel: option.label,
    variantSku: variantSku(product, option.code),
    unitPrice: 0,
    lineTotal: 0,
    gift: true,
  };
}

export type CartTotals = {
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingRemaining: number;
};

export function shippingCost(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= shopConfig.freeShippingFromChf ? 0 : shopConfig.shippingFlatChf;
}

export function cartTotals(lines: ResolvedLine[]): CartTotals {
  const subtotal = roundChf(lines.reduce((s, l) => s + l.lineTotal, 0));
  const shipping = shippingCost(subtotal);
  return {
    subtotal,
    shipping,
    total: roundChf(subtotal + shipping),
    freeShippingRemaining: Math.max(0, roundChf(shopConfig.freeShippingFromChf - subtotal)),
  };
}

/** Parses persisted JSON defensively – never trust localStorage. */
export function parseCart(raw: string | null): CartState {
  if (!raw) return emptyCart;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !Array.isArray((data as { lines?: unknown }).lines)) return emptyCart;
    const lines: CartLine[] = [];
    for (const item of (data as { lines: unknown[] }).lines) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      if (typeof o.sku !== "string" || typeof o.qty !== "number") continue;
      const variantCode = typeof o.variantCode === "string" ? o.variantCode : null;
      const bundleWithSku = typeof o.bundleWithSku === "string" ? o.bundleWithSku : undefined;
      const qty = clampQty(o.qty);
      if (qty > 0) lines.push({ sku: o.sku, variantCode, qty, ...(bundleWithSku ? { bundleWithSku } : {}) });
    }
    const giftGrip = typeof (data as { giftGrip?: unknown }).giftGrip === "string" ? (data as { giftGrip: string }).giftGrip : undefined;
    return { lines, ...(giftGrip ? { giftGrip } : {}) };
  } catch {
    return emptyCart;
  }
}
