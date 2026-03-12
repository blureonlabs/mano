export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-card p-8 rounded-card shadow-sm max-w-md w-full space-y-6">
        <h1 className="text-2xl font-heading font-bold text-center">
          Welcome back
        </h1>
        <p className="text-ink-light text-center">
          Sign in to your Mano dashboard
        </p>
        {/* TODO: Supabase Auth form */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            className="w-full px-4 py-3 rounded-small border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage"
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 rounded-small border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage"
          />
          <button className="w-full bg-sage text-white py-3 rounded-small font-medium hover:bg-sage-500 transition-colors">
            Sign In
          </button>
        </div>
        <p className="text-sm text-ink-lighter text-center">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-sage font-medium">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}
