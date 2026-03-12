export default function ResourcesLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-cream-200 rounded-lg" />
        <div className="h-9 w-28 bg-cream-200 rounded-xl" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-20 bg-cream-200 rounded-pill" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-white rounded-2xl border border-cream-300" />
        ))}
      </div>
    </div>
  );
}
