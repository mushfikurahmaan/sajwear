"use client";

import { Share2, ShoppingCart, Zap } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useVariantSelection } from "@/components/product/product-variant-selection";
import { useCart } from "@/hooks/useCart";
import { useRouter } from "@/i18n/routing";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProductDetailBuySectionProps = {
  productPublicId: string;
  productSlug: string;
  productName: string;
  unitPrice: string;
  imageUrl: string | null;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  stockTracking: boolean;
  availableQuantity: number;
};

export function ProductDetailBuySection({
  productPublicId,
  productSlug,
  productName,
  unitPrice,
  imageUrl,
  stockStatus,
  stockTracking,
  availableQuantity,
}: ProductDetailBuySectionProps) {
  const t = useTranslations("product");
  const tDetail = useTranslations("productDetail");
  const locale = useLocale() as "en" | "bn";
  const { addItem, openCartPanel, startBuyNow } = useCart();
  const router = useRouter();
  const { variants, selectedValues, setSelectedValue, selectedVariant, optionsByAttribute } =
    useVariantSelection();

  const effectiveStockStatus = selectedVariant?.stock_status ?? stockStatus;
  const effectivePrice = selectedVariant?.price ?? unitPrice;
  const inStock = effectiveStockStatus !== "out_of_stock";
  const isLowStock = effectiveStockStatus === "low_stock";
  const variantResolved = variants.length === 0 || selectedVariant != null;
  const canPurchase = inStock && variantResolved;

  const payload = () => {
    const maxQuantity = !stockTracking
      ? undefined
      : selectedVariant != null
        ? selectedVariant.available_quantity
        : variants.length === 0
          ? availableQuantity
          : undefined;

    return {
      product_public_id: productPublicId,
      product_slug: productSlug,
      variant_public_id: selectedVariant?.public_id,
      name: productName,
      price: effectivePrice,
      image_url: imageUrl,
      max_quantity: maxQuantity,
      variant_details: selectedVariant
        ? selectedVariant.options.map((opt) => `${opt.attribute_name}: ${opt.value}`).join(", ")
        : undefined,
    };
  };

  const handleAdd = () => {
    if (!canPurchase) return;
    addItem(payload(), 1);
    openCartPanel();
  };

  function handleOrderNow() {
    if (!canPurchase) return;
    // Clone current cart + merge this item into a temporary Buy Now map.
    // The main cart is NOT mutated — checkout reads from buyNowMap instead.
    startBuyNow(payload(), 1);
    router.push("/checkout");
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: productName, url });
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user dismissed share sheet or clipboard blocked */
    }
  }

  return (
    <div className="space-y-4">
      {/* Variant selectors */}
      {[...optionsByAttribute.entries()].map(([slug, data]) => (
        <div key={slug}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            {data.attribute_name}
            {selectedValues[slug] ? (
              <span className="ml-1.5 font-semibold normal-case tracking-normal text-text">
                :{" "}
                {data.values.find((v) => v.value_public_id === selectedValues[slug])?.value}
              </span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-2">
            {data.values.map((value) => {
              const selected = selectedValues[slug] === value.value_public_id;
              return (
                <button
                  key={value.value_public_id}
                  type="button"
                  onClick={() => setSelectedValue(slug, value.value_public_id)}
                  aria-pressed={selected}
                  className={cn(
                    "inline-flex min-h-9 items-center rounded-md px-4 py-2 text-sm font-semibold transition-all duration-150",
                    selected
                      ? "bg-primary text-white shadow-sm ring-2 ring-primary ring-offset-1"
                      : "border border-neutral-200 bg-white text-text hover:border-primary/40 hover:bg-primary/[0.04]",
                  )}
                >
                  {value.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Effective variant price */}
      {variants.length > 0 && selectedVariant ? (
        <div className="rounded-lg border border-primary/20 bg-primary/[0.05] px-4 py-3">
          <p className="price-display-eyebrow-neutral">{tDetail("effectivePriceLabel")}</p>
          <p className="price-display-variant mt-1">{formatMoney(effectivePrice, locale)}</p>
        </div>
      ) : null}

      {/* Stock status hint */}
      {isLowStock ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-600">
          <span className="inline-block size-1.5 rounded-full bg-amber-400" />
          Only a few left in stock
        </p>
      ) : !inStock ? (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400">
          <span className="inline-block size-1.5 rounded-full bg-neutral-300" />
          Out of stock
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
          <span className="inline-block size-1.5 rounded-full bg-success" />
          In stock
        </p>
      )}

      {/* Action buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          disabled={!canPurchase}
          onClick={handleOrderNow}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-bold tracking-wide text-white transition-all",
            "bg-primary hover:bg-primary/90 active:scale-[0.98]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <Zap className="size-4" strokeWidth={2.5} aria-hidden />
          {canPurchase ? t("orderNow") : !inStock ? t("outOfStock") : tDetail("selectOptionsToOrder")}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canPurchase}
            onClick={handleAdd}
            className={cn(
              "flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm font-semibold text-text transition-all",
              "hover:border-primary/30 hover:bg-primary/[0.04] active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <ShoppingCart className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            {t("addToCart")}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex size-11 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 transition-all hover:border-primary/30 hover:bg-primary/[0.04] hover:text-primary active:scale-[0.98]"
            aria-label={tDetail("shareProduct")}
          >
            <Share2 className="size-4" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
