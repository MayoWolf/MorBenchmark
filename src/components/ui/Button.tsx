import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'border-blue-500 bg-blue-500 text-white hover:bg-blue-400',
  secondary: 'border-white/10 bg-white/[0.04] text-slate-100 hover:border-blue-300/50 hover:bg-blue-400/10',
  ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-white/[0.04] hover:text-white',
  danger: 'border-red-400/40 bg-red-400/10 text-red-100 hover:bg-red-400/20',
};

export function Button({
  children,
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
}) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
