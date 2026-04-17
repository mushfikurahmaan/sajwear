import type { Metadata } from "next";
import { ChevronRight, Star, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { ProductDetailAccordions } from "@/components/product/product-detail-accordions";
import { ProductDetailBuySection } from "@/components/product/product-detail-buy-section";
import { ProductDetailSkuRow } from "@/components/product/product-detail-sku-row";
import { ProductGallery } from "@/components/product/product-gallery";
import { VariantSelectionProvider } from "@/components/product/product-variant-selection";
import { ProductCard } from "@/components/common/product-card";
import { PageContainer } from "@/components/layout/page-container";
import { Link, routing, type Locale } from "@/i18n/routing";
import { categoryDisplayName } from "@/lib/category-display";
import { formatMoney, parseDecimal } from "@/lib/format";
import {
  getStorefrontProductDetail,
  getStorefrontProductSlugs,
  getStorefrontRelatedProducts,
} from "@/lib/products";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getStorefrontProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    return {};
  }

  const product = await getStorefrontProductDetail(slug);
  if (!product) {
    return {};
  }

  return {
    title: `${product.name} · Sarar Global`,
    description: product.description || product.name,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const activeLocale = locale as Locale;

  const [product, relatedProducts] = await Promise.all([
    getStorefrontProductDetail(slug),
    getStorefrontRelatedProducts(slug),
  ]);
  if (!product) {
    notFound();
  }

  const tDetail = await getTranslations("productDetail");
  const productName = product.name;
  const unitPrice = product.price;
  const discountPercent =
    product.original_price != null && parseDecimal(product.original_price) > 0
      ? Math.max(
          1,
          Math.round((1 - parseDecimal(product.price) / parseDecimal(product.original_price)) * 100),
        )
      : null;
  const detailBullets = [product.description];

  const accordionItems = [
    { id: "product-details", title: tDetail("sectionProductDetails"), body: "" },
  ];

  const categoryLabel = categoryDisplayName(product.category_name);
  const galleryImages = product.images.length
    ? product.images.map((item) => item.image_url || "/placeholders/hero.svg")
    : [product.image_url || "/placeholders/hero.svg"];

  return (
    <div className="bg-background">
      <section className="bg-white pb-12 lg:pb-20">
        <PageContainer>
          {/* Breadcrumb */}
          <nav className="py-4 text-sm text-neutral-400" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="transition-colors hover:text-primary">
                  {tDetail("breadcrumbHome")}
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="size-3.5 text-neutral-300" strokeWidth={2.5} />
              </li>
              <li>
                <Link href="/#products" className="transition-colors hover:text-primary">
                  {tDetail("breadcrumbProducts")}
                </Link>
              </li>
              <li aria-hidden>
                <ChevronRight className="size-3.5 text-neutral-300" strokeWidth={2.5} />
              </li>
              <li className="max-w-[min(100%,28rem)] truncate font-thin text-neutral-600">
                {productName}
              </li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:gap-12 xl:grid-cols-[1fr_460px] xl:gap-16">
            {/* Gallery — full height, no sticky */}
            <div className="min-w-0">
              <ProductGallery
                images={galleryImages}
                productName={productName}
                discountPercent={discountPercent}
              />
            </div>

            {/* Product info — sticky on desktop */}
            <div className="flex min-w-0 flex-col gap-0 lg:sticky lg:top-24 lg:self-start">
              {/* Category chip */}
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                {categoryLabel}
              </p>

              <h1 className="text-2xl font-thin leading-snug tracking-tight text-text sm:text-3xl">
                {productName}
              </h1>

              {/* Rating placeholder */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3.5 ${i < 4 ? "fill-accent text-accent" : "fill-neutral-200 text-neutral-200"}`}
                      strokeWidth={0}
                    />
                  ))}
                </div>
                <span className="text-xs text-neutral-400">4.0</span>
              </div>

              <VariantSelectionProvider variants={product.variants}>
                <ProductDetailSkuRow />

                {/* Price block */}
                <div className="mt-5 rounded-lg bg-neutral-50 px-4 py-4 sm:px-5">
                  {product.original_price != null ? (
                    <>
                      <p className="price-display-eyebrow">{tDetail("nowLabel")}</p>
                      <p className="price-display-hero mt-1">{formatMoney(unitPrice, activeLocale)}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <div className="flex items-baseline gap-2">
                          <span className="price-display-eyebrow-neutral">{tDetail("wasLabel")}</span>
                          <span className="price-display-compare">
                            {formatMoney(product.original_price, activeLocale)}
                          </span>
                        </div>
                        {discountPercent != null ? (
                          <span className="price-display-discount-pill">
                            {tDetail("priceDiscount", { percent: discountPercent })}
                          </span>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <p className="price-display-hero">{formatMoney(unitPrice, activeLocale)}</p>
                  )}
                </div>

                {/* Divider */}
                <div className="my-5 h-px bg-neutral-100" />

                {/* Variant picker + buy section */}
                <ProductDetailBuySection
                  productPublicId={product.public_id}
                  productSlug={product.slug}
                  productName={productName}
                  unitPrice={unitPrice}
                  imageUrl={product.image_url}
                  stockStatus={product.stock_status}
                  stockTracking={product.stock_tracking}
                  availableQuantity={product.available_quantity}
                />
              </VariantSelectionProvider>

              {/* Trust badges */}
              <div className="mt-5 grid grid-cols-3 gap-2 rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <div className="flex flex-col items-center gap-1 text-center">
                  <Truck className="size-5 text-primary" strokeWidth={1.8} />
                  <span className="text-[10px] font-semibold leading-tight text-neutral-500">
                    Fast Delivery
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <RotateCcw className="size-5 text-primary" strokeWidth={1.8} />
                  <span className="text-[10px] font-semibold leading-tight text-neutral-500">
                    Easy Returns
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <ShieldCheck className="size-5 text-primary" strokeWidth={1.8} />
                  <span className="text-[10px] font-semibold leading-tight text-neutral-500">
                    Secure Payment
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="mt-5" />

              {/* Accordions */}
              <ProductDetailAccordions
                items={accordionItems}
                bulletParagraphs={detailBullets}
                bulletItemId="product-details"
                defaultOpenId="product-details"
              />
            </div>
          </div>
        </PageContainer>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="border-t border-neutral-100 bg-background py-10">
          <PageContainer>
            <h2 className="mb-6 text-xl font-bold text-text">{tDetail("breadcrumbProducts")}</h2>
            <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {relatedProducts.map((related) => (
                <ProductCard key={related.public_id} product={related} />
              ))}
            </div>
          </PageContainer>
        </section>
      ) : null}
    </div>
  );
}
