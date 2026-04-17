import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { CheckoutShippingView } from "@/components/checkout/checkout-shipping-view";
import { PageContainer } from "@/components/layout/page-container";
import { routing, type Locale } from "@/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "checkout" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CheckoutPage({ params }: PageProps) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <div className="min-h-screen overflow-x-clip bg-neutral-100">
      <PageContainer>
        <CheckoutShippingView />
      </PageContainer>
    </div>
  );
}
