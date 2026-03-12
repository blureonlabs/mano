import type { SupabaseClient } from "@supabase/supabase-js";
import { computeAvailableSlots } from "./slot-calculator";
import type { TimeSlot } from "@mano/shared";

export class SessionService {
  constructor(private supabase: SupabaseClient) {}

  async getAvailableSlots(therapistId: string, fromDate: string, toDate: string): Promise<TimeSlot[]> {
    const [therapistRes, availRes, bookedRes, blockedRes] = await Promise.all([
      this.supabase.from("therapists").select("session_duration_mins, buffer_mins").eq("id", therapistId).single(),
      this.supabase.from("availability").select("*").eq("therapist_id", therapistId).eq("is_active", true),
      this.supabase.from("sessions").select("starts_at, ends_at").eq("therapist_id", therapistId).neq("status", "cancelled").gte("starts_at", `${fromDate}T00:00:00+05:30`).lte("starts_at", `${toDate}T23:59:59+05:30`),
      this.supabase.from("blocked_slots").select("start_at, end_at").eq("therapist_id", therapistId).gte("start_at", `${fromDate}T00:00:00+05:30`).lte("start_at", `${toDate}T23:59:59+05:30`),
    ]);

    if (!therapistRes.data) return [];

    return computeAvailableSlots({
      availability: availRes.data ?? [],
      booked: bookedRes.data ?? [],
      blocked: blockedRes.data ?? [],
      sessionDurationMins: therapistRes.data.session_duration_mins,
      bufferMins: therapistRes.data.buffer_mins,
      fromDate,
      toDate,
    });
  }

  async checkConflict(therapistId: string, slotStart: string, slotEnd: string): Promise<boolean> {
    const { data } = await this.supabase
      .from("sessions")
      .select("id")
      .eq("therapist_id", therapistId)
      .neq("status", "cancelled")
      .lt("starts_at", slotEnd)
      .gt("ends_at", slotStart);
    return (data?.length ?? 0) > 0;
  }
}
