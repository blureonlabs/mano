"use client";

import { trpc } from "@/lib/trpc";
import {
  Activity,
  IndianRupee,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default function AnalyticsPage() {
  const overview = trpc.analytics.overview.useQuery();
  const revenueByMonth = trpc.analytics.revenueByMonth.useQuery();
  const sessionsByMonth = trpc.analytics.sessionsByMonth.useQuery();
  const clientGrowth = trpc.analytics.clientGrowth.useQuery();
  const topClients = trpc.analytics.topClients.useQuery({ limit: 5 });
  const categoryBreakdown = trpc.analytics.clientCategoryBreakdown.useQuery();

  const isLoading =
    overview.isLoading ||
    revenueByMonth.isLoading ||
    sessionsByMonth.isLoading ||
    clientGrowth.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <div className="h-8 w-32 bg-cream-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-white rounded-2xl border border-cream-300 animate-pulse"
            />
          ))}
        </div>
        <div className="h-80 bg-white rounded-2xl border border-cream-300 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-72 bg-white rounded-2xl border border-cream-300 animate-pulse" />
          <div className="h-72 bg-white rounded-2xl border border-cream-300 animate-pulse" />
        </div>
      </div>
    );
  }

  const stats = overview.data;
  const revenueData = revenueByMonth.data ?? [];
  const sessionData = sessionsByMonth.data ?? [];
  const growthData = clientGrowth.data ?? [];
  const topClientsData = topClients.data ?? [];
  const categories = categoryBreakdown.data ?? [];
  const totalCategoryCount = categories.reduce((sum, c) => sum + c.count, 0);

  const statCards = [
    {
      label: "Total Sessions",
      value: stats?.totalSessions ?? 0,
      subtitle: "completed",
      icon: Activity,
      iconBg: "bg-sage-50",
      iconColor: "text-sage",
    },
    {
      label: "Total Revenue",
      value: formatPaise(stats?.totalRevenue ?? 0),
      subtitle: "collected",
      icon: IndianRupee,
      iconBg: "bg-sage-50",
      iconColor: "text-sage",
    },
    {
      label: "Active Clients",
      value: stats?.activeClients ?? 0,
      subtitle: "clients",
      icon: Users,
      iconBg: "bg-sage-50",
      iconColor: "text-sage",
    },
    {
      label: "Completion Rate",
      value: `${stats?.completionRate ?? 0}%`,
      subtitle: "of sessions",
      icon: CheckCircle2,
      iconBg: "bg-sage-50",
      iconColor: "text-sage",
    },
    {
      label: "Pending Revenue",
      value: formatPaise(stats?.pendingRevenue ?? 0),
      subtitle: "unpaid",
      icon: Clock,
      iconBg: "bg-amber-50",
      iconColor: "text-amber",
    },
    {
      label: "No-Shows",
      value: stats?.noShows ?? 0,
      subtitle: "sessions",
      icon: XCircle,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
    },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 size={22} className="text-sage" />
          <h1 className="text-2xl font-heading font-bold text-ink">Analytics</h1>
        </div>
        <p className="text-sm text-ink-lighter mt-0.5">
          Practice performance overview
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl border border-cream-300 shadow-sm p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-8 h-8 rounded-lg ${card.iconBg} flex items-center justify-center`}
                >
                  <Icon size={16} className={card.iconColor} />
                </div>
                <span className="text-xs font-semibold text-ink-lighter uppercase tracking-wider">
                  {card.label}
                </span>
              </div>
              <div className="text-2xl font-heading font-bold text-ink">
                {card.value}
              </div>
              <div className="text-xs text-ink-lighter">{card.subtitle}</div>
            </div>
          );
        })}
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6">
        <h3 className="font-heading font-semibold text-ink mb-4">
          Revenue Trend
        </h3>
        {revenueData.length === 0 ? (
          <div className="h-72 flex items-center justify-center">
            <p className="text-sm text-ink-lighter">
              No revenue data yet. Revenue will appear here once sessions are
              invoiced.
            </p>
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient
                    id="revenueGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#4A7C6F"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="#4A7C6F"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D4" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: "#6B6560" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6B6560" }}
                  tickFormatter={(v) =>
                    `₹${(v / 100).toLocaleString("en-IN")}`
                  }
                />
                <Tooltip
                  formatter={(v) => [
                    `₹${(Number(v) / 100).toLocaleString("en-IN")}`,
                    "Revenue",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4A7C6F"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Sessions by Month + Client Growth — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sessions by Month */}
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6">
          <h3 className="font-heading font-semibold text-ink mb-4">
            Sessions by Month
          </h3>
          {sessionData.length === 0 ? (
            <div className="h-60 flex items-center justify-center">
              <p className="text-sm text-ink-lighter">No session data yet.</p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sessionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D4" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#6B6560" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#6B6560" }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill="#4A7C6F"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="cancelled"
                    name="Cancelled"
                    fill="#C8873A"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="noShow"
                    name="No-show"
                    fill="#DC2626"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Client Growth */}
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6">
          <h3 className="font-heading font-semibold text-ink mb-4">
            Client Growth
          </h3>
          {growthData.length === 0 ? (
            <div className="h-60 flex items-center justify-center">
              <p className="text-sm text-ink-lighter">
                No client data yet.
              </p>
            </div>
          ) : (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E0D4" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#6B6560" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#6B6560" }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="newClients"
                    name="New Clients"
                    fill="#C8873A"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalClients"
                    name="Total Clients"
                    stroke="#4A7C6F"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#4A7C6F" }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Client Category Breakdown + Top Clients — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Client Category Breakdown */}
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6">
          <h3 className="font-heading font-semibold text-ink mb-4">
            Client Categories
          </h3>
          {categories.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-ink-lighter">
                No client categories yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.label} className="flex items-center gap-3">
                  <span className="text-sm text-ink w-20 truncate">
                    {cat.label}
                  </span>
                  <div className="flex-1 h-6 bg-cream-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sage rounded-full transition-all"
                      style={{
                        width: `${
                          totalCategoryCount > 0
                            ? (cat.count / totalCategoryCount) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-ink w-8 text-right">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Clients */}
        <div className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6">
          <h3 className="font-heading font-semibold text-ink mb-4">
            Top Clients
          </h3>
          {topClientsData.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-ink-lighter">
                No client data yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-cream-300">
                    <th className="text-left py-2 pr-3 text-xs font-medium text-ink-lighter">
                      #
                    </th>
                    <th className="text-left py-2 pr-3 text-xs font-medium text-ink-lighter">
                      Client
                    </th>
                    <th className="text-right py-2 pr-3 text-xs font-medium text-ink-lighter">
                      Sessions
                    </th>
                    <th className="text-right py-2 text-xs font-medium text-ink-lighter">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topClientsData.map((client, idx) => (
                    <tr
                      key={client.name}
                      className="border-b border-cream-200 last:border-0"
                    >
                      <td className="py-2.5 pr-3 text-ink-lighter">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 pr-3 font-medium text-ink">
                        {client.name}
                      </td>
                      <td className="py-2.5 pr-3 text-right text-ink-lighter">
                        {client.sessions}
                      </td>
                      <td className="py-2.5 text-right font-medium text-ink">
                        {formatPaise(client.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
