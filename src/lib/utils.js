import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Standard utility to conditionally join classNames and merge Tailwind classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

