import { BrandHomeLink } from "~/components/BrandHomeLink";
import { BrandMark } from "~/components/BrandMark";
import { HeaderAuthCta } from "~/components/HeaderAuthCta";
import { MarketingFooter } from "~/components/MarketingFooter";
import { MarketingLanguageSync } from "~/components/MarketingLanguageSync";
import { MarketingNav } from "~/components/MarketingNav";
import { siteUrl } from "~/env";

/*
 * No request-time reads here (cookies, headers): session and route-locale
 * behavior is resolved client-side so marketing pages remain statically
 * rendered and CDN-cacheable.
 */
export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="bg-canvas min-h-screen">
      <MarketingLanguageSync />
      <a
        href="#content"
        className="focus:border-ink focus:bg-canvas focus:text-ink sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:border focus:px-4 focus:py-2 focus:text-sm focus:font-medium"
      >
        Skip to content
      </a>
      <header className="relative mx-auto flex max-w-6xl flex-nowrap items-center justify-between gap-x-3 px-4 py-5 min-[360px]:px-6 min-[360px]:py-6 sm:gap-x-6">
        <BrandHomeLink
          homeUrl={siteUrl()}
          className="font-display flex shrink-0 items-center gap-2.5 text-lg tracking-tight sm:text-xl"
        >
          <BrandMark size={22} />
          <span>
            License<span className="text-brand-text">Meter</span>
          </span>
        </BrandHomeLink>
        <div className="flex shrink-0 items-center gap-2 sm:gap-5">
          <MarketingNav />
          <HeaderAuthCta />
        </div>
      </header>

      <div id="content">{children}</div>
      <MarketingFooter />
    </div>
  );
}
