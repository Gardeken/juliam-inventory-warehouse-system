import { ReactNode } from 'react';

export type AccentTone = 'teal' | 'gold' | 'coral' | 'sky';

interface AccentCardProps {
  tone?: AccentTone;
  pulse?: boolean;
  onClick?: () => void;
  className?: string;
  children: ReactNode;
}

const TONE_CLASSES: Record<AccentTone, string> = {
  teal: 'border-l-teal-light bg-surface-card shadow-card',
  gold: 'border-l-gold bg-gradient-to-r from-cream via-surface-card to-surface-card shadow-accent-glow',
  coral:
    'border-l-coral bg-gradient-to-r from-coral-light/15 via-surface-card to-surface-card shadow-coral-glow',
  sky: 'border-l-sky bg-surface-card shadow-sky-glow',
};

export function AccentCard({
  tone = 'teal',
  pulse = false,
  onClick,
  className = '',
  children,
}: AccentCardProps) {
  const interactiveClasses = onClick
    ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99]'
    : '';
  const pulseClass = pulse ? 'animate-boom-pulse' : '';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick ? (e) => e.key === 'Enter' && onClick() : undefined
      }
      className={`rounded-3xl border border-teal/15 border-l-[6px] p-5 ${TONE_CLASSES[tone]} ${interactiveClasses} ${pulseClass} ${className}`}
    >
      {children}
    </div>
  );
}
