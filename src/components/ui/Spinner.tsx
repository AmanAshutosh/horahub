export function Spinner({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'md'
    ? 'h-5 w-5 border-2'
    : 'h-3.5 w-3.5 border-2';
  return (
    <span
      className={`${cls} inline-block animate-spin rounded-full border-ink-subtle border-t-gold align-[-2px]`}
    />
  );
}
