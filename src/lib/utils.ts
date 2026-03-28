import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, decimals = 1): string {
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(decimals);
}

export function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60000) return `${Math.max(1, Math.round(diff / 1000))}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  const hours = diff / 3600000;
  if (hours < 48) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function minutesToHoursMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function secondsToHoursMinutes(seconds: number): string {
  return minutesToHoursMinutes(seconds / 60);
}
