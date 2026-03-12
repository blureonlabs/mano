export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Clients</h1>
        <button className="bg-sage text-white px-4 py-2 rounded-small font-medium hover:bg-sage-500 transition-colors">
          Add Client
        </button>
      </div>
      {/* TODO: client.list tRPC query + client table/cards */}
      <div className="bg-card p-6 rounded-card shadow-sm text-ink-lighter">
        Client list will appear here
      </div>
    </div>
  );
}
