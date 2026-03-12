"use client";

import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { QueryClient } from "@tanstack/react-query";
import superjson from "superjson";
import type { AppRouter } from "@mano/api";

export const trpc = createTRPCReact<AppRouter>();

export function makeTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        transformer: superjson,
      }),
    ],
  });
}

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes — don't refetch if data is fresh
        gcTime: 10 * 60 * 1000, // 10 minutes — keep unused cache longer
        refetchOnWindowFocus: false, // don't refetch when switching tabs
        refetchOnReconnect: false, // don't refetch on network reconnect
        retry: 1, // only retry once on failure
      },
    },
  });
}
