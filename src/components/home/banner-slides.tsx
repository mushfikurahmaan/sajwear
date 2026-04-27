import Image from "next/image";

import { BannerCarouselClient } from "@/components/home/banner-carousel-client";
import { resolveBannerSlides, type ResolvedBannerSlide } from "@/lib/banner-media";
import type { PaperbaseBanner } from "@/types/paperbase";

/** Same aspect everywhere so banners read consistently on mobile and desktop (images crop with object-cover). */
const BANNER_ASPECT = "aspect-[16/7]";

type BannerSlidesProps = {
  banner: PaperbaseBanner;
  fallbackAlt: string;
  /** First slide uses Next/Image priority (LCP). */
  priority?: boolean;
  showTitleOverlay: boolean;
};

function SingleSlideBanner({
  slide,
  priority,
  sizes,
}: {
  slide: ResolvedBannerSlide;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden ${BANNER_ASPECT}`}>
      <Image
        src={slide.image_url}
        alt={slide.alt}
        fill
        sizes={sizes}
        unoptimized
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}

export function BannerSlides({
  banner,
  fallbackAlt,
  priority = false,
  showTitleOverlay,
}: BannerSlidesProps) {
  const slides = resolveBannerSlides(banner);
  if (slides.length === 0) {
    return null;
  }

  const title = banner.title?.trim() ? banner.title : null;
  const sizes = "100vw";

  const overlay =
    showTitleOverlay && title ? (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/65 via-black/25 to-transparent px-4 pb-4 pt-10 text-white md:px-6 md:pb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <p className="text-pretty text-base font-semibold leading-snug md:text-lg">{title}</p>
        </div>
      </div>
    ) : null;

  if (slides.length === 1) {
    return (
      <div className="relative w-full">
        <SingleSlideBanner slide={slides[0]} priority={priority} sizes={sizes} />
        {overlay}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <BannerCarouselClient
        slides={slides}
        priorityFirst={priority}
        aspectClassName={BANNER_ASPECT}
        ariaLabel={title ?? fallbackAlt}
      />
      {overlay}
    </div>
  );
}
