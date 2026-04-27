"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import type { ResolvedBannerSlide } from "@/lib/banner-media";

type BannerCarouselClientProps = {
  slides: ResolvedBannerSlide[];
  priorityFirst?: boolean;
  /** Tailwind aspect ratio — same box on mobile and desktop */
  aspectClassName: string;
  /** Accessible name for the carousel region */
  ariaLabel: string;
};

export function BannerCarouselClient({
  slides,
  priorityFirst = false,
  aspectClassName,
  ariaLabel,
}: BannerCarouselClientProps) {
  const n = slides.length;
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + n) % n);
    },
    [n],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) {
      return;
    }
    const end = e.changedTouches[0]?.clientX;
    if (end == null) {
      return;
    }
    const dx = end - start;
    if (dx < -48) {
      go(1);
    } else if (dx > 48) {
      go(-1);
    }
  };

  const fraction = n > 0 ? 100 / n : 100;

  return (
    <div
      className="relative w-full"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      {/* Fixed frame: arrows and dots are positioned inside this box */}
      <div
        className={`relative w-full overflow-hidden ${aspectClassName}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="absolute inset-0 flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{
            width: `${n * 100}%`,
            transform: `translateX(-${(index * 100) / n}%)`,
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              className="relative h-full shrink-0"
              style={{ width: `${fraction}%` }}
            >
              <Image
                src={slide.image_url}
                alt={slide.alt}
                fill
                sizes="100vw"
                unoptimized
                priority={priorityFirst && i === 0}
                draggable={false}
                className="select-none object-cover"
              />
            </div>
          ))}
        </div>

        {n > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="pointer-events-auto absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:left-3 md:h-10 md:w-10"
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="pointer-events-auto absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-black/45 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 md:right-3 md:h-10 md:w-10"
              aria-label="Next slide"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
            <div
              className="pointer-events-auto absolute left-0 right-0 top-2 z-20 flex justify-center gap-1.5 md:top-3"
              role="tablist"
              aria-label="Banner slides"
            >
              {slides.map((slide, i) => (
                <button
                  key={slide.key}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Slide ${i + 1} of ${n}`}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 rounded-full shadow-sm transition-all ${i === index ? "w-6 bg-white ring-1 ring-black/15" : "w-1.5 bg-black/30 ring-1 ring-white/40 hover:bg-black/45"}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
