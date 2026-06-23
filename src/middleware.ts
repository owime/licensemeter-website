import {
  NextResponse,
  type NextFetchEvent,
  type NextRequest,
} from "next/server";
import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

// WorkOS AuthKit is the default sign-in, so its middleware runs on every
// matched request. The one exception is the entra opt-out (AUTH_PROVIDER=entra),
// where AuthKit isn't configured and its middleware would throw per-request
// (it requires WORKOS_COOKIE_PASSWORD >=32 chars + a redirect URI); there it is
// a pass-through. Gated on the same flag the auth layer uses.
const workosMiddleware = authkitMiddleware();

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  // The status subdomain (status.licensemeter.com) is a single-purpose entry
  // point: "/" serves the status page (rewritten in next.config.js). Any other
  // path is a marketing route that belongs on the canonical site, so bounce the
  // visitor there instead of serving it under the status host. This keeps every
  // shared header/footer link correct without making each one host-aware.
  const host = request.headers.get("host");
  const { pathname, search } = request.nextUrl;
  if (
    host?.startsWith("status.") &&
    pathname !== "/" &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_vercel")
  ) {
    const apex = process.env.APP_BASE_URL ?? "https://licensemeter.com";
    return NextResponse.redirect(new URL(pathname + search, apex), 308);
  }

  if (process.env.AUTH_PROVIDER === "entra") return NextResponse.next();
  return workosMiddleware(request, event);
}

// Match against pages that require auth, excluding static assets
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|opengraph-image).*)"],
};
