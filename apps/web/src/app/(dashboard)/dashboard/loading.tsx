export default function DashboardLoading() {
  return (
    <div className="max-w-3xl space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-cream-200 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-cream-300" />
        ))}
      </div>
      <div className="h-64 bg-white rounded-2xl border border-cream-300" />
    </div>
  );
}
