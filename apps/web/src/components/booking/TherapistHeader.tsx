import Image from "next/image";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

interface TherapistHeaderProps {
  displayName: string;
  fullName: string;
  bio: string | null;
  qualifications: string | null;
  avatarUrl: string | null;
  durationMins: number;
  rateInr: number;
}

export default function TherapistHeader({
  displayName,
  fullName,
  bio,
  qualifications,
  avatarUrl,
  durationMins,
  rateInr,
}: TherapistHeaderProps) {
  return (
    <div className="bg-card border border-cream-300 rounded-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={56}
            height={56}
            className="rounded-full"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-sage-100 flex items-center justify-center">
            <Image src={LOGO_URL} alt="Mano" width={32} height={32} className="rounded-full" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-heading font-semibold text-ink">
            {fullName}
          </h2>
          {qualifications && (
            <p className="text-sm text-ink-lighter">{qualifications}</p>
          )}
        </div>
      </div>

      {bio && (
        <p className="text-sm text-ink-light leading-relaxed">{bio}</p>
      )}

      <div className="flex gap-4 text-sm">
        <div className="bg-sage-50 text-sage px-3 py-1.5 rounded-pill font-medium">
          {durationMins} min session
        </div>
        <div className="bg-amber-50 text-amber px-3 py-1.5 rounded-pill font-medium">
          {rateInr > 0 ? `₹${(rateInr / 100).toLocaleString("en-IN")}` : "Free"}
        </div>
      </div>
    </div>
  );
}
