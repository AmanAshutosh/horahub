import type { ReportTable, ReportTableRow } from '@/types/report';

const VARIANT_CLASS: Record<NonNullable<ReportTableRow['variant']>, string> = {
  positive: 'text-good',
  negative: 'text-danger',
  warning: 'text-warn',
  neutral: 'text-ink-muted',
};

interface Props {
  table: ReportTable;
  compact?: boolean;
}

export function DataTable({ table, compact }: Props) {
  const cell = compact ? 'px-2.5 py-1.5' : 'px-3 py-2';
  return (
    <div className="overflow-x-auto">
      {table.caption && (
        <p className="mb-1.5 text-[11.5px] text-ink-muted print:text-gray-500">{table.caption}</p>
      )}
      <table className="w-full border-collapse text-[13px] print:text-[11px]">
        <thead>
          <tr>
            {table.columns.map((col) => (
              <th
                key={col}
                className={`${cell} border-b border-line text-left text-[10.5px] font-semibold uppercase tracking-wide text-ink-muted print:border-gray-300 print:text-gray-500`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr
              key={ri}
              className={row.highlight ? 'bg-accent/10 print:bg-gray-100' : ri % 2 === 1 ? 'bg-panel-soft/40 print:bg-gray-50' : ''}
            >
              {row.cells.map((cell_val, ci) => (
                <td
                  key={ci}
                  className={`${cell} border-b border-line/50 print:border-gray-200 ${
                    row.variant ? VARIANT_CLASS[row.variant] : ''
                  } ${ci === 0 ? 'font-medium' : ''}`}
                >
                  {cell_val ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
