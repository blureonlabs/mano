import Image from "next/image";
import BookingFlow from "@/components/booking/BookingFlow";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <header className="py-4 px-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Image
            src={LOGO_URL}
            alt="Mano"
            width={24}
            height={24}
            className="rounded-full"
          />
          <span className="text-sm font-heading font-semibold text-ink/60">
            mano
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">
          <BookingFlow slug={slug} />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-ink-lighter/60">
          Powered by{" "}
          <span className="font-heading font-semibold text-ink-lighter">
            Mano
          </span>
        </p>
      </footer>
    </main>
  );
}
