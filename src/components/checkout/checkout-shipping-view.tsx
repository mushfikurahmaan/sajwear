"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

import { useCart } from "@/hooks/useCart";
import { apiFetchJson } from "@/lib/client/api";
import { formatMoney, parseDecimal } from "@/lib/format";
import { resolveStorefrontImageUrl, storefrontImageUnoptimized } from "@/lib/storefront-image";
import { triggerInitiateCheckout } from "@/lib/tracker";
import { parseVariantAttributePairs } from "@/lib/variant-details";
import { cn } from "@/lib/utils";
import { Link, useRouter, type Locale } from "@/i18n/routing";
import type { PaperbaseShippingOption, PaperbaseShippingZone } from "@/types/paperbase";

import { QuantityStepper } from "@/components/ui/quantity-stepper";

import { CheckoutBreadcrumbs } from "./checkout-breadcrumbs";

const CHECKOUT_DRAFT_STORAGE_KEY = "paperbase-checkout-draft";

type CheckoutDraft = {
  shipping_zone_public_id: string;
  shipping_method_public_id?: string;
  shipping_name: string;
  phone: string;
  email?: string;
  shipping_address: string;
  district?: string;
  products: Array<{
    product_public_id: string;
    quantity: number;
    variant_public_id?: string;
  }>;
};

