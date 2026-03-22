import { router, practiceProcedure } from "../trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getAccessibleTherapistIds } from "../utils/practice-scope";

export const analyticsRouter = router({
  /**
   * Overview stats: total sessions, revenue, clients, completion rate
   */
  overview: practiceProcedure.query(async ({ ctx }) => {
    const therapistIds = await getAccessibleTherapistIds(ctx.supabase, ctx.user.id, ctx.practice);

    // Run all queries in parallel
    const [sessionsRes, revenueRes, pendingRes, clientsRes, noShowRes, cancelledRes] = await Promise.all([
      // Total completed sessions
      ctx.supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .in("therapist_id", therapistIds)
        .eq("status", "completed")
        .is("deleted_at", null),
      // Total paid revenue
      ctx.supabase
        .from("invoices")
        .select("total_inr")
        .in("therapist_id", therapistIds)
        .eq("status", "paid"),
      // Pending revenue
      ctx.supabase
        .from("invoices")
        .select("total_inr")
        .in("therapist_id", therapistIds)
        .eq("status", "unpaid"),
      // Active clients count
      ctx.supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .in("therapist_id", therapistIds)
        .eq("is_active", true)
        .is("deleted_at", null),
      // No-show count
      ctx.supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .in("therapist_id", therapistIds)
        .eq("status", "no_show")
        .is("deleted_at", null),
      // Cancelled count
      ctx.supabase
        .from("sessions")
        .select("*", { count: "exact", head: true })
        .in("therapist_id", therapistIds)
        .eq("status", "cancelled")
        .is("deleted_at", null),
    ]);

    const totalRevenue = (revenueRes.data ?? []).reduce((sum, inv) => sum + (inv.total_inr ?? 0), 0);
    const pendingRevenue = (pendingRes.data ?? []).reduce((sum, inv) => sum + (inv.total_inr ?? 0), 0);
    const completedCount = sessionsRes.count ?? 0;
    const noShowCount = noShowRes.count ?? 0;
    const cancelledCount = cancelledRes.count ?? 0;
    const totalSessionsAttempted = completedCount + noShowCount + cancelledCount;
    const completionRate = totalSessionsAttempted > 0
      ? Math.round((completedCount / totalSessionsAttempted) * 100)
      : 100;

    return {
      totalSessions: completedCount,
      totalRevenue,
      pendingRevenue,
      activeClients: clientsRes.count ?? 0,
      noShows: noShowCount,
      cancellations: cancelledCount,
      completionRate,
    };
  }),

  /**
   * Revenue by month (last 12 months)
   */
  revenueByMonth: practiceProcedure.query(async ({ ctx }) => {
    const therapistIds = await getAccessibleTherapistIds(ctx.supabase, ctx.user.id, ctx.practice);

    // Get paid invoices from last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const { data: invoices, error } = await ctx.supabase
      .from("invoices")
      .select("total_inr, paid_at")
      .in("therapist_id", therapistIds)
      .eq("status", "paid")
      .gte("paid_at", twelveMonthsAgo.toISOString())
      .order("paid_at", { ascending: true });

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch revenue data" });

    // Group by month
    const monthlyRevenue: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyRevenue[key] = 0;
    }

    for (const inv of invoices ?? []) {
      if (!inv.paid_at) continue;
      const d = new Date(inv.paid_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyRevenue) {
        monthlyRevenue[key] += inv.total_inr ?? 0;
      }
    }

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      label: new Date(month + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      revenue,
    }));
  }),

  /**
   * Sessions by month (last 12 months) — completed, cancelled, no_show
   */
  sessionsByMonth: practiceProcedure.query(async ({ ctx }) => {
    const therapistIds = await getAccessibleTherapistIds(ctx.supabase, ctx.user.id, ctx.practice);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const { data: sessions, error } = await ctx.supabase
      .from("sessions")
      .select("starts_at, status")
      .in("therapist_id", therapistIds)
      .in("status", ["completed", "cancelled", "no_show"])
      .gte("starts_at", twelveMonthsAgo.toISOString())
      .is("deleted_at", null)
      .order("starts_at", { ascending: true });

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch session data" });

    // Initialize months
    const monthlyData: Record<string, { completed: number; cancelled: number; noShow: number }> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyData[key] = { completed: 0, cancelled: 0, noShow: 0 };
    }

    for (const s of sessions ?? []) {
      const d = new Date(s.starts_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!(key in monthlyData)) continue;
      if (s.status === "completed") monthlyData[key]!.completed++;
      else if (s.status === "cancelled") monthlyData[key]!.cancelled++;
      else if (s.status === "no_show") monthlyData[key]!.noShow++;
    }

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      label: new Date(month + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      ...data,
    }));
  }),

  /**
   * Client growth — new clients per month (last 12 months)
   */
  clientGrowth: practiceProcedure.query(async ({ ctx }) => {
    const therapistIds = await getAccessibleTherapistIds(ctx.supabase, ctx.user.id, ctx.practice);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const { data: clients, error } = await ctx.supabase
      .from("clients")
      .select("created_at")
      .in("therapist_id", therapistIds)
      .gte("created_at", twelveMonthsAgo.toISOString())
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch client data" });

    // Initialize + group
    const monthlyClients: Record<string, number> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyClients[key] = 0;
    }

    for (const c of clients ?? []) {
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyClients) monthlyClients[key]!++;
    }

    // Calculate cumulative total
    let cumulative = 0;
    return Object.entries(monthlyClients).map(([month, newClients]) => {
      cumulative += newClients;
      return {
        month,
        label: new Date(month + "-01").toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
        newClients,
        totalClients: cumulative,
      };
    });
  }),

  /**
   * Top clients by session count & revenue
   */
  topClients: practiceProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
    .query(async ({ ctx, input }) => {
      const therapistIds = await getAccessibleTherapistIds(ctx.supabase, ctx.user.id, ctx.practice);

      // Get all completed sessions with client info
      const { data: sessions, error } = await ctx.supabase
        .from("sessions")
        .select("client_id, amount_inr, clients(full_name)")
        .in("therapist_id", therapistIds)
        .eq("status", "completed")
        .is("deleted_at", null);

      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch client data" });

      // Aggregate by client
      const clientMap: Record<string, { name: string; sessions: number; revenue: number }> = {};
      for (const s of sessions ?? []) {
        const clientName = (s as any).clients?.full_name ?? "Unknown";
        if (!clientMap[s.client_id]) {
          clientMap[s.client_id] = { name: clientName, sessions: 0, revenue: 0 };
        }
        clientMap[s.client_id]!.sessions++;
        clientMap[s.client_id]!.revenue += s.amount_inr ?? 0;
      }

      // Sort by session count and take top N
      return Object.entries(clientMap)
        .map(([id, data]) => ({ clientId: id, ...data }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, input.limit);
    }),

  /**
   * Client category breakdown (indian, nri, couple, other)
   */
  clientCategoryBreakdown: practiceProcedure.query(async ({ ctx }) => {
    const therapistIds = await getAccessibleTherapistIds(ctx.supabase, ctx.user.id, ctx.practice);

    const { data: clients, error } = await ctx.supabase
      .from("clients")
      .select("category")
      .in("therapist_id", therapistIds)
      .eq("is_active", true)
      .is("deleted_at", null);

    if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch clients" });

    const counts: Record<string, number> = { indian: 0, nri: 0, couple: 0, other: 0 };
    for (const c of clients ?? []) {
      const cat = c.category ?? "other";
      counts[cat] = (counts[cat] ?? 0) + 1;
    }

    return Object.entries(counts).map(([category, count]) => ({
      category,
      label: category.charAt(0).toUpperCase() + category.slice(1),
      count,
    }));
  }),
});
