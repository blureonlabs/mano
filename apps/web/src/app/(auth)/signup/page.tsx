export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="bg-card p-8 rounded-card shadow-sm max-w-md w-full space-y-6">
        <h1 className="text-2xl font-heading font-bold text-center">
          Create your account
        </h1>
        <p className="text-ink-light text-center">
          Start managing your practice with Mano
        </p>
        {/* TODO: Supabase Auth form */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Full name"
            className="w-full px-4 py-3 rounded-small border border-cream-300 bg-white focus:outline-none focus:ring-2 focus:ring-sage"
          />
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
            Create Account
          </button>
        </div>
        <p className="text-sm text-ink-lighter text-center">
          Already have an account?{" "}
          <a href="/login" className="text-sage font-medium">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
