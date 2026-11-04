import { ButtonHTMLAttributes, ReactNode } from 'react';

export type PillButtonVariant = 'gold' | 'teal' | 'coral' | 'sky' | 'cream';

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const VARIANT_CLASSES: Record<PillButtonVariant, string> = {
  gold: 'bg-gradient-to-b from-gold-light via-gold to-gold-dark text-teal-dark border-2 border-teal-dark/80 shadow-accent-glow hover:brightness-105',
  teal: 'bg-gradient-to-b from-teal-light to-teal-dark text-white border-2 border-teal-dark shadow-teal-glow hover:brightness-105',
  coral:
    'bg-gradient-to-b from-coral-light to-coral-dark text-white border-2 border-coral-dark shadow-coral-glow hover:brightness-105',
  sky: 'bg-sky text-white border-2 border-teal-dark/40 shadow-sky-glow hover:brightness-105',
  cream:
    'bg-cream text-teal-dark border-2 border-teal/40 shadow-card hover:bg-cream-dark/60',
};

const SIZE_CLASSES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'min-h-[38px] px-4 py-1.5 text-xs',
  md: 'min-h-[44px] px-5 py-2.5 text-xs sm:text-sm',
  lg: 'min-h-[52px] px-6 py-3 text-sm sm:text-base',
};

export function PillButton({
  variant = 'gold',
  size = 'md',
  className = '',
  children,
  ...props
}: PillButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full font-extrabold tracking-wide transition-all duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-45 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
