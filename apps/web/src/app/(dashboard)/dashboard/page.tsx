export default function TodayPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold">Today</h1>
      {/* TODO: session.today tRPC query */}
      <div className="bg-card p-6 rounded-card shadow-sm text-ink-lighter">
        Today&apos;s sessions will appear here
      </div>
    </div>
  );
}
