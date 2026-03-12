import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // Create Supabase client for auth session refresh
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as any)
          );
        },
      },
    }
  );

  // Refresh auth session (single call, reused for protected route check)
  const { data: { user } } = await supabase.auth.getUser();

  // --- Subdomain Routing ---
  // In production: vidhya.mano.app → booking page for "vidhya"
  // In dev: Use ?slug=vidhya query param or localhost subdomains
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000";
  const isSubdomain =
    hostname !== appDomain &&
    hostname !== `www.${appDomain}` &&
    !hostname.startsWith("localhost");

  if (isSubdomain) {
    const slug = hostname.split(".")[0];
    if (slug && pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/booking/${slug}`;
      return NextResponse.rewrite(url, { headers: response.headers });
    }
  }

  // --- Protected Routes ---
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/settings")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
