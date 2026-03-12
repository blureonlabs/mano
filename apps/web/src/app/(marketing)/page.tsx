export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-heading font-bold text-sage">Mano</h1>
        <p className="text-xl text-ink-light max-w-md">
          Privacy-first practice management for independent therapists in India.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/signup"
            className="bg-sage text-white px-6 py-3 rounded-pill font-medium hover:bg-sage-500 transition-colors"
          >
            Get Started Free
          </a>
          <a
            href="/login"
            className="border border-sage text-sage px-6 py-3 rounded-pill font-medium hover:bg-sage-50 transition-colors"
          >
            Log In
          </a>
        </div>
      </div>
    </main>
  );
}
