import IntakeFormView from "@/components/intake/IntakeFormView";
import Image from "next/image";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

export default async function IntakeFormPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Image src={LOGO_URL} alt="Mano" width={24} height={24} className="rounded-full" />
          <span className="text-lg font-heading font-bold text-sage">Mano</span>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-xl bg-card rounded-2xl shadow-sm border border-cream-300 p-6 sm:p-8">
          <IntakeFormView token={token} />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <p className="text-xs text-ink-lighter/50">
          Powered by{" "}
          <span className="font-semibold text-sage/50">Mano</span>
        </p>
      </footer>
    </div>
  );
}
