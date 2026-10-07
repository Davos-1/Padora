"use client";

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import {
  addLine,
  cartTotals,
  emptyCart,
  itemCount,
  removeLine,
  resolveLines,
  setGiftGrip,
  setQty,
  type CartLine,
  type CartTotals,
  type ResolvedLine,
} from "@/lib/cart";
import { getServerSnapshot, getSnapshot, subscribe, update } from "@/lib/cart-store";

type CartContextValue = {
  /** False during SSR/hydration – avoids markup mismatches. */
  ready: boolean;
  lines: ResolvedLine[];
  totals: CartTotals;
  count: number;
  /** Selected colour code of the free overgrip. */
  giftGrip: string | undefined;
  setGiftGrip: (code: string) => void;
  add: (line: CartLine) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { ready, state } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const value = useMemo<CartContextValue>(() => {
    const lines = resolveLines(state);
    return {
      ready,
      lines,
      totals: cartTotals(lines),
      count: itemCount(state),
      giftGrip: state.giftGrip,
      setGiftGrip: (code) => update((prev) => setGiftGrip(prev, code)),
      add: (line) => update((prev) => addLine(prev, line)),
      setQty: (key, qty) => update((prev) => setQty(prev, key, qty)),
      remove: (key) => update((prev) => removeLine(prev, key)),
      clear: () => update(() => emptyCart),
    };
  }, [state, ready]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
