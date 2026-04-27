import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { BannerSlides } from "@/components/home/banner-slides";
import { HomeFullBleedBannersBlock, HomeMidBannersBlock } from "@/components/home/home-banners";
import { PageContainer } from "@/components/layout/page-container";
import { Link } from "@/i18n/routing";
import { bannerHasVisual } from "@/lib/banner-media";
import { getStorefrontHomeCategorySections } from "@/lib/products";
import { getStorefrontBanners } from "@/lib/storefront";

export default async function HomePage() {
  const [tHome, categorySections, homeTopBanners, homeMidBanners, homeBottomBanners] = await Promise.all([
    getTranslations("home"),
    getStorefrontHomeCategorySections(),
    getStorefrontBanners("home_top"),
    getStorefrontBanners("home_mid"),
    getStorefrontBanners("home_bottom"),
  ]);
  const heroBanner = homeTopBanners.find((banner) => bannerHasVisual(banner)) ?? null;
  const hasBottomBanners = homeBottomBanners.length > 0;
  const headlineFallback = tHome("headline");

  return (
    <div
      className={`bg-surface ${heroBanner && bannerHasVisual(heroBanner) ? "pt-0" : "pt-4 md:pt-6"} ${hasBottomBanners ? "pb-0" : "pb-10 md:pb-14"}`}
    >
      {heroBanner && bannerHasVisual(heroBanner) ? (
        <section className="mb-10 w-full md:mb-12">
          <BannerSlides
            banner={heroBanner}
            fallbackAlt={headlineFallback}
            showTitleOverlay={false}
            priority
          />
        </section>
      ) : null}

      <PageContainer>
        <section id="products" className="space-y-12 md:space-y-16">
          {categorySections.length === 0 ? (
            <p className="card mx-auto max-w-lg text-center text-sm text-text/80">{tHome("emptyProducts")}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:gap-5">
                {categorySections.map((section, sectionIdx) => (
                  <Link
                    key={section.slug}
                    href={`/categories/${section.slug}`}
                    className="group relative block overflow-hidden border border-neutral-200 bg-[#ebebeb]"
                  >
                    <div className="relative aspect-[16/6] w-full sm:aspect-[16/7] md:aspect-[16/6]">
                      {section.image_url ? (
                        <Image
                          src={section.image_url}
                          alt={section.name}
                          fill
                          unoptimized
                          sizes="(max-width: 639px) 100vw, 50vw"
                          priority={sectionIdx < 2}
                          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-r from-neutral-200 to-neutral-100" />
                      )}
                      <div className="absolute inset-0 bg-black/10 transition-colors duration-300 group-hover:bg-black/20" />
                      <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                        <h2 className="text-[12px] font-normal uppercase tracking-[0.35em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)] sm:text-[13px] md:text-[14px]">
                          {section.name}
                        </h2>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="pt-2 md:pt-4">
                <HomeMidBannersBlock banners={homeMidBanners} headlineFallback={headlineFallback} />
              </div>
            </>
          )}
        </section>
      </PageContainer>

      <div className="mt-12 md:mt-16">
        <HomeFullBleedBannersBlock banners={homeBottomBanners} headlineFallback={headlineFallback} />
      </div>
    </div>
  );
}
