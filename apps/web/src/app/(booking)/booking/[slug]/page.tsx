import BookingFlow from "@/components/booking/BookingFlow";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto px-4 py-8">
        <BookingFlow slug={slug} />
      </div>
    </main>
  );
}
