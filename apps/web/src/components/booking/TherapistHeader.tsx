import Image from "next/image";

const LOGO_URL =
  "https://bjodimpnpwuuoogwufso.supabase.co/storage/v1/object/public/assets/logo.webp?v=2";

interface TherapistHeaderProps {
  displayName: string;
  fullName: string;
  bio: string | null;
  qualifications: string | null;
  avatarUrl: string | null;
}

export default function TherapistHeader({
  displayName,
  fullName,
  bio,
  qualifications,
  avatarUrl,
}: TherapistHeaderProps) {
  return (
    <div className="text-center space-y-4 pb-2">
      {/* Avatar */}
      <div className="flex justify-center">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={96}
            height={96}
            className="rounded-full ring-4 ring-white shadow-md"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-sage-50 ring-4 ring-white shadow-md flex items-center justify-center">
            <Image
              src={LOGO_URL}
              alt="Mano"
              width={48}
              height={48}
              className="rounded-full"
            />
          </div>
        )}
      </div>

      {/* Name & credentials */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-heading font-semibold text-ink">
          {fullName}
        </h1>
        {qualifications && (
          <div className="flex flex-wrap justify-center gap-1">
            {qualifications.split(",").map((q) => (
              <span
                key={q.trim()}
                className="inline-flex items-center px-2 py-0.5 rounded-pill bg-cream-100 text-[11px] font-medium text-ink-lighter"
              >
                {q.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bio */}
      {bio && (
        <p className="text-sm text-ink-light leading-relaxed max-w-sm mx-auto">
          {bio}
        </p>
      )}

      {/* Divider */}
      <div className="border-b border-cream-300" />
    </div>
  );
}
