import {
  format,
  isAfter,
  isBefore,
  differenceInDays,
  addDays,
  formatISO,
  parseISO,
} from 'date-fns';

export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd HH:mm:ss'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
}

export function isOverdue(dueDate: string): boolean {
  const now = new Date();
  const due = parseISO(dueDate);
  return isAfter(now, due);
}

export function isNearDue(dueDate: string, days: number = 2): boolean {
  const now = new Date();
  const due = parseISO(dueDate);
  const nearDate = addDays(now, days);
  return !isOverdue(dueDate) && isBefore(due, nearDate);
}

export function daysRemaining(dueDate: string): number {
  const now = new Date();
  const due = parseISO(dueDate);
  return differenceInDays(due, now);
}

export function getCurrentTime(): string {
  return formatISO(new Date());
}
