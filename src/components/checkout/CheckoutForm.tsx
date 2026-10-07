"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { formatChf } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  checkoutSchema,
  PAYMENT_METHODS,
  paymentMethodLabel,
  SHIPPING_METHODS,
  shippingMethodLabel,
  type PaymentMethod,
} from "@/types/checkout";

type FieldErrors = Partial<Record<string, string>>;

const inputClass =
  "block w-full min-h-12 rounded-(--radius-button) border border-line bg-surface px-3 text-base text-ink placeholder:text-neutral focus:border-brand focus:outline-none aria-[invalid=true]:border-error";

function Field({ label, name, error, children }: { label: string; name: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="mt-1 text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const { ready, lines, totals, giftGrip } = useCart();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("twint");

  if (!ready) return <p className="py-12 text-center text-neutral">Wird geladen …</p>;
  if (lines.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-4 px-6 py-12 text-center">
        <p className="text-neutral">Dein Warenkorb ist leer.</p>
        <ButtonLink href="/shop" variant="secondary">
          Zum Shop
        </ButtonLink>
      </div>
    );
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const candidate = {
      email: fd.get("email"),
      address: {
        firstName: fd.get("firstName"),
        lastName: fd.get("lastName"),
        street: fd.get("street"),
        zip: fd.get("zip"),
        city: fd.get("city"),
        country: "CH",
        phone: fd.get("phone") ?? "",
      },
      shippingMethod: fd.get("shippingMethod"),
      paymentMethod: fd.get("paymentMethod"),
      acceptTerms: fd.get("acceptTerms") === "on",
      lines: lines.filter((l) => !l.gift).map((l) => l.line),
      giftGrip: lines.find((l) => l.gift)?.line.variantCode ?? giftGrip,
    };
    const parsed = checkoutSchema.safeParse(candidate);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[issue.path.length - 1];
        if (typeof key === "string" && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setFormError(data.error ?? "Bestellung konnte nicht erstellt werden.");
        setSubmitting(false);
        return;
      }
      router.push(data.url);
    } catch {
      setFormError("Verbindung fehlgeschlagen. Bitte erneut versuchen.");
      setSubmitting(false);
    }
  }

  /** Clear a field's error as soon as the user changes it. */
  function onChange(e: FormEvent<HTMLFormElement>) {
    const name = (e.target as HTMLInputElement).name;
    if (name && errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  const ariaProps = (name: string) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} onChange={onChange} noValidate className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="text-lg">Kontakt</h2>
          <Field label="E-Mail" name="email" error={errors.email}>
            <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} {...ariaProps("email")} />
          </Field>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg">Lieferadresse (Schweiz)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vorname" name="firstName" error={errors.firstName}>
              <input id="firstName" name="firstName" autoComplete="given-name" className={inputClass} {...ariaProps("firstName")} />
            </Field>
            <Field label="Nachname" name="lastName" error={errors.lastName}>
              <input id="lastName" name="lastName" autoComplete="family-name" className={inputClass} {...ariaProps("lastName")} />
            </Field>
          </div>
          <Field label="Strasse und Nr." name="street" error={errors.street}>
            <input id="street" name="street" autoComplete="street-address" className={inputClass} {...ariaProps("street")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
            <Field label="PLZ" name="zip" error={errors.zip}>
              <input id="zip" name="zip" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete="postal-code" className={inputClass} {...ariaProps("zip")} />
            </Field>
            <Field label="Ort" name="city" error={errors.city}>
              <input id="city" name="city" autoComplete="address-level2" className={inputClass} {...ariaProps("city")} />
            </Field>
          </div>
          <Field label="Telefon (optional)" name="phone" error={errors.phone}>
            <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputClass} {...ariaProps("phone")} />
          </Field>
          <input type="hidden" name="country" value="CH" />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg">Versand</h2>
          {SHIPPING_METHODS.map((m) => (
            <label key={m} className="card flex min-h-12 cursor-pointer items-center gap-3 p-4 has-[:checked]:border-brand">
              <input type="radio" name="shippingMethod" value={m} defaultChecked className="size-5 accent-brand" />
              <span className="flex-1 text-sm font-medium">{shippingMethodLabel[m]}</span>
              <span className="text-sm text-neutral">{totals.shipping === 0 ? "Gratis" : formatChf(totals.shipping)}</span>
            </label>
          ))}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg">Zahlung</h2>
          {PAYMENT_METHODS.map((m) => (
            <label
              key={m}
              className={cn("card flex min-h-12 cursor-pointer items-center gap-3 p-4", payment === m && "border-brand")}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={m}
                checked={payment === m}
                onChange={() => setPayment(m)}
                className="size-5 accent-brand"
              />
              <span className="flex-1 text-sm font-medium">{paymentMethodLabel[m]}</span>
            </label>
          ))}
          <p className="text-xs text-neutral">Die Zahlung wird sicher über Payrexx abgewickelt. Du wirst weitergeleitet.</p>
        </section>

        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="acceptTerms" className="mt-0.5 size-5 shrink-0 accent-brand" {...ariaProps("acceptTerms")} />
          <span>
            Ich akzeptiere die{" "}
            <a href="/agb" target="_blank" className="font-medium text-brand-dark underline underline-offset-2">
              AGB
            </a>{" "}
            und habe die{" "}
            <a href="/datenschutz" target="_blank" className="font-medium text-brand-dark underline underline-offset-2">
              Datenschutzerklärung
            </a>{" "}
            gelesen.
            {errors.acceptTerms && <span className="mt-1 block text-error">{errors.acceptTerms}</span>}
          </span>
        </label>
      </div>

      <aside className="card p-5 lg:sticky lg:top-20">
        <h2 className="text-lg">Bestellung</h2>
        <ul className="mt-4 divide-y divide-line text-sm">
          {lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-3 py-2">
              <span className="min-w-0">
                {l.line.qty}× {l.product.name}
                {l.partner && ` + ${l.partner.name}`}
                {l.variantLabel && <span className="text-neutral"> · {l.variantLabel}</span>}
              </span>
              <span className="shrink-0 tabular-nums">{l.gift ? "Gratis" : formatChf(l.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral">Zwischensumme</dt>
            <dd className="tabular-nums">{formatChf(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral">Versand</dt>
            <dd className="tabular-nums">{totals.shipping === 0 ? "Gratis" : formatChf(totals.shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatChf(totals.total)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-neutral">Alle Preise inkl. MwSt.</p>
        {formError && (
          <p role="alert" className="mt-4 rounded-(--radius-button) border border-error/40 px-3 py-2 text-sm text-error">
            {formError}
          </p>
        )}
        <Button type="submit" disabled={submitting} className="mt-5 w-full">
          {submitting ? "Weiterleitung …" : "Zahlungspflichtig bestellen"}
        </Button>
      </aside>
    </form>
  );
}
