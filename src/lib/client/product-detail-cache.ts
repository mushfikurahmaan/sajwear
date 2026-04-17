import { apiFetchJson } from "@/lib/client/api";
import type { ProductDetail } from "@/types/product";

const cache = new Map<string, ProductDetail>();
const inflight = new Map<string, Promise<ProductDetail>>();

/** Synchronous read for initial state (avoids loading flash when data is already cached). */
export function peekProductDetailCache(slug: string): ProductDetail | null {
  return cache.get(slug) ?? null;
}

/**
 * Fetches product detail once per slug per session, dedupes concurrent calls,
 * and reuses cached JSON for checkout / variant pickers.
 */
export async function getProductDetailCached(slug: string): Promise<ProductDetail> {
  const hit = cache.get(slug);
  if (hit) return hit;

  const pending = inflight.get(slug);
  if (pending) return pending;

  const promise = apiFetchJson<ProductDetail>(`/products/${slug}`)
    .then((data) => {
      cache.set(slug, data);
      inflight.delete(slug);
      return data;
    })
    .catch((err) => {
      inflight.delete(slug);
      throw err;
    });

  inflight.set(slug, promise);
  return promise;
}
