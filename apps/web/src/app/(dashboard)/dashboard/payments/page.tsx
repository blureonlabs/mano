export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Payments</h1>
        <button className="bg-sage text-white px-4 py-2 rounded-small font-medium hover:bg-sage-500 transition-colors">
          Create Invoice
        </button>
      </div>
      {/* TODO: payment.list tRPC query + invoice table */}
      <div className="bg-card p-6 rounded-card shadow-sm text-ink-lighter">
        Invoices and payment history will appear here
      </div>
    </div>
  );
}
