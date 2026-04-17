"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { apiFetchJson } from "@/lib/client/api";
import { formatPaperbaseError, stockValidationErrors } from "@/lib/api/paperbase-errors";
import { Link } from "@/i18n/routing";
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
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

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
      setOrderNumber(order.order_number);
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
        {orderNumber ? (
          <>
            <h1 className="text-xl font-semibold text-text">Order placed successfully</h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">Order number: {orderNumber}</p>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-md bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-900"
            >
              Continue shopping
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
                {loading ? "Placing order..." : "Place order"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
