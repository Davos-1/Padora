import { NextResponse } from "next/server";
import { checkoutSchema, paymentMethodLabel } from "@/types/checkout";
import { cartTotals, resolveLines } from "@/lib/cart";
import { getDb, getEnv } from "@/lib/server/db";
import { createPendingOrder, findOutOfStock, setGatewayId, stockRelevantItems, toOrderItems } from "@/lib/server/orders";
import { createGateway, getPayrexxConfig } from "@/lib/server/payrexx";

export const dynamic = "force-dynamic";

/**
 * Creates a pending order from a validated cart (prices are always resolved
 * server-side from product data) and returns the Payrexx redirect URL.
 * Without Payrexx credentials a local mock payment page is used instead.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bitte Eingaben prüfen", issues: parsed.error.issues }, { status: 400 });
  }
  const input = parsed.data;

  const lines = resolveLines({ lines: input.lines });
  if (lines.length === 0 || lines.length !== input.lines.length) {
    return NextResponse.json({ error: "Einzelne Artikel sind nicht mehr verfügbar. Bitte Warenkorb prüfen." }, { status: 409 });
  }
  const totals = cartTotals(lines);

  const env = await getEnv();
  const db = await getDb();

  const stockItems = stockRelevantItems(lines);
  const outOfStock = await findOutOfStock(db, stockItems);
  if (outOfStock.length) {
    return NextResponse.json({ error: "Nicht genügend Lagerbestand", outOfStock }, { status: 409 });
  }

  const order = await createPendingOrder(db, {
    email: input.email,
    address: input.address,
    items: toOrderItems(lines),
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    total: totals.total,
    paymentMethod: input.paymentMethod,
  });

  const siteUrl = (env.SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
  const thanks = `${siteUrl}/checkout/danke?order=${order.id}&t=${order.access_token}`;

  const cfg = getPayrexxConfig(env);
  if (!cfg) {
    // Mock mode (no credentials): simulate the hosted payment page locally.
    await setGatewayId(db, order.id, `mock-${order.id}`);
    return NextResponse.json({ url: `${siteUrl}/checkout/mock-payment?order=${order.id}&t=${order.access_token}`, orderId: order.id, mock: true });
  }

  try {
    const gateway = await createGateway(cfg, {
      amountChf: order.total_chf,
      referenceId: order.id,
      purpose: `Padora Bestellung ${order.id} (${paymentMethodLabel[input.paymentMethod]})`,
      paymentMethod: input.paymentMethod,
      successUrl: `${thanks}&result=success`,
      failedUrl: `${thanks}&result=failed`,
      cancelUrl: `${thanks}&result=cancel`,
      customer: { ...input.address, email: input.email, phone: input.address.phone || undefined },
    });
    await setGatewayId(db, order.id, String(gateway.id));
    return NextResponse.json({ url: gateway.link, orderId: order.id });
  } catch (e) {
    console.error("Payrexx gateway creation failed", e);
    return NextResponse.json({ error: "Zahlungsanbieter nicht erreichbar. Bitte später erneut versuchen." }, { status: 502 });
  }
}
