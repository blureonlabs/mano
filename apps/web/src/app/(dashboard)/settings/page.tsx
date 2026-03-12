export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-heading font-bold">Settings</h1>

      {/* Profile */}
      <section className="bg-card p-6 rounded-card shadow-sm space-y-4">
        <h2 className="text-lg font-heading font-semibold">Profile</h2>
        <p className="text-ink-lighter">
          Update your display name, bio, qualifications, and booking page slug.
        </p>
        {/* TODO: therapist.me query + update form */}
      </section>

      {/* Availability */}
      <section className="bg-card p-6 rounded-card shadow-sm space-y-4">
        <h2 className="text-lg font-heading font-semibold">Availability</h2>
        <p className="text-ink-lighter">
          Set your weekly schedule for each day.
        </p>
        {/* TODO: therapist.getAvailability + day-by-day editor */}
      </section>

      {/* Integrations */}
      <section className="bg-card p-6 rounded-card shadow-sm space-y-4">
        <h2 className="text-lg font-heading font-semibold">Integrations</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 border border-cream-300 rounded-small">
            <div>
              <p className="font-medium">Zoom</p>
              <p className="text-sm text-ink-lighter">
                Auto-create meeting links for sessions
              </p>
            </div>
            {/* TODO: integration.status query + connect/disconnect buttons */}
            <button className="bg-sage text-white px-4 py-2 rounded-small text-sm">
              Connect
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border border-cream-300 rounded-small">
            <div>
              <p className="font-medium">Google Calendar</p>
              <p className="text-sm text-ink-lighter">
                Sync sessions to your calendar
              </p>
            </div>
            <button className="bg-sage text-white px-4 py-2 rounded-small text-sm">
              Connect
            </button>
          </div>
        </div>
      </section>

      {/* Booking Page */}
      <section className="bg-card p-6 rounded-card shadow-sm space-y-4">
        <h2 className="text-lg font-heading font-semibold">Booking Page</h2>
        <p className="text-ink-lighter">
          Your public booking link will be{" "}
          <code className="text-sage font-mono text-sm">
            yourname.mano.app
          </code>
        </p>
        {/* TODO: Toggle booking page active/inactive */}
      </section>
    </div>
  );
}
