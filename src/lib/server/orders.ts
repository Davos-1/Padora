import type { Address, OrderStatus, PaymentMethod } from "@/types/checkout";
import type { ResolvedLine } from "@/lib/cart";
import { shopConfig } from "@/lib/config";
import { nowIso, randomToken } from "./db";

export type OrderItem = { variantSku: string; name: string; qty: number; priceChf: number };

export type OrderRow = {
  id: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
  email: string;
  name: string;
  address_json: string;
  items_json: string;
  subtotal_chf: number;
  shipping_chf: number;
  total_chf: number;
  payment_method: PaymentMethod | null;
  payrexx_gateway_id: string | null;
  payrexx_transaction_id: string | null;
  access_token: string;
  stock_applied: number;
};

export type Order = Omit<OrderRow, "address_json" | "items_json"> & { address: Address; items: OrderItem[] };

export function rowToOrder(row: OrderRow): Order {
  const { address_json, items_json, ...rest } = row;
  return { ...rest, address: JSON.parse(address_json) as Address, items: JSON.parse(items_json) as OrderItem[] };
}

/** Next order id like PDR-2026-0001 – atomic per year via the counter table. */
export async function nextOrderId(db: D1Database): Promise<string> {
  const year = new Date().getFullYear();
  const row = await db
    .prepare(
      `INSERT INTO order_counters (year, last_seq) VALUES (?1, 1)
       ON CONFLICT(year) DO UPDATE SET last_seq = last_seq + 1
       RETURNING last_seq`,
    )
    .bind(year)
    .first<{ last_seq: number }>();
  if (!row) throw new Error("Could not allocate order number");
  return `PDR-${year}-${String(row.last_seq).padStart(4, "0")}`;
}

/** Items that require a stock check (imported goods; prints are on demand). */
export function stockRelevantItems(lines: ResolvedLine[]): Array<{ variantSku: string; qty: number }> {
  const out: Array<{ variantSku: string; qty: number }> = [];
  for (const l of lines) {
    if (!(shopConfig.printOnDemand && l.product.quelle === "print")) {
      out.push({ variantSku: l.variantSku, qty: l.line.qty });
    }
    if (l.partner && !(shopConfig.printOnDemand && l.partner.quelle === "print")) {
      // Bundle partner shares the variant code (same colour system).
      out.push({ variantSku: l.line.variantCode ? `${l.partner.sku}-${l.line.variantCode}` : l.partner.sku, qty: l.line.qty });
    }
  }
  return out;
}

/** Returns SKUs that cannot be fulfilled from current inventory. */
export async function findOutOfStock(db: D1Database, items: Array<{ variantSku: string; qty: number }>): Promise<string[]> {
  if (items.length === 0) return [];
  const stmts = items.map((i) => db.prepare("SELECT stock FROM inventory WHERE variant_sku = ?1").bind(i.variantSku));
  const results = await db.batch<{ stock: number }>(stmts);
  const missing: string[] = [];
  items.forEach((item, i) => {
    const stock = results[i]?.results[0]?.stock;
    if (stock === undefined || stock < item.qty) missing.push(item.variantSku);
  });
  return missing;
}

export function toOrderItems(lines: ResolvedLine[]): OrderItem[] {
  return lines.map((l) => ({
    variantSku: l.variantSku,
    name: l.partner
      ? `${l.product.name} + ${l.partner.name} (Set)${l.variantLabel ? `, ${l.variantLabel}` : ""}`
      : `${l.product.name}${l.variantLabel ? `, ${l.variantLabel}` : ""}`,
    qty: l.line.qty,
    priceChf: l.unitPrice,
  }));
}

export async function createPendingOrder(
  db: D1Database,
  input: {
    email: string;
    address: Address;
    items: OrderItem[];
    subtotal: number;
    shipping: number;
    total: number;
    paymentMethod: PaymentMethod;
  },
): Promise<Order> {
  const id = await nextOrderId(db);
  const ts = nowIso();
  const row: OrderRow = {
    id,
    created_at: ts,
    updated_at: ts,
    status: "pending",
    email: input.email,
    name: `${input.address.firstName} ${input.address.lastName}`,
    address_json: JSON.stringify(input.address),
    items_json: JSON.stringify(input.items),
    subtotal_chf: input.subtotal,
    shipping_chf: input.shipping,
    total_chf: input.total,
    payment_method: input.paymentMethod,
    payrexx_gateway_id: null,
    payrexx_transaction_id: null,
    access_token: randomToken(),
    stock_applied: 0,
  };
  await db
    .prepare(
      `INSERT INTO orders (id, created_at, updated_at, status, email, name, address_json, items_json,
        subtotal_chf, shipping_chf, total_chf, payment_method, access_token)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
    )
    .bind(
      row.id, row.created_at, row.updated_at, row.status, row.email, row.name, row.address_json, row.items_json,
      row.subtotal_chf, row.shipping_chf, row.total_chf, row.payment_method, row.access_token,
    )
    .run();
  return rowToOrder(row);
}

export async function setGatewayId(db: D1Database, orderId: string, gatewayId: string): Promise<void> {
  await db.prepare("UPDATE orders SET payrexx_gateway_id = ?1, updated_at = ?2 WHERE id = ?3").bind(gatewayId, nowIso(), orderId).run();
}

export async function getOrder(db: D1Database, id: string): Promise<Order | null> {
  const row = await db.prepare("SELECT * FROM orders WHERE id = ?1").bind(id).first<OrderRow>();
  return row ? rowToOrder(row) : null;
}

/**
 * Marks a pending order as paid and decrements stock in one batch.
 * Idempotent: a second call for an already-paid order is a no-op.
 * Returns true when the transition happened in this call.
 */
export async function markPaid(
  db: D1Database,
  order: Order,
  payment: { transactionId: string; method: PaymentMethod | null },
  stockItems: Array<{ variantSku: string; qty: number }>,
): Promise<boolean> {
  const ts = nowIso();
  const transition = db
    .prepare(
      `UPDATE orders SET status = 'paid', payrexx_transaction_id = ?1, payment_method = COALESCE(?2, payment_method),
         stock_applied = 1, updated_at = ?3
       WHERE id = ?4 AND status = 'pending'`,
    )
    .bind(payment.transactionId, payment.method, ts, order.id);
  const result = await transition.run();
  if (!result.meta.changes) return false;

  if (stockItems.length) {
    // Stock may legitimately be lower than at checkout time (concurrent orders) – never go negative.
    await db.batch(
      stockItems.map((i) =>
        db
          .prepare("UPDATE inventory SET stock = MAX(stock - ?1, 0), updated_at = ?2 WHERE variant_sku = ?3")
          .bind(i.qty, ts, i.variantSku),
      ),
    );
  }
  return true;
}

export async function markFailed(db: D1Database, orderId: string, transactionId: string | null): Promise<boolean> {
  const result = await db
    .prepare("UPDATE orders SET status = 'failed', payrexx_transaction_id = COALESCE(?1, payrexx_transaction_id), updated_at = ?2 WHERE id = ?3 AND status = 'pending'")
    .bind(transactionId, nowIso(), orderId)
    .run();
  return Boolean(result.meta.changes);
}
