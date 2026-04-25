import { type ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

const variants = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50',
  danger: 'bg-rose-500 text-white hover:bg-rose-600',
  outline: 'bg-transparent text-slate-900 border border-slate-300 hover:bg-slate-100',
};

const Button = ({
  className,
  variant = 'primary',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
