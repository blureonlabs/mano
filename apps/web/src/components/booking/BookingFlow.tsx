"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import TherapistHeader from "./TherapistHeader";
import DatePicker from "./DatePicker";
import SlotGrid from "./SlotGrid";
import BookingForm from "./BookingForm";
import BookingConfirmation from "./BookingConfirmation";

interface TimeSlot {
  start: string;
  end: string;
}

type Step = "select" | "form" | "confirmed";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0] as string;
}

export default function BookingFlow({ slug }: { slug: string }) {
  const today = toDateStr(new Date());

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [zoomJoinUrl, setZoomJoinUrl] = useState<string | null>(null);

  // Fetch therapist profile
  const therapist = trpc.therapist.getBySlug.useQuery(
    { slug },
    { retry: false }
  );

  // Fetch slots for the selected date
  const slots = trpc.booking.getSlots.useQuery(
    {
      therapist_slug: slug,
      from_date: selectedDate,
      to_date: selectedDate,
    },
    { enabled: !!therapist.data }
  );

  // Book mutation
  const book = trpc.booking.book.useMutation({
    onSuccess: (result) => {
      setZoomJoinUrl(result.zoom_join_url);
      setStep("confirmed");
    },
  });

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (step === "form") setStep("select");
  }

  function handleSlotSelect(slot: TimeSlot) {
    setSelectedSlot(slot);
    setStep("form");
  }

  function handleBook(data: { name: string; email: string; phone: string }) {
    if (!selectedSlot) return;
    book.mutate({
      therapist_slug: slug,
      client_name: data.name,
      client_email: data.email,
      client_phone: data.phone || undefined,
      slot_start: selectedSlot.start,
      slot_end: selectedSlot.end,
    });
  }

  // Loading state
  if (therapist.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-cream-200 rounded-card animate-pulse" />
        <div className="h-24 bg-cream-200 rounded-card animate-pulse" />
        <div className="h-32 bg-cream-200 rounded-card animate-pulse" />
      </div>
    );
  }

  // Therapist not found
  if (therapist.error || !therapist.data) {
    return (
      <div className="bg-card border border-cream-300 rounded-card p-8 text-center space-y-3">
        <div className="text-4xl">🔍</div>
        <h2 className="text-xl font-heading font-semibold text-ink">
          Page Not Found
        </h2>
        <p className="text-sm text-ink-lighter">
          This booking page doesn&apos;t exist or is not currently active.
        </p>
      </div>
    );
  }

  const t = therapist.data;

  return (
    <div className="space-y-6">
      <TherapistHeader
        displayName={t.display_name}
        fullName={t.full_name}
        bio={t.bio}
        qualifications={t.qualifications}
        avatarUrl={t.avatar_url}
        durationMins={t.session_duration_mins}
        rateInr={t.session_rate_inr}
      />

      {step === "confirmed" ? (
        <BookingConfirmation
          therapistName={t.display_name}
          slotStart={selectedSlot!.start}
          slotEnd={selectedSlot!.end}
          durationMins={t.session_duration_mins}
          zoomJoinUrl={zoomJoinUrl}
        />
      ) : (
        <>
          <DatePicker
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
          />

          {step === "select" && (
            <SlotGrid
              slots={slots.data ?? []}
              selectedSlot={selectedSlot}
              onSelect={handleSlotSelect}
              loading={slots.isLoading}
            />
          )}

          {step === "form" && selectedSlot && (
            <BookingForm
              slotStart={selectedSlot.start}
              slotEnd={selectedSlot.end}
              durationMins={t.session_duration_mins}
              rateInr={t.session_rate_inr}
              loading={book.isPending}
              onSubmit={handleBook}
              onBack={() => setStep("select")}
            />
          )}

          {book.error && (
            <div className="bg-red-50 border border-red-200 rounded-small p-4 text-sm text-red-700">
              {book.error.message}
            </div>
          )}
        </>
      )}
    </div>
  );
}
