import React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function Badge({
  className,
  variant = 'emerald',
  children,
  dot = false,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        badgeVariants[variant] || badgeVariants.emerald,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'emerald' && 'bg-emerald-500',
            variant === 'slate' && 'bg-slate-500',
            variant === 'amber' && 'bg-amber-500',
            variant === 'rose' && 'bg-rose-500',
            variant === 'sky' && 'bg-sky-500',
            variant === 'purple' && 'bg-purple-500'
          )}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;

