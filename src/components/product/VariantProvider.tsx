"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { VariantOption } from "@/types/product";

type VariantContextValue = {
  options: VariantOption[];
  /** Currently selected variant code, or "" for products without variants. */
  code: string;
  setCode: (code: string) => void;
  selected: VariantOption | undefined;
};

const VariantContext = createContext<VariantContextValue | null>(null);

/**
 * Shares the selected variant between the gallery and the purchase island, so
 * picking a colour also recolours the 3D model. Wrap both in this provider.
 */
export function VariantProvider({ options, children }: { options: VariantOption[]; children: ReactNode }) {
  const [code, setCode] = useState(options[0]?.code ?? "");
  const value = useMemo<VariantContextValue>(
    () => ({ options, code, setCode, selected: options.find((option) => option.code === code) }),
    [options, code],
  );
  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>;
}

export function useVariant(): VariantContextValue {
  const context = useContext(VariantContext);
  if (!context) throw new Error("useVariant must be used inside <VariantProvider>");
  return context;
}

/**
 * Colour of the selected variant, for components that only care about the tint
 * and must keep working outside a provider (or for products without colours).
 */
export function useVariantColor(fallback: string): string {
  return useContext(VariantContext)?.selected?.hex ?? fallback;
}
