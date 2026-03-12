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
    <div className="text-center space-y-5 pb-2">
      {/* Avatar */}
      <div className="flex justify-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={80}
            height={80}
            className="rounded-full ring-4 ring-white shadow-md"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-sage-50 ring-4 ring-white shadow-md flex items-center justify-center">
            <Image
              src={LOGO_URL}
              alt="Mano"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
        )}
      </div>

      {/* Name & credentials */}
      <div className="space-y-1">
        <h1 className="text-2xl font-heading font-semibold text-ink">
          {fullName}
        </h1>
        {qualifications && (
          <p className="text-sm text-ink-lighter">{qualifications}</p>
        )}
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-sm text-ink-light leading-relaxed max-w-sm mx-auto">
          {bio}
        </p>
      )}

      {/* Session info pills */}
      <div className="flex items-center justify-center gap-2">
        <div className="inline-flex items-center gap-1.5 bg-sage-50 text-sage-600 px-3 py-1.5 rounded-pill text-xs font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          {durationMins} min
        </div>
        <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-pill text-xs font-medium">
          {rateInr > 0 ? `₹${(rateInr / 100).toLocaleString("en-IN")}` : "Free"}
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-cream-300" />
    </div>
  );
}
