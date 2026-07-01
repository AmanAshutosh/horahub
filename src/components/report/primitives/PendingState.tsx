interface Props {
  /** What this section will show once analysis data is available. */
  willContain?: string[];
}

export function PendingState({ willContain }: Props) {
  return (
    <div className="rounded-xl2 border border-dashed border-line bg-bg/60 px-6 py-10 text-center print:border-gray-300 print:bg-gray-50">
      <svg
        className="mx-auto mb-3 h-8 w-8 text-ink-muted print:text-gray-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <p className="text-[13px] font-semibold text-ink-muted print:text-gray-600">
        Analysis not yet available
      </p>
      <p className="mx-auto mt-1.5 max-w-[360px] text-[12px] leading-relaxed text-ink-muted print:text-gray-500">
        This section will be filled with findings once the analysis data is ready.
        Nothing is shown here rather than showing you something invented.
      </p>
      {willContain && willContain.length > 0 && (
        <ul className="mx-auto mt-4 max-w-[320px] space-y-1 text-left">
          {willContain.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[12px] text-ink-muted print:text-gray-500">
              <span className="mt-[5px] h-px w-3 flex-none bg-line print:bg-gray-300" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
