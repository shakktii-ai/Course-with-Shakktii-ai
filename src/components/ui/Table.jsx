import React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className={cn('w-full text-left text-sm text-slate-600', className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead className={cn('bg-slate-50/80 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider', className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn('divide-y divide-slate-100', className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, hoverable = true, ...props }) {
  return (
    <tr
      className={cn(
        'transition-colors',
        hoverable && 'hover:bg-slate-50/70',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }) {
  return (
    <th className={cn('px-6 py-3.5', className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td className={cn('px-6 py-4 whitespace-nowrap', className)} {...props}>
      {children}
    </td>
  );
}

export function TableEmpty({ colSpan = 5, message = 'No records found' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-12 text-slate-400 text-sm">
        {message}
      </td>
    </tr>
  );
}

export default Table;

