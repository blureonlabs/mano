"use client";

import { trpc } from "@/lib/trpc";
import ProfileForm from "@/components/settings/ProfileForm";
import SessionSettings from "@/components/settings/SessionSettings";
import AvailabilityEditor from "@/components/settings/AvailabilityEditor";
import IntegrationCards from "@/components/settings/IntegrationCards";
import BookingPageSection from "@/components/settings/BookingPageSection";

export default function SettingsPage() {
  const therapist = trpc.therapist.me.useQuery();
  const availability = trpc.therapist.getAvailability.useQuery();
  const integrations = trpc.integration.status.useQuery();

  if (therapist.isLoading || availability.isLoading || integrations.isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-2xl font-heading font-bold text-ink">Settings</h1>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-4"
          >
            <div className="h-5 w-32 bg-cream-200 rounded-lg animate-pulse" />
            <div className="h-3 w-64 bg-cream-200 rounded-lg animate-pulse" />
            <div className="space-y-3">
              <div className="h-10 bg-cream-200 rounded-xl animate-pulse" />
              <div className="h-10 bg-cream-200 rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (therapist.error || !therapist.data) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 text-sm">
            Failed to load settings. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  const t = therapist.data;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-heading font-bold text-ink">Settings</h1>

      <ProfileForm
        therapist={{
          full_name: t.full_name,
          display_name: t.display_name,
          slug: t.slug,
          bio: t.bio,
          qualifications: t.qualifications,
          phone: t.phone,
        }}
      />

      <SessionSettings
        therapist={{
          session_duration_mins: t.session_duration_mins,
          buffer_mins: t.buffer_mins,
          session_rate_inr: t.session_rate_inr,
        }}
      />

      <AvailabilityEditor availability={availability.data ?? []} />

      <BookingPageSection
        slug={t.slug}
        bookingPageActive={t.booking_page_active}
      />

      <IntegrationCards
        zoomConnected={integrations.data?.zoom ?? false}
        googleConnected={integrations.data?.google_calendar ?? false}
      />
    </div>
  );
}
