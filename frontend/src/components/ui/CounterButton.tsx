import { ButtonHTMLAttributes } from 'react';

interface CounterButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  direction: 'minus' | 'plus';
  label: string;
}

export function CounterButton({
  direction,
  label,
  className = '',
  ...props
}: CounterButtonProps) {
  const themeClasses =
    direction === 'minus'
      ? 'border-2 border-coral-dark bg-coral/15 text-coral-dark hover:bg-coral hover:text-white shadow-coral-glow/40'
      : 'border-2 border-teal-dark bg-teal-bg text-teal-dark hover:bg-teal hover:text-white shadow-teal-glow/40';

  return (
    <button
      type="button"
      className={`flex h-12 min-w-[52px] items-center justify-center rounded-2xl px-3 text-sm font-extrabold transition-all duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-40 ${themeClasses} ${className}`}
      {...props}
    >
      {label}
    </button>
  );
}
