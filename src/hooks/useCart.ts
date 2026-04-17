"use client";

import { useEffect, useMemo } from "react";

import { parseDecimal } from "@/lib/format";
import { useCartStore } from "@/lib/store/cart-store";
import type { CartItem } from "@/types/cart";

export function useCart() {
  const itemsMap = useCartStore((state) => state.itemsMap);
  const buyNowMap = useCartStore((state) => state.buyNowMap);
  const hydrated = useCartStore((state) => state.hydrated);
  const hydrateCart = useCartStore((state) => state.hydrateCart);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const increment = useCartStore((state) => state.increment);
  const decrement = useCartStore((state) => state.decrement);
  const clear = useCartStore((state) => state.clear);
  const openCartPanel = useCartStore((state) => state.openCartPanel);
  const startBuyNow = useCartStore((state) => state.startBuyNow);
  const clearBuyNow = useCartStore((state) => state.clearBuyNow);
  const updateItemVariant = useCartStore((state) => state.updateItemVariant);

  useEffect(() => {
    if (!hydrated) {
      hydrateCart();
    }
  }, [hydrateCart, hydrated]);

  /** Stable array of main cart items for cart panel / general UI. */
  const items = useMemo<CartItem[]>(() => Object.values(itemsMap), [itemsMap]);

  /**
   * Number of unique product-variant combinations.
   * This is the value shown on the cart badge — NOT total quantity.
   */
  const itemCount = Object.keys(itemsMap).length;

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + parseDecimal(item.price) * item.quantity, 0),
    [items],
  );

  /**
   * True when a Buy Now session is active.
   * The checkout view should read `checkoutItems` and `checkoutSubtotal`
   * instead of `items` / `subtotal` while this is true.
   */
  const isBuyNow = buyNowMap !== null;

  /** Items the checkout page should render — Buy Now set (if active) or the main cart. */
  const checkoutItems = useMemo<CartItem[]>(
    () => (buyNowMap ? Object.values(buyNowMap) : items),
    [buyNowMap, items],
  );

  const checkoutSubtotal = useMemo(
    () => checkoutItems.reduce((acc, item) => acc + parseDecimal(item.price) * item.quantity, 0),
    [checkoutItems],
  );

  return {
    items,
    hydrated,
    itemCount,
    subtotal,
    checkoutItems,
    checkoutSubtotal,
    isBuyNow,
    addItem,
    removeItem,
    increment,
    decrement,
    clear,
    openCartPanel,
    startBuyNow,
    clearBuyNow,
    updateItemVariant,
  };
}
