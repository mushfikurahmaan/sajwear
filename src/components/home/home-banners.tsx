import { BannerSlides } from "@/components/home/banner-slides";
import { PageContainer } from "@/components/layout/page-container";
import { bannerHasVisual } from "@/lib/banner-media";
import type { PaperbaseBanner } from "@/types/paperbase";

export function HomeMidBannersBlock({
  banners,
  headlineFallback,
}: {
  banners: PaperbaseBanner[];
  headlineFallback: string;
}) {
  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {banners.map((banner) => (
        <div key={banner.public_id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          {bannerHasVisual(banner) ? (
            <BannerSlides
              banner={banner}
              fallbackAlt={headlineFallback}
              showTitleOverlay={Boolean(banner.title?.trim())}
            />
          ) : (
            <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:gap-5 md:p-6">
              <p className="text-pretty text-base font-semibold leading-snug text-text md:text-lg">{banner.title}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function HomeFullBleedBannersBlock({
  banners,
  headlineFallback,
}: {
  banners: PaperbaseBanner[];
  headlineFallback: string;
}) {
  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-6 md:space-y-8">
      {banners.map((banner) => (
        <section key={banner.public_id} className="w-full">
          {bannerHasVisual(banner) ? (
            <BannerSlides
              banner={banner}
              fallbackAlt={headlineFallback}
              showTitleOverlay={Boolean(banner.title?.trim())}
            />
          ) : (
            <PageContainer>
              <div className="card mx-auto max-w-4xl px-4 py-6 text-center md:px-6">
                <p className="text-pretty text-base font-semibold leading-snug text-text md:text-lg">{banner.title}</p>
              </div>
            </PageContainer>
          )}
        </section>
      ))}
    </div>
  );
}
