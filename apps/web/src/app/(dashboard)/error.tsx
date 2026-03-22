"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-ink mb-2 font-heading">Something went wrong</h2>
      <p className="text-ink-light mb-6 text-center max-w-md">
        We encountered an unexpected error. Please try again or contact support if the issue persists.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2.5 bg-sage text-white rounded-lg font-medium hover:bg-sage-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
