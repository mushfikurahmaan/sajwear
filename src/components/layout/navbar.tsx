import { getTranslations } from "next-intl/server";

import { AccountNavLink } from "@/components/common/account-nav-link";
import { CartPanelHost, CartTrigger, MobileFloatingCartButton, MobileScrollToTopButton } from "@/components/common/cart-drawer-trigger";
import { Link } from "@/i18n/routing";
import { DesktopCategoryMegaNav } from "@/components/layout/desktop-category-mega-nav";
import { HeaderSearch } from "@/components/layout/header-search";
import { MobileSearchOverlay } from "@/components/layout/mobile-search-overlay";
import { MobileNavDrawer } from "@/components/layout/mobile-nav-drawer";
import { PageContainer } from "@/components/layout/page-container";
import { getStorefrontHeaderCategories, getStorefrontNotifications, getStorefrontStorePublic } from "@/lib/storefront";

/** Stacked wordmark: first word on top, remainder below (e.g. "Acme Co" → Acme / Co). */
function splitBrandName(name: string): { top: string; bottom: string } {
  const trimmed = name.trim();
  const m = trimmed.match(/^(\S+)\s+(.+)$/);
  if (!m) {
    return { top: trimmed, bottom: "" };
  }
  return { top: m[1], bottom: m[2].trim() };
}

export async function Navbar() {
  const [common, nav, search, product, store, categories, notifications] = await Promise.all([
    getTranslations("common"),
    getTranslations("nav"),
    getTranslations("search"),
    getTranslations("product"),
    getStorefrontStorePublic(),
    getStorefrontHeaderCategories(),
    getStorefrontNotifications(),
  ]);
  const topNotice = notifications[0]?.cta_text ?? common("brand");
  const { top: brandTop, bottom: brandBottom } = splitBrandName(store.store_name);

  return (
    <header className="sticky top-0 z-40 w-full min-w-0 overflow-x-clip bg-header text-white pt-[env(safe-area-inset-top,0px)] ps-[env(safe-area-inset-left,0px)] pe-[env(safe-area-inset-right,0px)]">
      <div className="bg-header/95">
        <PageContainer>
          <p className="py-1.5 text-center text-[11px] tracking-wide text-white/90">
            {topNotice}
          </p>
        </PageContainer>
      </div>

      <PageContainer>
        <div className="flex min-h-20 items-center gap-3 py-3 md:gap-4">
          <div className="grid w-full min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 md:hidden">
            <MobileNavDrawer
              menuTitle={nav("products")}
              backHomeLabel="Back to home"
              categories={categories}
            />
            <div className="min-w-0">
              <MobileSearchOverlay
                placeholder={search("placeholder")}
                openSearchAriaLabel={nav("openSearch")}
                submitAriaLabel={nav("openSearch")}
                closeLabel={common("close")}
              />
            </div>
            <AccountNavLink variant="mobile" />
          </div>

          <Link
            href="/"
            className="hidden shrink-0 items-center leading-tight md:inline-flex"
            aria-label={store.store_name}
          >
            <span className="flex flex-col justify-center gap-0.5">
              <span className="text-sm font-extrabold uppercase tracking-wide leading-tight text-white">{brandTop}</span>
              {brandBottom ? (
                <span className="text-sm font-extrabold uppercase tracking-wide leading-tight text-white">{brandBottom}</span>
              ) : null}
            </span>
          </Link>

          <div className="hidden min-w-0 flex-1 md:block">
            <HeaderSearch
              placeholder={search("placeholder")}
              submitAriaLabel={nav("openSearch")}
            />
          </div>

          <div className="hidden shrink-0 items-center gap-2 md:flex md:gap-3">
            <div className="hidden lg:block">
              <p className="text-[11px] uppercase tracking-wide text-white/75">{common("callUsNow")}</p>
              <p className="text-sm font-semibold">{store.phone}</p>
            </div>
            <AccountNavLink variant="desktop" />
            <CartTrigger variant="desktop" />
          </div>
        </div>
      </PageContainer>

      <CartPanelHost />
      <MobileScrollToTopButton />
      <MobileFloatingCartButton />

      <div className="hidden border-t border-white/15 bg-header md:block">
        <DesktopCategoryMegaNav
          ariaLabel={nav("products")}
          browseEyebrow={nav("products")}
          newBadgeLabel={product("newBadge")}
          categories={categories}
        />
      </div>
    </header>
  );
}
