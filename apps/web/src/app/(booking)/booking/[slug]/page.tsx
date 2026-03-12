interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto p-8 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-heading font-bold text-ink">
            Book a Session
          </h1>
          <p className="text-ink-light">
            Booking page for <span className="font-medium">{slug}</span>
          </p>
        </div>

        {/* TODO: Fetch therapist profile via tRPC booking.getSlots */}
        {/* TODO: Calendar slot picker component */}
        {/* TODO: Client details form */}
        {/* TODO: Razorpay payment button */}

        <div className="bg-card p-6 rounded-card shadow-sm text-center text-ink-lighter">
          Booking interface coming soon
        </div>
      </div>
    </main>
  );
}
