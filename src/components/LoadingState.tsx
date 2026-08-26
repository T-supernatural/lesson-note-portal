const LoadingState = ({
  label = "Loading...",
  className = "",
}: {
  label?: string;
  className?: string;
}) => (
  <div
    className={`flex min-h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-soft ${className}`}
    role="status"
    aria-live="polite"
  >
    <div className="flex items-center gap-3 text-sm text-slate-500">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--color-accent)]"
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  </div>
);

export default LoadingState;
