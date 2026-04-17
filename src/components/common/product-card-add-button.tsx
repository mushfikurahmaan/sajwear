"use client";

import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCart } from "@/hooks/useCart";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";

type ProductCardAddButtonProps = {
  product: Product;
  productName: string;
  variant?: "default" | "card";
};

export function ProductCardAddButton({ product, productName, variant = "default" }: ProductCardAddButtonProps) {
  const t = useTranslations("product");
  const tCard = useTranslations("productCard");
  const { addItem } = useCart();
  const disabled = product.stock_status === "out_of_stock";
  const isCard = variant === "card";
  const addLabel = isCard ? tCard("addToCart") : t("addToCart");

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() =>
        addItem({
          product_public_id: product.public_id,
          product_slug: product.slug,
          name: productName,
          price: product.price,
          image_url: product.image_url,
          max_quantity: product.available_quantity,
        })
      }
      className={cn(
        "flex w-full cursor-pointer items-center justify-center text-white transition-colors duration-200 ease-out",
        isCard
          ? "gap-2 rounded-md py-2.5 text-sm font-medium bg-primary hover:bg-primary/90 active:bg-primary/95"
          : "h-8 gap-1 rounded-md text-[11px] font-semibold sm:h-9 sm:gap-1.5 sm:text-[13px] bg-primary hover:bg-primary/90",
        "disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 disabled:hover:bg-neutral-300",
      )}
    >
      <ShoppingCart
        className={cn("shrink-0 stroke-[2]", isCard ? "size-[18px]" : "size-3.5 sm:size-4 md:size-4")}
        aria-hidden
      />
      <span>{disabled ? t("outOfStock") : addLabel}</span>
    </button>
  );
}
