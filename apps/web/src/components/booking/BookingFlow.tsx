"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import TherapistHeader from "./TherapistHeader";
import SessionTypePicker from "./SessionTypePicker";
import DatePicker from "./DatePicker";
import SlotGrid from "./SlotGrid";
import BookingForm from "./BookingForm";
import BookingConfirmation from "./BookingConfirmation";
import PolicyNotice from "./PolicyNotice";
import StepIndicator from "./StepIndicator";

interface TimeSlot {
  start: string;
  end: string;
}

interface SessionTypeRate {
  client_category: string;
  rate_inr: number;
}

interface SelectedType {
  id: string;
  name: string;
  duration_mins: number;
  rate_inr: number;
  description: string | null;
  session_type_rates?: SessionTypeRate[];
}

type Step = "type" | "select" | "form" | "confirmed";

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0] as string;
}

export default function BookingFlow({ slug }: { slug: string }) {
  const today = toDateStr(new Date());

  const [selectedType, setSelectedType] = useState<SelectedType | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [step, setStep] = useState<Step>("type");
  const [zoomJoinUrl, setZoomJoinUrl] = useState<string | null>(null);
  const [intakeAccessToken, setIntakeAccessToken] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Check if user is logged in (client auth)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setAuthEmail(data.user?.email ?? null);
      setIsAuthChecked(true);
    });
  }, []);

  // Auto-fill from client portal if logged in
  const clientData = trpc.clientPortal.getForTherapist.useQuery(
    { therapist_slug: slug },
    { enabled: !!authEmail, retry: false }
  );

  // Fetch therapist profile
  const therapist = trpc.therapist.getBySlug.useQuery(
    { slug },
    { retry: false }
  );

  // Fetch session types from the normalized table
  const sessionTypesQuery = trpc.sessionType.listByTherapist.useQuery(
    { therapistId: therapist.data?.id ?? "" },
    { enabled: !!therapist.data?.id }
  );

  // Fetch slots for the selected date
  const slots = trpc.booking.getSlots.useQuery(
    {
      therapist_slug: slug,
      session_type_id: selectedType?.id ?? "",
      from_date: selectedDate,
      to_date: selectedDate,
    },
    { enabled: !!therapist.data && !!selectedType }
  );

  // Book single session
  const book = trpc.booking.book.useMutation({
    onSuccess: (result) => {
      setZoomJoinUrl(result.zoom_join_url);
      setIntakeAccessToken(result.intake_access_token);
      setStep("confirmed");
    },
  });

  // Book multiple sessions
  const bookMultiple = trpc.booking.bookMultiple.useMutation({
    onSuccess: () => {
      setStep("confirmed");
    },
  });

  const isBooking = book.isPending || bookMultiple.isPending;
  const bookError = book.error || bookMultiple.error;

  function handleTypeSelect(type: SelectedType) {
    setSelectedType(type);
    setSelectedSlot(null);
    setSelectedSlots([]);
    setMultiSelectMode(false);
    setStep("select");
  }

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (step === "form") setStep("select");
  }

  function handleSlotSelect(slot: TimeSlot) {
    if (multiSelectMode) {
      setSelectedSlots((prev) => {
        const exists = prev.some((s) => s.start === slot.start && s.end === slot.end);
        if (exists) return prev.filter((s) => !(s.start === slot.start && s.end === slot.end));
        return [...prev, slot];
      });
    } else {
      setSelectedSlot(slot);
      setStep("form");
    }
  }

  function handleContinueMulti() {
    if (selectedSlots.length > 0) {
      setStep("form");
    }
  }

  function handleBook(data: { name: string; email: string; phone: string }) {
    if (!selectedType) return;

    if (multiSelectMode && selectedSlots.length > 1) {
      bookMultiple.mutate({
        therapist_slug: slug,
        session_type_id: selectedType.id,
        client_name: data.name,
        client_email: data.email,
        client_phone: data.phone || undefined,
        slots: selectedSlots.map((s) => ({ start: s.start, end: s.end })),
      });
    } else {
      const slot = multiSelectMode ? selectedSlots[0]! : selectedSlot!;
      book.mutate({
        therapist_slug: slug,
        session_type_id: selectedType.id,
        client_name: data.name,
        client_email: data.email,
        client_phone: data.phone || undefined,
        slot_start: slot.start,
        slot_end: slot.end,
      });
    }
  }

  // Loading state
  if (therapist.isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-cream-300 p-8 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-cream-200 animate-pulse" />
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

  // Use normalized session_types table if available, fall back to JSONB on therapists
  const activeTypes: SelectedType[] = (() => {
    const tableTypes = sessionTypesQuery.data;
    if (tableTypes && tableTypes.length > 0) {
      return tableTypes.map((st) => ({
        id: st.id,
        name: st.name,
        duration_mins: st.duration_mins,
        rate_inr: st.rate_inr,
        description: st.description ?? null,
        session_type_rates: st.session_type_rates ?? [],
      }));
    }
    // Fallback to JSONB
    return ((t.session_types ?? []) as (SelectedType & { is_active: boolean })[])
      .filter((st) => st.is_active);
  })();

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-cream-300 overflow-hidden">
      <div className="p-6 sm:p-8 space-y-6">
        {/* Mobile-only header (hidden on desktop with sidebar) */}
        <div className="sm:hidden">
          <TherapistHeader
            displayName={t.display_name}
            fullName={t.full_name}
            bio={t.bio}
            qualifications={t.qualifications}
            avatarUrl={t.avatar_url}
          />
        </div>

        {/* Desktop compact header */}
        <div className="hidden sm:block">
          <TherapistHeader
            displayName={t.display_name}
            fullName={t.full_name}
            bio={t.bio}
            qualifications={t.qualifications}
            avatarUrl={t.avatar_url}
          />
        </div>

        <PolicyNotice
          cancellationPolicy={t.cancellation_policy}
          latePolicy={t.late_policy}
          reschedulingPolicy={t.rescheduling_policy}
        />

        {/* Auth badge */}
        {isAuthChecked && (
          <div className="text-center">
            {authEmail ? (
              <span className="inline-flex items-center gap-1.5 text-xs bg-sage-50 text-sage font-medium px-3 py-1.5 rounded-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Logged in as {authEmail}
              </span>
            ) : (
              <p className="text-xs text-ink-lighter">
                Have an account?{" "}
                <Link
                  href={`/client/login?redirect=${encodeURIComponent(`/booking/${slug}`)}`}
                  className="text-sage font-medium hover:underline"
                >
                  Log in
                </Link>
                {" "}to auto-fill your details.
              </p>
            )}
          </div>
        )}

        {/* Step indicator */}
        <StepIndicator currentStep={step} />

        {step === "confirmed" ? (
          <BookingConfirmation
            therapistName={t.display_name}
            slotStart={multiSelectMode && selectedSlots.length > 0 ? selectedSlots[0]!.start : selectedSlot!.start}
            slotEnd={multiSelectMode && selectedSlots.length > 0 ? selectedSlots[0]!.end : selectedSlot!.end}
            durationMins={selectedType!.duration_mins}
            zoomJoinUrl={zoomJoinUrl}
            intakeAccessToken={intakeAccessToken}
          />
        ) : (
          <div className="space-y-6">
            {/* Step 1: Session type picker */}
            {step === "type" && (
              <SessionTypePicker
                sessionTypes={activeTypes}
                onSelect={handleTypeSelect}
              />
            )}

            {/* Selected type summary (shown after picking) */}
            {selectedType && step !== "type" && (
              <div className="flex items-center justify-between bg-sage-50/60 border border-sage-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-sage">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {selectedType.duration_mins} min
                  </div>
                  <span className="text-sm font-medium text-ink">{selectedType.name}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-pill ${
                    selectedType.rate_inr === 0
                      ? "bg-sage-50 text-sage"
                      : "bg-amber-50 text-amber-600"
                  }`}>
                    {selectedType.rate_inr === 0 ? "Free" : `₹${(selectedType.rate_inr / 100).toLocaleString("en-IN")}`}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("type");
                    setSelectedSlot(null);
                    setSelectedSlots([]);
                    setMultiSelectMode(false);
                  }}
                  className="text-xs text-sage font-medium hover:text-sage-600 transition-colors"
                >
                  Change
                </button>
              </div>
            )}

            {/* Step 2: Date & slot picker */}
            {(step === "select" || step === "form") && (
              <DatePicker
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
              />
            )}

            {step === "select" && (
              <>
                {/* Multi-session toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={multiSelectMode}
                      onChange={(e) => {
                        setMultiSelectMode(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedSlots([]);
                        }
                      }}
                      className="rounded border-cream-300 text-sage focus:ring-sage/30"
                    />
                    <span className="text-xs text-ink-lighter font-medium">
                      Book multiple slots
                    </span>
                  </label>
                </div>

                <SlotGrid
                  slots={slots.data ?? []}
                  selectedSlot={selectedSlot}
                  selectedSlots={selectedSlots}
                  onSelect={handleSlotSelect}
                  multiSelect={multiSelectMode}
                  onContinueMulti={handleContinueMulti}
                  loading={slots.isLoading}
                />
              </>
            )}

            {/* Step 3: Booking form */}
            {step === "form" && selectedType && (
              <BookingForm
                slotStart={multiSelectMode && selectedSlots.length > 0 ? selectedSlots[0]!.start : selectedSlot!.start}
                slotEnd={multiSelectMode && selectedSlots.length > 0 ? selectedSlots[0]!.end : selectedSlot!.end}
                slots={multiSelectMode ? selectedSlots : undefined}
                durationMins={selectedType.duration_mins}
                rateInr={selectedType.rate_inr}
                loading={isBooking}
                defaultName={clientData.data?.full_name ?? ""}
                defaultEmail={clientData.data?.email ?? authEmail ?? ""}
                defaultPhone={clientData.data?.phone ?? ""}
                onSubmit={handleBook}
                onBack={() => setStep("select")}
              />
            )}

            {bookError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {bookError.message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
