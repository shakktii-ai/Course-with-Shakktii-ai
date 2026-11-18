'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export function Label({ className, children, required = false, htmlFor, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('block text-sm font-medium text-slate-700 mb-1.5', className)}
      {...props}
    >
      {children}
      {required && <span className="text-rose-500 ml-1">*</span>}
    </label>
  );
}

export function Input({
  className,
  type = 'text',
  error = null,
  disabled = false,
  ...props
}) {
  return (
    <input
      type={type}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors',
        'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
        error
          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
          : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200',
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  rows = 4,
  error = null,
  disabled = false,
  ...props
}) {
  return (
    <textarea
      rows={rows}
      disabled={disabled}
      className={cn(
        'flex w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors',
        'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-1',
        'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400',
        error
          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
          : 'border-slate-300 focus:border-emerald-500 focus:ring-emerald-200',
        className
      )}
      {...props}
    />
  );
}

export function FormHelperText({ className, error = false, children }) {
  if (!children) return null;
  return (
    <p
      className={cn(
        'text-xs mt-1.5',
        error ? 'text-rose-600 font-medium' : 'text-slate-500',
        className
      )}
    >
      {children}
    </p>
  );
}

export default Input;

