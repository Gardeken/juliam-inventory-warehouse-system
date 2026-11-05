import { ReactNode } from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  indicator?: 'default' | 'danger' | 'warning' | 'primary';
  icon?: ReactNode;
  hint?: string;
  onClick?: () => void;
}

export function MetricCard({
  label,
  value,
  subValue,
  indicator = 'default',
  icon,
  hint,
  onClick,
}: MetricCardProps) {
  const borderHighlight =
    indicator === 'danger'
      ? 'border-status-danger/40 hover:border-status-danger bg-red-50/20'
      : indicator === 'warning'
        ? 'border-status-warning/40 hover:border-status-warning bg-amber-50/20'
        : indicator === 'primary'
          ? 'border-primary/40 hover:border-primary bg-orange-50/20'
          : 'border-outline hover:border-outline-strong bg-surface-elevated';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`rounded-lg border p-5 shadow-subtle transition-all duration-150 ${borderHighlight} ${
        onClick ? 'cursor-pointer hover:shadow-raised' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-muted">
          {label}
        </span>
        {icon && <div className="text-on-surface-muted/70">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-on-surface">
          {value}
        </span>
        {subValue && (
          <span className="text-xs font-medium text-on-surface-muted">
            {subValue}
          </span>
        )}
      </div>

      {hint && (
        <p className="mt-2 text-xs text-on-surface-muted leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}

