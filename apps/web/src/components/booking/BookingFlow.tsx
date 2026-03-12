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
      <div className="bg-white rounded-2xl shadow-sm border border-cream-300 p-8 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-cream-200 animate-pulse" />
          <div className="space-y-2 w-full max-w-[200px]">
            <div className="h-5 bg-cream-200 rounded-lg animate-pulse" />
            <div className="h-3 bg-cream-200 rounded-lg animate-pulse w-3/4 mx-auto" />
          </div>
        </div>
        <div className="h-px bg-cream-300" />
        <div className="h-20 bg-cream-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 bg-cream-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Therapist not found
  if (therapist.error || !therapist.data) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-cream-300 p-10 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-cream-200 mx-auto flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-lighter">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-heading font-semibold text-ink">
            Page not found
          </h2>
          <p className="text-sm text-ink-lighter mt-1">
            This booking page doesn&apos;t exist or isn&apos;t currently active.
          </p>
        </div>
      </div>
    );
  }

  const t = therapist.data;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-cream-300 overflow-hidden">
      <div className="p-6 sm:p-8 space-y-6">
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
          <div className="space-y-6">
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {book.error.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
