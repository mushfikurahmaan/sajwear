"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { useCart } from "@/hooks/useCart";
import { formatMoney } from "@/lib/format";
import { resolveStorefrontImageUrl, storefrontImageUnoptimized } from "@/lib/storefront-image";
import { parseVariantAttributePairs } from "@/lib/variant-details";
import { Link, type Locale } from "@/i18n/routing";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

type CartPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function CartPanel({ open, onClose }: CartPanelProps) {
  const t = useTranslations("cart");
  const states = useTranslations("states");
  const common = useTranslations("common");
  const productT = useTranslations("product");
  const locale = useLocale() as Locale;
  const { items, hydrated, subtotal, itemCount, removeItem, increment, decrement, clear } =
    useCart();

  if (!open) {
    return null;
  }

  return (
    <aside className="fixed inset-0 z-50 bg-black/40" onClick={onClose} role="presentation">
      <div
        className="ml-auto flex h-full w-full max-w-md flex-col bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between pb-1">
          <h2 className="text-xl font-semibold text-text">{t("title")}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={common("close")}>
            <X className="size-5 shrink-0" strokeWidth={2} aria-hidden />
          </Button>
        </div>

        {!hydrated ? (
          <p className="text-sm text-text/70">{states("loading")}</p>
        ) : items.length === 0 ? (
          <p className="rounded-md border border-dashed border-primary/30 p-4 text-sm text-text/80">
            {t("empty")}
          </p>
        ) : (
          <div className="flex flex-1 flex-col gap-2 overflow-auto">
            {items.map((item) => {
              const imageSrc = resolveStorefrontImageUrl(item.image_url);
              const variantPairs = parseVariantAttributePairs(item.variant_details);
              return (
              <div
                key={`${item.product_public_id}-${item.variant_public_id ?? "default"}`}
                className="flex items-start gap-2 rounded-lg border border-neutral-200/70 bg-background px-2 py-2 shadow-sm"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-surface">
                  <Image
                    src={imageSrc}
                    alt={item.name}
                    fill
                    sizes="56px"
                    className="object-contain p-0.5"
                    unoptimized={storefrontImageUnoptimized(imageSrc)}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-xs font-medium leading-tight text-text">{item.name}</h3>
                  {variantPairs.length > 0 ? (
                    <div className="mt-1 flex flex-wrap gap-x-1.5 gap-y-1">
                      {variantPairs.map((pair, idx) => (
                        <div key={`${pair.label}-${pair.value}-${idx}`} className="min-w-0">
                          {pair.label ? (
                            <p className="text-[8px] font-bold uppercase tracking-wide text-neutral-500">
                              {pair.label}
                            </p>
                          ) : null}
                          <span className="mt-px inline-flex max-w-full truncate rounded bg-neutral-900 px-1 py-px text-[10px] font-medium leading-tight text-white">
                            {pair.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-1 price-display-line leading-tight">{formatMoney(item.price, locale)}</p>
                  <div className="mt-1">
                    <QuantityStepper
                      quantity={item.quantity}
                      onIncrement={() => increment(item.product_public_id, item.variant_public_id)}
                      onDecrement={() => decrement(item.product_public_id, item.variant_public_id)}
                      increaseLabel={
                        item.max_quantity != null && item.quantity >= item.max_quantity
                          ? productT("increaseQuantityDisabledMax")
                          : productT("increaseQuantity")
                      }
                      decreaseLabel={
                        item.quantity <= 1
                          ? productT("decreaseQuantityDisabledMin")
                          : productT("decreaseQuantity")
                      }
                      decrementDisabled={item.quantity <= 1}
                      incrementDisabled={item.max_quantity != null && item.quantity >= item.max_quantity}
                      className="gap-1 [&>button]:h-8 [&>button]:min-h-8 [&>button]:px-2 [&>button]:text-sm [&>span]:min-w-5 [&>span]:text-xs"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 self-center px-1.5 text-xs text-neutral-600 hover:text-primary"
                  onClick={() => removeItem(item.product_public_id, item.variant_public_id)}
                >
                  {t("remove")}
                </Button>
              </div>
            );
            })}
          </div>
        )}

        <div className="mt-4 bg-white/80 pt-4">
          <p className="price-display-eyebrow-neutral">{t("subtotal")}</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className="text-sm text-text/75">{t("items", { count: itemCount })}</p>
            <p className="price-display-total shrink-0 leading-none">{formatMoney(subtotal, locale)}</p>
          </div>
          <div className="mb-4 mt-4 h-px bg-neutral-200/80" aria-hidden />
          <div className="grid gap-2">
            {items.length === 0 ? (
              <Button variant="accent" disabled>
                {t("checkout")}
              </Button>
            ) : (
              <Link
                href="/checkout"
                onClick={onClose}
                className={cn(buttonVariants({ variant: "accent", size: "md" }), "w-full")}
              >
                {t("checkout")}
              </Link>
            )}
            <Button variant="primary" onClick={clear} disabled={items.length === 0}>
              {t("clear")}
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
