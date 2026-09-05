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

export type CartState = { lines: CartLine[] };

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
  return qty === 0 ? state : { lines: [...state.lines, { ...line, qty }] };
}

export function setQty(state: CartState, key: string, qty: number): CartState {
  const next = clampQty(qty);
  return {
    lines: state.lines.flatMap((l) => (lineKey(l) === key ? (next === 0 ? [] : [{ ...l, qty: next }]) : [l])),
  };
}

export function removeLine(state: CartState, key: string): CartState {
  return { lines: state.lines.filter((l) => lineKey(l) !== key) };
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
  return out;
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
    return { lines };
  } catch {
    return emptyCart;
  }
}
