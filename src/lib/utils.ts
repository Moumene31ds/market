import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | any): string {
  if (amount === undefined || amount === null) return '0.00 د.ج';
  const val = typeof amount === 'number' ? amount : Number(amount.toString());
  return `${isNaN(val) ? '0.00' : val.toFixed(2)} د.ج`;
}

export function formatDate(dateString: string | Date | undefined | null): string {
  if (!dateString) return '';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
