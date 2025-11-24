/**
 * Utility function for merging Tailwind classes
 * Handles conditional classes and deduplication
 */
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
