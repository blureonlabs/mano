import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, createContext } from "@mano/api";
import { createClient } from "@/lib/supabase/server";
import { rateLimiters, checkRateLimit } from "@/lib/rate-limit";

function getClientIP(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

const handler = async (req: Request) => {
  // Rate limiting
  const ip = getClientIP(req);
  const url = new URL(req.url);
  const path = url.pathname.split("/trpc/")[1] ?? "";

  const isPublicEndpoint =
    path.startsWith("booking.") || path.startsWith("onboarding.");
  const limiter = isPublicEndpoint ? rateLimiters.booking : rateLimiters.api;

  const { success, limit, remaining, reset } = await checkRateLimit(limiter, ip);
  if (!success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
        "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext({ supabase, user }),
  });
};

export { handler as GET, handler as POST };
