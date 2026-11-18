import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred while processing your request.',
  code = null,
  onRetry = null,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-200 bg-rose-50/40',
        className
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-rose-900">{title}</h4>
      <p className="text-sm text-rose-700/80 max-w-md mt-1 mb-4 leading-relaxed">
        {description}
      </p>
      {code && (
        <span className="font-mono text-xs px-2.5 py-1 rounded bg-rose-100/80 text-rose-800 mb-4">
          Error Code: {code}
        </span>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RotateCcw className="w-4 h-4" />}
          className="border-rose-300 text-rose-800 hover:bg-rose-100"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;

