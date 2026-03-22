"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/client/login");
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white border-b border-cream-300">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src={LOGO_URL}
              alt="Mano"
              width={28}
              height={28}
              className="rounded-full"
            />
            <span className="text-lg font-heading font-bold text-sage">
              Mano
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-ink-lighter hover:text-ink transition-colors font-medium"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
