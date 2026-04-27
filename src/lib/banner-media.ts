import type { PaperbaseBanner, PaperbaseBannerImage } from "@/types/paperbase";

export type ResolvedBannerSlide = {
  key: string;
  image_url: string;
  alt: string;
};

function sortBannerImages(a: PaperbaseBannerImage, b: PaperbaseBannerImage) {
  if (a.order !== b.order) {
    return a.order - b.order;
  }
  if (typeof a.id === "number" && typeof b.id === "number" && a.id !== b.id) {
    return a.id - b.id;
  }
  return a.public_id.localeCompare(b.public_id);
}

/** Normalize `images[]` from API JSON (snake_case or camelCase keys). */
function normalizeBannerImageRows(banner: PaperbaseBanner): PaperbaseBannerImage[] {
  if (banner.images?.length) {
    return banner.images;
  }
  const raw = (banner as unknown as { images?: unknown }).images;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [];
  }
  const rows: PaperbaseBannerImage[] = [];
  raw.forEach((row, idx) => {
    if (!row || typeof row !== "object") {
      return;
    }
    const o = row as Record<string, unknown>;
    const image_url =
      (typeof o.image_url === "string" && o.image_url) ||
      (typeof o.imageUrl === "string" && o.imageUrl) ||
      null;
    const public_id =
      (typeof o.public_id === "string" && o.public_id) ||
      (typeof o.publicId === "string" && o.publicId) ||
      `slide-${idx}`;
    const order = typeof o.order === "number" ? o.order : 0;
    const id = typeof o.id === "number" ? o.id : undefined;
    const alt = typeof o.alt === "string" ? o.alt : undefined;
    rows.push({ public_id, image_url, alt, order, id });
  });
  return rows;
}

/**
 * Resolves slides per §7.9: iterate non-empty `images[]` (order, then id, then public_id);
 * otherwise single-slide fallback from `image_url` for older payloads.
 */
export function resolveBannerSlides(banner: PaperbaseBanner): ResolvedBannerSlide[] {
  const titleAlt = banner.title?.trim() || "Banner";
  const gallery = normalizeBannerImageRows(banner).filter((img) => Boolean(img.image_url)).slice().sort(sortBannerImages);
  if (gallery?.length) {
    return gallery.map((img) => ({
      key: img.public_id,
      image_url: img.image_url as string,
      alt: img.alt?.trim() ? img.alt : titleAlt,
    }));
  }
  const legacyUrl =
    banner.image_url ||
    (typeof (banner as unknown as { imageUrl?: unknown }).imageUrl === "string"
      ? ((banner as unknown as { imageUrl: string }).imageUrl as string)
      : null);
  if (legacyUrl) {
    return [{ key: `${banner.public_id}-image`, image_url: legacyUrl, alt: titleAlt }];
  }
  return [];
}

export function bannerHasVisual(banner: PaperbaseBanner): boolean {
  return resolveBannerSlides(banner).length > 0;
}