export function CheckoutShippingView() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const tStates = useTranslations("states");
  const productT = useTranslations("product");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const { checkoutItems, checkoutSubtotal, isBuyNow, hydrated, increment, decrement, removeItem, clearBuyNow } =
    useCart();
  const [zones, setZones] = useState<Array<{ zone_public_id: string; name: string }>>([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [methods, setMethods] = useState<
    Array<{ method_public_id: string; method_name: string; price: string; estimated?: string }>
  >([]);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [shippingCost, setShippingCost] = useState("0.00");
  const [finalTotal, setFinalTotal] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const cartItems = useMemo(
    () =>
      checkoutItems.map((item) => ({
        product_public_id: item.product_public_id,
        variant_public_id: item.variant_public_id,
        quantity: item.quantity,
      })),
    [checkoutItems],
  );

  useEffect(() => {
    if (!hydrated || checkoutItems.length === 0) {
      return;
    }
    triggerInitiateCheckout(checkoutItems);
  }, [hydrated, checkoutItems]);

  useEffect(() => {
    let mounted = true;
    async function loadZones() {
      if (!hydrated || checkoutItems.length === 0) {
        return;
      }
      try {
        const response = await apiFetchJson<PaperbaseShippingZone[]>("/checkout/shipping/zones");
        if (!mounted) return;
        const activeZones = response
          .filter((zone) => zone.is_active)
          .map((zone) => ({ zone_public_id: zone.zone_public_id, name: zone.name }));
        setZones(activeZones);
        if (activeZones[0]) {
          setSelectedZone(activeZones[0].zone_public_id);
        }
      } catch {
        if (!mounted) return;
        setErrorText("Failed to load shipping zones.");
      }
    }
    loadZones();
    return () => {
      mounted = false;
    };
  }, [hydrated, checkoutItems.length]);

  useEffect(() => {
    let mounted = true;
    async function loadOptions() {
      if (!selectedZone) {
        return;
      }
      setLoading(true);
      setErrorText(null);
      try {
        const options = await apiFetchJson<PaperbaseShippingOption[]>(
          `/checkout/shipping/options?zone_public_id=${encodeURIComponent(selectedZone)}`,
        );
        if (!mounted) return;
        const mapped = options.map((option) => ({
          method_public_id: option.method_public_id,
          method_name: option.method_name,
          price: option.price,
        }));
        setMethods(mapped);
        setSelectedMethod((current) => current || mapped[0]?.method_public_id || "");
      } catch {
        if (!mounted) return;
        setErrorText("Failed to load shipping methods.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadOptions();
    return () => {
      mounted = false;
    };
  }, [selectedZone]);

  useEffect(() => {
    let mounted = true;
    async function loadPricing() {
      if (!cartItems.length) {
        return;
      }
      try {
        const response = await apiFetchJson<{
          shipping_cost: string;
          final_total: string;
        }>("/checkout/initiate", {
          method: "POST",
          body: JSON.stringify({
            items: cartItems,
            shipping_zone_public_id: selectedZone || undefined,
            shipping_method_public_id: selectedMethod || undefined,
          }),
        });
        if (!mounted) return;
        setShippingCost(response.shipping_cost);
        setFinalTotal(response.final_total);
      } catch {
        if (!mounted) return;
        setErrorText("Failed to calculate pricing.");
      }
    }
    loadPricing();
    return () => {
      mounted = false;
    };
  }, [cartItems, selectedMethod, selectedZone]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) {
      return;
    }
    if (!selectedZone) {
      setErrorText("Please choose a shipping zone.");
      return;
    }
    const formData = new FormData(form);
    const shipping_name = `${String(formData.get("firstName") || "").trim()} ${String(
      formData.get("lastName") || "",
    ).trim()}`.trim();
    const phone = String(formData.get("phone") || "").trim();
    const shipping_address = String(formData.get("shippingAddress") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const district = String(formData.get("district") || "").trim();

    const draft: CheckoutDraft = {
      shipping_zone_public_id: selectedZone,
      shipping_method_public_id: selectedMethod || undefined,
      shipping_name,
      phone,
      email: email || undefined,
      shipping_address,
      district: district || undefined,
      products: cartItems,
    };
    window.sessionStorage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    // Buy Now session is captured in the draft — release the temporary map
    clearBuyNow();
    router.push("/checkout/payment");
  }

  if (!hydrated) {
    return (
      <div className="py-16 text-center text-sm text-neutral-600">{tStates("loading")}</div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-6 text-neutral-700">{t("empty")}</p>
        <Link
          href="/#products"
          className="inline-flex rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-900"
        >
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  const selectedMethodObject = methods.find((method) => method.method_public_id === selectedMethod);
  const displayShipping = selectedMethodObject ? selectedMethodObject.price : shippingCost;

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10";

  const shellCard = "rounded-lg border border-neutral-200 bg-white shadow-sm";

  return (
    <div className="min-w-0 max-w-full pb-12 pt-6 md:pb-16 md:pt-8">
      <CheckoutBreadcrumbs step="shipping" />

      <form
        onSubmit={handleSubmit}
        className="mx-auto grid w-full min-w-0 max-w-5xl gap-6 lg:grid-cols-2 lg:items-start lg:gap-8"
      >
        <aside className={`min-w-0 ${shellCard} p-5 sm:p-6`}>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-950">{t("orderSummary")}</h2>

          <ul className="mt-5 space-y-4">
            {checkoutItems.map((item) => {
              const variantPairs = parseVariantAttributePairs(item.variant_details);
              const productHref = item.product_slug ? (`/products/${item.product_slug}` as const) : null;
              const imageSrc = resolveStorefrontImageUrl(item.image_url);
              // In Buy Now mode quantities are fixed; remove button is also hidden
              const showRemoveLine = !isBuyNow && checkoutItems.length > 1;
              return (
                <li
                  key={`${item.product_public_id}-${item.variant_public_id ?? "default"}`}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex gap-2 sm:gap-3">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-neutral-100 bg-neutral-50">
                      <Image
                        src={imageSrc}
                        alt={item.name}
                        fill
                        sizes="80px"
                        className="object-contain p-1.5"
                        unoptimized={storefrontImageUnoptimized(imageSrc)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      {productHref ? (
                        <Link
                          href={productHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-fit max-w-full text-sm font-light leading-snug text-neutral-900 underline decoration-neutral-400 decoration-1 underline-offset-[3px] hover:text-neutral-950 hover:decoration-neutral-800"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="text-sm font-light leading-snug text-neutral-900">{item.name}</p>
                      )}
                      {variantPairs.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {variantPairs.map((pair, idx) => (
                            <div key={`${pair.label}-${pair.value}-${idx}`} className="min-w-0">
                              {pair.label ? (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                  {pair.label}
                                </p>
                              ) : null}
                              <span className="mt-1 inline-flex rounded bg-neutral-950 px-2.5 py-1 text-xs font-medium text-white">
                                {pair.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <p className="mt-3 text-xs font-normal text-neutral-500">
                        <span className="price-display-line">{formatMoney(item.price, locale)}</span>{" "}
                        <span>{t("each")}</span>
                      </p>
                      <div className="mt-3">
                        <QuantityStepper
                          layout="segmented"
                          quantity={item.quantity}
                          onIncrement={() => increment(item.product_public_id, item.variant_public_id)}
                          onDecrement={() => decrement(item.product_public_id, item.variant_public_id)}
                          increaseLabel={
                            isBuyNow
                              ? productT("increaseQuantityDisabledMax")
                              : item.max_quantity != null && item.quantity >= item.max_quantity
                                ? productT("increaseQuantityDisabledMax")
                                : productT("increaseQuantity")
                          }
                          decreaseLabel={
                            isBuyNow || item.quantity <= 1
                              ? productT("decreaseQuantityDisabledMin")
                              : productT("decreaseQuantity")
                          }
                          decrementDisabled={isBuyNow || item.quantity <= 1}
                          incrementDisabled={
                            isBuyNow ||
                            (item.max_quantity != null && item.quantity >= item.max_quantity)
                          }
                        />
                      </div>
                    </div>
                    {showRemoveLine ? (
                      <div className="shrink-0 self-start pt-0.5">
                        <button
                          type="button"
                          onClick={() => removeItem(item.product_public_id, item.variant_public_id)}
                          className="text-xs font-medium text-neutral-500 underline decoration-neutral-300 underline-offset-2 transition-colors hover:text-primary"
                        >
                          {tCart("remove")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-3 border-t border-neutral-100 pt-3 text-end text-xs font-normal text-neutral-500">
                    <span className="tabular-nums text-neutral-700">
                      {formatMoney(parseDecimal(item.price) * item.quantity, locale)}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>

          <dl className="mt-6 space-y-2.5 border-t border-neutral-200 pt-5 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-normal text-neutral-500">{t("subtotal")}</dt>
              <dd className="price-display-summary shrink-0 text-end">{formatMoney(checkoutSubtotal, locale)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt className="font-normal text-neutral-500">{t("shippingLine")}</dt>
              <dd className="price-display-summary shrink-0 text-end">{formatMoney(displayShipping, locale)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-neutral-200 pt-3">
              <dt className="text-sm font-normal text-neutral-700">{t("total")}</dt>
              <dd className="price-display-total shrink-0 text-end leading-none !text-primary">
                {formatMoney(finalTotal, locale)}
              </dd>
            </div>
          </dl>
        </aside>

        <div className="min-w-0 space-y-6">
          <section className={`${shellCard} p-5 sm:p-6`}>
            <h1 className="text-lg font-semibold tracking-tight text-neutral-950">{t("customerInfoTitle")}</h1>
            <div className="mt-6 grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-neutral-950">
                    {t("firstName")}
                    <span className="text-red-600"> *</span>
                  </span>
                  <input
                    className={inputClass}
                    name="firstName"
                    required
                    autoComplete="given-name"
                    placeholder={t("firstNamePlaceholder")}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-neutral-950">
                    {t("lastName")}
                    <span className="text-red-600"> *</span>
                  </span>
                  <input
                    className={inputClass}
                    name="lastName"
                    required
                    autoComplete="family-name"
                    placeholder={t("lastNamePlaceholder")}
                  />
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-neutral-950">{t("email")}</span>
                <input
                  className={inputClass}
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                />
              </label>
              <div className="grid min-w-0 gap-2">
                <span className="text-sm font-medium text-neutral-950">
                  {t("phone")}
                  <span className="text-red-600"> *</span>
                </span>
                <div className="flex min-w-0 gap-2">
                  <input type="hidden" name="dial" value="+880" />
                  <span
                    className={cn(
                      inputClass,
                      "inline-flex max-w-[7.5rem] shrink-0 cursor-default select-none items-center text-neutral-600 sm:max-w-[8.5rem]",
                    )}
                  >
                    {t("dialOption_bd")}
                  </span>
                  <input
                    className={cn(inputClass, "min-w-0 flex-1")}
                    name="phone"
                    type="tel"
                    required
                    pattern="01[0-9]{9}"
                    maxLength={11}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder={t("phonePlaceholder")}
                    aria-label={`${t("dialOption_bd")} ${t("phone")}`}
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-neutral-950">
                    {t("city")}
                    <span className="text-red-600"> *</span>
                  </span>
                  <input
                    className={inputClass}
                    name="city"
                    required
                    autoComplete="address-level2"
                    placeholder={t("cityPlaceholder")}
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-neutral-950">
                    {t("state")}
                    <span className="text-red-600"> *</span>
                  </span>
                  <input
                    className={inputClass}
                    name="district"
                    required
                    autoComplete="address-level1"
                    placeholder={t("districtPlaceholder")}
                  />
                </label>
              </div>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-neutral-950">
                  {t("addressField")}
                  <span className="text-red-600"> *</span>
                </span>
                <textarea
                  className={cn(inputClass, "min-h-[5.5rem] resize-y")}
                  name="shippingAddress"
                  rows={3}
                  required
                  placeholder={t("addressPlaceholder")}
                />
              </label>
            </div>
          </section>

          <section className={`${shellCard} p-5 sm:p-6`}>
            <h2 className="text-base font-semibold text-neutral-950">{t("shippingZone")}</h2>
            <fieldset className="mt-4 grid gap-3">
              <legend className="sr-only">{t("shippingZone")}</legend>
              {zones.map((zone) => {
                const selected = selectedZone === zone.zone_public_id;
                return (
                  <label
                    key={zone.zone_public_id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                      selected
                        ? "border-neutral-950 bg-white ring-1 ring-neutral-950"
                        : "border-neutral-200 bg-white hover:border-neutral-300",
                    )}
                  >
                    <input
                      type="radio"
                      name="shippingZonePick"
                      value={zone.zone_public_id}
                      checked={selected}
                      onChange={() => setSelectedZone(zone.zone_public_id)}
                      className="size-4 shrink-0 accent-blue-600"
                    />
                    <span className="text-sm font-medium text-neutral-950">{zone.name}</span>
                  </label>
                );
              })}
            </fieldset>
          </section>

          <section className={`${shellCard} p-5 sm:p-6`}>
            <h2 className="text-base font-semibold text-neutral-950">{t("shippingMethod")}</h2>
            <fieldset className="mt-4 grid min-w-0 gap-3">
              <legend className="sr-only">{t("shippingMethod")}</legend>
              {methods.map((opt) => {
                const selected = selectedMethod === opt.method_public_id;
                return (
                  <label
                    key={opt.method_public_id}
                    className={cn(
                      "flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors",
                      selected
                        ? "border-neutral-950 bg-white ring-1 ring-neutral-950"
                        : "border-neutral-200 bg-white hover:border-neutral-300",
                    )}
                  >
                    <input
                      type="radio"
                      name="shippingMethod"
                      value={opt.method_public_id}
                      checked={selected}
                      onChange={() => setSelectedMethod(opt.method_public_id)}
                      className="size-4 shrink-0 accent-blue-600"
                    />
                    <span className="min-w-0 flex-1 text-sm font-medium text-neutral-950">{opt.method_name}</span>
                    <span className="price-display-line shrink-0 text-end">{formatMoney(opt.price, locale)}</span>
                  </label>
                );
              })}
            </fieldset>
          </section>

          {errorText ? <p className="text-sm text-red-600">{errorText}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-lg bg-neutral-950 text-sm font-semibold text-white transition-colors hover:bg-neutral-900 disabled:opacity-50"
          >
            {t("continueToPayment")}
          </button>
        </div>
      </form>
    </div>
  );
}
