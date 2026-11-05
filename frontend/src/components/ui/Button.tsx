import { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost-shell' | 'subtle';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const VARIANT_MAP: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-strong active:bg-primary-focus shadow-subtle border border-transparent',
  secondary:
    'bg-surface-elevated text-on-surface border border-outline hover:border-outline-strong hover:bg-surface active:bg-surface-soft shadow-subtle',
  danger:
    'bg-status-danger text-white hover:opacity-90 active:opacity-100 shadow-subtle border border-transparent',
  'ghost-shell':
    'bg-white/10 text-white/90 hover:bg-white/20 active:bg-white/25 border border-white/15',
  subtle:
    'bg-surface text-on-surface-muted hover:text-on-surface hover:bg-surface-soft border border-transparent',
};

const SIZE_MAP: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs font-semibold rounded-sm gap-1.5',
  md: 'h-10 px-4 text-sm font-semibold rounded-sm gap-2',
  lg: 'h-11 px-5 text-sm font-bold rounded-md gap-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center transition-all duration-150 select-none disabled:pointer-events-none disabled:opacity-40 ${VARIANT_MAP[variant]} ${SIZE_MAP[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

