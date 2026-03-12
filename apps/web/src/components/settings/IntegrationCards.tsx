import { trpc } from "@/lib/trpc";

interface IntegrationCardsProps {
  zoomConnected: boolean;
  googleConnected: boolean;
}

export default function IntegrationCards({
  zoomConnected,
  googleConnected,
}: IntegrationCardsProps) {
  const utils = trpc.useUtils();

  const disconnectZoom = trpc.integration.disconnectZoom.useMutation({
    onSuccess: () => utils.integration.status.invalidate(),
  });
  const disconnectGoogle = trpc.integration.disconnectGoogle.useMutation({
    onSuccess: () => utils.integration.status.invalidate(),
  });

  return (
    <section className="bg-white rounded-2xl border border-cream-300 shadow-sm p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sage">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <h2 className="text-lg font-heading font-semibold text-ink">Integrations</h2>
        </div>
        <p className="text-sm text-ink-lighter">
          Connect your tools for automatic meeting links and calendar sync.
        </p>
      </div>

      <div className="space-y-3">
        {/* Zoom */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-cream-300 bg-cream-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Zoom</p>
              <p className="text-xs text-ink-lighter">
                Auto-create meeting links for sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {zoomConnected ? (
              <>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-sage-50 text-sage text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                  Connected
                </span>
                <button
                  onClick={() => disconnectZoom.mutate()}
                  disabled={disconnectZoom.isPending}
                  className="text-xs text-ink-lighter hover:text-red-600 transition-colors font-medium"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-cream-200 text-ink-lighter text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-lighter" />
                Not connected
              </span>
            )}
          </div>
        </div>

        {/* Google Calendar */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-cream-300 bg-cream-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Google Calendar</p>
              <p className="text-xs text-ink-lighter">
                Sync sessions to your calendar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {googleConnected ? (
              <>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-sage-50 text-sage text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                  Connected
                </span>
                <button
                  onClick={() => disconnectGoogle.mutate()}
                  disabled={disconnectGoogle.isPending}
                  className="text-xs text-ink-lighter hover:text-red-600 transition-colors font-medium"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-pill bg-cream-200 text-ink-lighter text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-ink-lighter" />
                Not connected
              </span>
            )}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-ink-lighter">
        Integration setup coming soon. Connected status is displayed for reference.
      </p>
    </section>
  );
}
