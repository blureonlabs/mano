"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PortalHeader from "@/components/portal/PortalHeader";
import PendingFormsBanner from "@/components/portal/PendingFormsBanner";
import UpcomingSessionsList from "@/components/portal/UpcomingSessionsList";
import PastSessionsList from "@/components/portal/PastSessionsList";

export default function PortalPage() {
  const [pastCursor, setPastCursor] = useState(0);
  const PAST_LIMIT = 20;

  const me = trpc.clientPortal.me.useQuery();
  const upcoming = trpc.clientPortal.upcomingSessions.useQuery();
  const pendingForms = trpc.clientPortal.pendingIntakeForms.useQuery();
  const past = trpc.clientPortal.pastSessions.useQuery({
    limit: PAST_LIMIT,
    offset: pastCursor,
  });

  // Derive client name
  const clientName =
    me.data?.clients?.[0]?.full_name ??
    me.data?.email?.split("@")[0] ??
    "there";

  if (me.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-cream-200 rounded-lg animate-pulse w-48" />
        <div className="h-24 bg-cream-200 rounded-2xl animate-pulse" />
        <div className="h-16 bg-cream-200 rounded-xl animate-pulse" />
        <div className="h-16 bg-cream-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PortalHeader name={clientName} email={me.data?.email} />

      <PendingFormsBanner forms={pendingForms.data ?? []} />

      <div className="space-y-3">
        <h2 className="text-lg font-heading font-semibold text-ink">
          Upcoming sessions
        </h2>
        <UpcomingSessionsList
          sessions={upcoming.data ?? []}
          loading={upcoming.isLoading}
        />
      </div>

      <PastSessionsList
        sessions={past.data?.sessions ?? []}
        hasMore={past.data?.hasMore ?? false}
        loading={past.isLoading}
        onLoadMore={() => setPastCursor((c) => c + PAST_LIMIT)}
      />

      {/* Booking links */}
      {me.data?.clients && me.data.clients.length > 0 && (
        <div className="bg-white rounded-xl border border-cream-300 p-6 text-center space-y-2">
          <p className="text-sm text-ink-lighter">
            Need to book another session?
          </p>
          <p className="text-xs text-ink-lighter">
            Use the booking link shared by your therapist.
          </p>
        </div>
      )}
    </div>
  );
}
