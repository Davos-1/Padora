import { shopConfig } from "@/lib/config";
import { formatChf } from "@/lib/format";
import { site } from "@/lib/site";
import { paymentMethodLabel } from "@/types/checkout";
import type { Order } from "./orders";

/** Escape user-provided strings before interpolating into HTML. */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

// Inline styles only – mail clients ignore stylesheets. Colours follow tokens.css.
const C = { ink: "#1A1D21", paper: "#FAFAF7", brand: "#147A80", brandDark: "#0E5C63", neutral: "#8A8F98", line: "#ECECE8", surface: "#FFFFFF" };
const font = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="de-CH"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${C.paper};font-family:${font};color:${C.ink};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.paper};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
<tr><td style="padding:8px 0 20px;font-size:14px;font-weight:500;letter-spacing:0.3em;text-transform:uppercase;color:${C.ink};">PADORA</td></tr>
<tr><td style="background:${C.surface};border:1px solid ${C.line};border-radius:12px;padding:28px 24px;">${body}</td></tr>
<tr><td style="padding:20px 4px 0;font-size:12px;line-height:1.5;color:${C.neutral};">
${esc(site.name)} · ${esc(site.domain)} · <a href="mailto:${esc(site.contactEmail)}" style="color:${C.brandDark};">${esc(site.contactEmail)}</a><br>Alle Preise in CHF inkl. MwSt. Versand nur innerhalb der Schweiz.</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(order: Order): string {
  const rows = order.items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:14px;">${esc(i.name)}<br><span style="color:${C.neutral};font-size:12px;">${esc(i.variantSku)} · ${i.qty} × ${esc(formatChf(i.priceChf))}</span></td>
<td align="right" style="padding:10px 0;border-bottom:1px solid ${C.line};font-size:14px;white-space:nowrap;">${esc(formatChf(i.priceChf * i.qty))}</td></tr>`,
    )
    .join("");
  const shipping = order.shipping_chf === 0 ? "Gratis" : formatChf(order.shipping_chf);
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:16px;">${rows}
<tr><td style="padding:10px 0 4px;font-size:14px;color:${C.neutral};">Zwischensumme</td><td align="right" style="padding:10px 0 4px;font-size:14px;">${esc(formatChf(order.subtotal_chf))}</td></tr>
<tr><td style="padding:4px 0;font-size:14px;color:${C.neutral};">Versand</td><td align="right" style="padding:4px 0;font-size:14px;">${esc(shipping)}</td></tr>
<tr><td style="padding:12px 0 0;font-size:16px;font-weight:500;border-top:1px solid ${C.line};">Total</td><td align="right" style="padding:12px 0 0;font-size:16px;font-weight:500;border-top:1px solid ${C.line};">${esc(formatChf(order.total_chf))}</td></tr>
</table>`;
}

function addressBlock(order: Order): string {
  const a = order.address;
  return `<p style="margin:0;font-size:14px;line-height:1.5;">${esc(a.firstName)} ${esc(a.lastName)}<br>${esc(a.street)}<br>${esc(a.zip)} ${esc(a.city)}<br>Schweiz${a.phone ? `<br>${esc(a.phone)}` : ""}</p>`;
}

export function customerConfirmation(order: Order): { subject: string; html: string; text: string } {
  const method = order.payment_method ? paymentMethodLabel[order.payment_method] : "–";
  const html = layout(
    `Bestellbestätigung ${order.id}`,
    `<p style="margin:0 0 4px;font-size:13px;font-weight:500;color:${C.brandDark};">Zahlung bestätigt</p>
<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;line-height:1.25;">Danke für deine Bestellung, ${esc(order.address.firstName)}!</h1>
<p style="margin:0 0 16px;font-size:14px;line-height:1.55;">Wir haben deine Bestellung <strong>${esc(order.id)}</strong> erhalten. Sobald das Paket unterwegs ist, melden wir uns.</p>
${itemsTable(order)}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;"><tr>
<td valign="top" width="50%" style="padding-right:12px;"><p style="margin:0 0 6px;font-size:12px;color:${C.neutral};">Lieferadresse</p>${addressBlock(order)}</td>
<td valign="top" width="50%"><p style="margin:0 0 6px;font-size:12px;color:${C.neutral};">Zahlung</p><p style="margin:0;font-size:14px;">${esc(method)}</p></td>
</tr></table>
<p style="margin:24px 0 0;font-size:13px;line-height:1.55;color:${C.neutral};">Fragen? Antworte einfach auf diese E-Mail oder schreib an <a href="mailto:${esc(site.contactEmail)}" style="color:${C.brandDark};">${esc(site.contactEmail)}</a>.</p>`,
  );
  const text = [
    `Danke für deine Bestellung ${order.id}!`,
    "",
    ...order.items.map((i) => `${i.qty} × ${i.name} (${i.variantSku}) – ${formatChf(i.priceChf * i.qty)}`),
    `Versand: ${order.shipping_chf === 0 ? "Gratis" : formatChf(order.shipping_chf)}`,
    `Total: ${formatChf(order.total_chf)}`,
    "",
    `Lieferadresse: ${order.address.firstName} ${order.address.lastName}, ${order.address.street}, ${order.address.zip} ${order.address.city}`,
    `Zahlung: ${method}`,
    "",
    `${site.name} · ${site.domain}`,
  ].join("\n");
  return { subject: `Bestellbestätigung ${order.id} – ${site.name}`, html, text };
}

export function operatorNotification(order: Order): { subject: string; html: string; text: string } {
  const method = order.payment_method ? paymentMethodLabel[order.payment_method] : "–";
  const printItems = order.items.filter((i) => i.variantSku.startsWith("VP-MNT") || i.variantSku.startsWith("VP-SET"));
  const html = layout(
    `Neue Bestellung ${order.id}`,
    `<p style="margin:0 0 4px;font-size:13px;font-weight:500;color:${C.brandDark};">Neue bezahlte Bestellung</p>
<h1 style="margin:0 0 12px;font-size:22px;font-weight:500;">${esc(order.id)} · ${esc(formatChf(order.total_chf))}</h1>
<p style="margin:0;font-size:14px;line-height:1.55;">${esc(order.name)} · <a href="mailto:${esc(order.email)}" style="color:${C.brandDark};">${esc(order.email)}</a><br>Zahlung: ${esc(method)} · Payrexx-Transaktion ${esc(order.payrexx_transaction_id ?? "–")}</p>
${printItems.length ? `<p style="margin:12px 0 0;padding:10px 12px;border:1px solid ${C.brand};border-radius:8px;font-size:13px;color:${C.brandDark};">${printItems.length} Position(en) aus dem 3D-Druck – Fertigung einplanen.</p>` : ""}
${itemsTable(order)}
<p style="margin:24px 0 6px;font-size:12px;color:${C.neutral};">Lieferadresse</p>${addressBlock(order)}`,
  );
  const text = [
    `Neue Bestellung ${order.id} – ${formatChf(order.total_chf)}`,
    `${order.name} <${order.email}> · ${method}`,
    "",
    ...order.items.map((i) => `${i.qty} × ${i.name} (${i.variantSku})`),
    "",
    `${order.address.street}, ${order.address.zip} ${order.address.city}`,
  ].join("\n");
  return { subject: `Neue Bestellung ${order.id} (${formatChf(order.total_chf)})`, html, text };
}

export const mailFrom = shopConfig.mailFrom;
export const operatorEmail = shopConfig.operatorEmail;
