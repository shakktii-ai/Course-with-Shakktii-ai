'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus-visible:ring-emerald-500',
  secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 focus-visible:ring-slate-400',
  outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm focus-visible:ring-emerald-500',
  ghost: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 focus-visible:ring-slate-400',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus-visible:ring-rose-500',
};

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-10 px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'h-12 px-6 text-base rounded-lg gap-2.5',
};

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  type = 'button',
  ...props
}) {
  const isSpinning = Boolean(isLoading || loading);

  return (
    <button
      type={type}
      disabled={disabled || isSpinning}
      className={cn(
        'inline-flex flex-row flex-nowrap items-center justify-center font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {isSpinning ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon && <span className="inline-flex items-center justify-center shrink-0">{leftIcon}</span>
      )}
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{children}</span>
      {!isSpinning && rightIcon && (
        <span className="inline-flex items-center justify-center shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}

export default Button;

