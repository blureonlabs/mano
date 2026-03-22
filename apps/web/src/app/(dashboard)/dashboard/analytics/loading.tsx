export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div className="h-8 w-32 bg-cream-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-cream-200 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-80 bg-cream-200 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-72 bg-cream-200 rounded-2xl animate-pulse" />
        <div className="h-72 bg-cream-200 rounded-2xl animate-pulse" />
      </div>
    </div>
  );
}
