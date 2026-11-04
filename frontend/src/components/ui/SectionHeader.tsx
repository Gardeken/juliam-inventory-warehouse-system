import { ReactNode } from 'react';

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  action,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-dashed border-teal/35 pb-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-teal-dark bg-cream text-teal-dark shadow-card">
          {icon}
        </div>
        <div>
          <h2 className="text-base font-extrabold uppercase tracking-wider text-teal-dark sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs font-medium text-teal-dark/75">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
