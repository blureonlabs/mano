"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { getMonday, startOfDayIST, endOfDayIST, endOfWeekIST } from "@/lib/date-utils";
import ScheduleHeader from "@/components/schedule/ScheduleHeader";
import WeekView from "@/components/schedule/WeekView";
import DayView from "@/components/schedule/DayView";
import ListView from "@/components/schedule/ListView";
import SessionDetailPopover from "@/components/schedule/SessionDetailPopover";
import AddBreakModal from "@/components/schedule/AddBreakModal";
import CreateSessionModal from "@/components/schedule/CreateSessionModal";

type ViewMode = "calendar" | "list";
type CalendarView = "week" | "day";

export default function SchedulePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [calendarView, setCalendarView] = useState<CalendarView>("week");
  const [weekStart, setWeekStart] = useState<Date>(() => getMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Modal states
  const [addBreakSlot, setAddBreakSlot] = useState<{ start: string; end: string } | null>(null);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // Compute date range based on current view
  const { from, to } = useMemo(() => {
    if (calendarView === "day" && selectedDay) {
      return { from: startOfDayIST(selectedDay), to: endOfDayIST(selectedDay) };
    }
    return { from: startOfDayIST(weekStart), to: endOfWeekIST(weekStart) };
  }, [calendarView, weekStart, selectedDay]);

  // Data queries
  const sessions = trpc.session.listByDateRange.useQuery({ from, to });
  const blockedSlots = trpc.blockedSlot.list.useQuery({ from, to });
  const pending = trpc.session.pending.useQuery();

  const utils = trpc.useUtils();

  function invalidateAll() {
    utils.session.listByDateRange.invalidate();
    utils.session.pending.invalidate();
    utils.session.today.invalidate();
    utils.session.upcoming.invalidate();
    utils.blockedSlot.list.invalidate();
  }

  // Session mutations
  const approve = trpc.session.approve.useMutation({ onSuccess: invalidateAll });
  const reject = trpc.session.reject.useMutation({ onSuccess: invalidateAll });
  const complete = trpc.session.complete.useMutation({ onSuccess: invalidateAll });
  const cancel = trpc.session.cancel.useMutation({ onSuccess: invalidateAll });
  const markNoShow = trpc.session.markNoShow.useMutation({ onSuccess: invalidateAll });

  // Blocked slot mutations
  const createBlock = trpc.blockedSlot.create.useMutation({
    onSuccess: () => {
      utils.blockedSlot.list.invalidate();
      setAddBreakSlot(null);
    },
  });
  const deleteBlock = trpc.blockedSlot.delete.useMutation({
    onSuccess: () => utils.blockedSlot.list.invalidate(),
  });

  const isActing =
    approve.isPending || reject.isPending || complete.isPending ||
    cancel.isPending || markNoShow.isPending;

  // Navigation
  function goToPrevWeek() {
    const prev = new Date(weekStart);
    prev.setDate(prev.getDate() - 7);
    setWeekStart(prev);
  }

  function goToNextWeek() {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + 7);
    setWeekStart(next);
  }

  function goToToday() {
    setWeekStart(getMonday(new Date()));
    setCalendarView("week");
    setSelectedDay(null);
  }

  function onDayClick(day: Date) {
    setSelectedDay(day);
    setCalendarView("day");
  }

  function backToWeek() {
    setCalendarView("week");
    setSelectedDay(null);
  }

  // Find the selected session for the popover
  const selectedSession = useMemo(() => {
    if (!selectedSessionId || !sessions.data) return null;
    return sessions.data.find((s) => s.id === selectedSessionId) ?? null;
  }, [selectedSessionId, sessions.data]);

  const pendingCount = pending.data?.length ?? 0;
  const allSessions = sessions.data ?? [];

  return (
    <div className="space-y-4">
      <ScheduleHeader
        viewMode={viewMode}
        calendarView={calendarView}
        weekStart={weekStart}
        selectedDay={selectedDay}
        onViewModeChange={setViewMode}
        onPrevWeek={goToPrevWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
        onBackToWeek={backToWeek}
        onAddSession={() => setCreateSessionOpen(true)}
        pendingCount={pendingCount}
      />

      {/* Pending banner */}
      {pendingCount > 0 && viewMode === "calendar" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber animate-pulse flex-shrink-0" />
          <span className="text-sm text-amber-700 font-medium">
            {pendingCount} booking request{pendingCount !== 1 ? "s" : ""} awaiting approval
          </span>
        </div>
      )}

      {/* Views */}
      {viewMode === "list" ? (
        <ListView
          sessions={allSessions as any}
          isLoading={sessions.isLoading}
          onApprove={(id) => approve.mutate({ session_id: id })}
          onReject={(id) => {
            if (confirm("Decline this booking request?")) {
              reject.mutate({ session_id: id });
            }
          }}
          onComplete={(id) => complete.mutate({ session_id: id })}
          onCancel={(id) => {
            if (confirm("Cancel this session?")) {
              cancel.mutate({ session_id: id });
            }
          }}
          onMarkNoShow={(id) => {
            if (confirm("Mark this session as no-show?")) {
              markNoShow.mutate({ session_id: id });
            }
          }}
          isActing={isActing}
        />
      ) : calendarView === "week" ? (
        <WeekView
          weekStart={weekStart}
          sessions={allSessions as any}
          blockedSlots={(blockedSlots.data ?? []) as any}
          isLoading={sessions.isLoading}
          onSessionClick={(id) => setSelectedSessionId(id)}
          onEmptySlotClick={(start, end) => setAddBreakSlot({ start, end })}
          onDayClick={onDayClick}
        />
      ) : (
        <DayView
          day={selectedDay!}
          sessions={allSessions as any}
          blockedSlots={(blockedSlots.data ?? []) as any}
          isLoading={sessions.isLoading}
          onSessionClick={(id) => setSelectedSessionId(id)}
          onEmptySlotClick={(start, end) => setAddBreakSlot({ start, end })}
        />
      )}

      {/* Session detail popover */}
      {selectedSession && (
        <SessionDetailPopover
          session={selectedSession as any}
          onClose={() => setSelectedSessionId(null)}
          onApprove={() => {
            approve.mutate({ session_id: selectedSession.id });
            setSelectedSessionId(null);
          }}
          onReject={() => {
            reject.mutate({ session_id: selectedSession.id });
            setSelectedSessionId(null);
          }}
          onComplete={() => {
            complete.mutate({ session_id: selectedSession.id });
            setSelectedSessionId(null);
          }}
          onCancel={() => {
            cancel.mutate({ session_id: selectedSession.id });
            setSelectedSessionId(null);
          }}
          onMarkNoShow={() => {
            markNoShow.mutate({ session_id: selectedSession.id });
            setSelectedSessionId(null);
          }}
          isLoading={isActing}
        />
      )}

      {/* Add break modal */}
      {addBreakSlot && (
        <AddBreakModal
          defaultStart={addBreakSlot.start}
          defaultEnd={addBreakSlot.end}
          onClose={() => setAddBreakSlot(null)}
          onSave={(data) => createBlock.mutate(data)}
          isSaving={createBlock.isPending}
        />
      )}

      {/* Create session modal */}
      {createSessionOpen && (
        <CreateSessionModal
          onClose={() => setCreateSessionOpen(false)}
          onCreated={() => {
            setCreateSessionOpen(false);
            invalidateAll();
          }}
        />
      )}
    </div>
  );
}
