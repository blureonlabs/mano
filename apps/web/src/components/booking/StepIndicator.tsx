type Step = "type" | "select" | "form" | "confirmed";

const STEPS: { key: Step; label: string }[] = [
  { key: "type", label: "Session" },
  { key: "select", label: "Date & Time" },
  { key: "form", label: "Details" },
  { key: "confirmed", label: "Done" },
];

const ORDER: Record<Step, number> = { type: 0, select: 1, form: 2, confirmed: 3 };

export default function StepIndicator({ currentStep }: { currentStep: Step }) {
  const current = ORDER[currentStep];

  return (
    <div className="flex items-center justify-between px-2">
      {STEPS.map((step, i) => {
        const idx = ORDER[step.key];
        const isCompleted = idx < current;
        const isActive = idx === current;
        const isLast = i === STEPS.length - 1;

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                  isCompleted
                    ? "bg-sage text-white"
                    : isActive
                    ? "bg-sage text-white ring-4 ring-sage/20"
                    : "bg-cream-200 text-ink-lighter"
                }`}
              >
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${
                isActive ? "text-sage" : isCompleted ? "text-ink-light" : "text-ink-lighter"
              }`}>
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 mx-2 mb-5">
                <div className={`h-0.5 rounded-full transition-colors ${
                  isCompleted ? "bg-sage" : "bg-cream-200"
                }`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
