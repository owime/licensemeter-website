"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/*
 * The marketing header logo normally links to "/". On the status subdomain
 * (status.licensemeter.com) that path is rewritten back to /status
 * (see next.config.js), so a plain "/" would just reload the status page.
 * Here we detect the status host on the client and point the logo at the
 * canonical home URL instead, while every other marketing route keeps the
 * relative "/" for fast client-side navigation. The initial render matches the
 * server output ("/"), so there is no hydration mismatch.
 */
export function BrandHomeLink({
  homeUrl,
  className,
  children,
}: {
  homeUrl: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [href, setHref] = useState("/");

  useEffect(() => {
    if (window.location.hostname.startsWith("status.")) {
      setHref(homeUrl);
    }
  }, [homeUrl]);

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
