interface Props {
  willContain?: string[];
}

export function PendingState({ willContain }: Props) {
  return (
    <div className="pending-state">
      <svg
        className="pending-state-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <p className="pending-state-title">Analysis not yet available</p>
      <p className="pending-state-desc">
        This section will be populated once the inference engine has processed your chart.
        Nothing is shown rather than showing you something invented.
      </p>
      {willContain && willContain.length > 0 && (
        <ul className="pending-state-list">
          {willContain.map((item) => (
            <li key={item} className="pending-state-item">
              <span className="pending-state-item-dash">—</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
