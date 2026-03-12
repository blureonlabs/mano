export default function ScheduleLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 w-40 bg-cream-200 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-cream-200 rounded-xl" />
          <div className="h-9 w-32 bg-cream-200 rounded-xl" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-cream-300 h-[600px]" />
    </div>
  );
}
