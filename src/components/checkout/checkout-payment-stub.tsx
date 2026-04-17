"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/client/api";
import { formatPaperbaseError, stockValidationErrors } from "@/lib/api/paperbase-errors";
import { Link, type Locale } from "@/i18n/routing";
import { formatMoney } from "@/lib/format";
import { triggerPurchase } from "@/lib/tracker";
import type { PaperbaseOrderCreateResponse } from "@/types/paperbase";

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

export function CheckoutPaymentStub() {
  const t = useTranslations("checkout");
  const locale = useLocale() as Locale;
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [placedOrder, setPlacedOrder] = useState<PaperbaseOrderCreateResponse | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY);
    if (!raw) {
      return;
    }
    try {
      setDraft(JSON.parse(raw) as CheckoutDraft);
    } catch {
      setDraft(null);
    }
  }, []);

  async function handlePlaceOrder() {
    if (!draft) {
      setErrorText("Missing checkout details. Please go back to shipping.");
      return;
    }
    setLoading(true);
    setErrorText(null);
    try {
      const order = await apiFetchJson<PaperbaseOrderCreateResponse>("/checkout/order", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      setPlacedOrder(order);
      triggerPurchase({
        order_number: order.order_number,
        total: order.total,
        items: order.items,
      });
      window.sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY);
    } catch (error) {
      const stockErrors = stockValidationErrors(error);
      setErrorText(stockErrors.length ? stockErrors.join(" | ") : formatPaperbaseError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white pb-12 pt-6 md:pb-16 md:pt-8">
      <CheckoutBreadcrumbs step="payment" />

      <div className="mx-auto max-w-lg rounded-lg border border-neutral-200/60 bg-white p-8 shadow-sm md:p-10">
        {placedOrder ? (
          <>
            <h1 className="text-xl font-semibold text-text">{t("orderPlacedTitle")}</h1>
            <dl className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-600">
              <div>
                <dt className="font-medium text-neutral-950">{t("orderNumberLabel")}</dt>
                <dd className="mt-0.5">{placedOrder.order_number}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-950">{t("orderConfirmCustomerName")}</dt>
                <dd className="mt-0.5">{placedOrder.customer_name}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-950">{t("orderConfirmPhone")}</dt>
                <dd className="mt-0.5">{placedOrder.phone}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-950">{t("orderConfirmAddress")}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{placedOrder.shipping_address}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutral-950">{t("total")}</dt>
                <dd className="mt-0.5 tabular-nums text-neutral-950">{formatMoney(placedOrder.total, locale)}</dd>
              </div>
            </dl>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-md bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-900"
            >
              {t("continueShoppingAfterOrder")}
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-text">{t("paymentStubHeading")}</h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">{t("paymentStubBody")}</p>
            {errorText ? <p className="mt-3 text-sm text-red-600">{errorText}</p> : null}
            <div className="mt-8 flex gap-3">
              <Link
                href="/checkout"
                className="inline-flex rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
              >
                {t("backToShipping")}
              </Link>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={loading}
                className="inline-flex rounded-md bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-900 disabled:opacity-50"
              >
                {loading ? t("placingOrder") : t("placeOrder")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
