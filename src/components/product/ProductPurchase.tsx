"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/types/product";
import { formatChf } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { useVariant } from "./VariantProvider";
import { ColorSwatches } from "./ColorSwatches";
import { SizeSelect } from "./SizeSelect";
import { BundleBox } from "./BundleBox";

type Props = {
  product: Product;
  /** Bundle partner (resolved server-side) with the computed set price. */
  bundle?: { partner: Product; setPrice: number };
};

/**
 * Client island for variant choice, bundle option and the (sticky) CTA.
 */
export function ProductPurchase({ product, bundle }: Props) {
  const { typ, optionen } = product.varianten;
  // The selection lives in the provider, shared with the gallery so the 3D
  // model follows the colour choice; the options stay owned by the product.
  const { code: variant, setCode: setVariant } = useVariant();
  const [withBundle, setWithBundle] = useState(false);
  const [added, setAdded] = useState(false);
  const cart = useCart();

  useEffect(() => {
    if (!added) return;
    const t = window.setTimeout(() => setAdded(false), 4000);
    return () => window.clearTimeout(t);
  }, [added]);

  const price = withBundle && bundle ? bundle.setPrice : product.preisChf;
  const singlePrice = bundle ? product.preisChf + bundle.partner.preisChf : product.preisChf;

  function onAdd() {
    cart.add({
      sku: product.sku,
      variantCode: typ ? variant : null,
      qty: 1,
      ...(withBundle && bundle ? { bundleWithSku: bundle.partner.sku } : {}),
    });
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-5">
      {typ === "farbe" && <ColorSwatches options={optionen} value={variant} onChange={setVariant} />}
      {typ === "groesse" && <SizeSelect options={optionen} value={variant} onChange={setVariant} />}

      {bundle && product.bundle && (
        <BundleBox
          partnerName={bundle.partner.name}
          rabattProzent={product.bundle.rabattProzent}
          singlePrice={singlePrice}
          bundlePrice={bundle.setPrice}
          checked={withBundle}
          onChange={setWithBundle}
        />
      )}

      {/* Sticky CTA bar on mobile, inline on desktop – the only brand CTA in the viewport */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-paper/95 p-3 backdrop-blur-sm md:static md:border-0 md:bg-transparent md:p-0">
        <div className="mx-auto flex max-w-(--container-max) items-center justify-between gap-4 md:justify-start">
          <p className="flex flex-col leading-tight">
            <span className="text-lg font-medium text-ink">{formatChf(price)}</span>
            <span className="text-xs text-neutral">inkl. MwSt., zzgl. Versand</span>
          </p>
          <Button onClick={onAdd} className="flex-1 md:flex-none md:min-w-56">
            In den Warenkorb
          </Button>
        </div>
        <p role="status" aria-live="polite" className="mx-auto max-w-(--container-max) text-sm text-success md:mt-3">
          {added && (
            <>
              Hinzugefügt.{" "}
              <Link href="/warenkorb" className="font-medium underline underline-offset-2">
                Zum Warenkorb
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
