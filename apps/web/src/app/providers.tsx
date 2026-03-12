"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { trpc, makeTRPCClient, makeQueryClient } from "@/lib/trpc";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => makeQueryClient());
  const [trpcClient] = useState(() => makeTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: "'DM Sans', sans-serif",
            },
          }}
        />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
