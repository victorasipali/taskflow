import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

import { colors } from '@/theme';
import type { TaskPriority, TaskStatus, TemperatureUnit } from '@/types';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const PRIORITY_COLORS: Record<TaskPriority, { fg: string; bg: string }> = {
  low: { fg: colors.success, bg: colors.successSoft },
  medium: { fg: colors.warning, bg: colors.warningSoft },
  high: { fg: colors.danger, bg: colors.dangerSoft },
};

export function formatDueDate(iso: string | null): string {
  if (!iso) return 'No due date';
  const date = new Date(iso);
  if (isToday(date)) return `Today, ${format(date, 'h:mm a')}`;
  if (isTomorrow(date)) return `Tomorrow, ${format(date, 'h:mm a')}`;
  return format(date, 'EEE d MMM, h:mm a');
}

export function isOverdue(iso: string | null, status: TaskStatus): boolean {
  return iso !== null && status !== 'done' && isPast(new Date(iso));
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function formatDayName(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return isToday(date) ? 'Today' : format(date, 'EEE d');
}

export function formatTemperature(celsius: number, unit: TemperatureUnit): string {
  const value = unit === 'fahrenheit' ? (celsius * 9) / 5 + 32 : celsius;
  return `${Math.round(value)}°${unit === 'fahrenheit' ? 'F' : 'C'}`;
}

/** WMO weather interpretation codes used by Open-Meteo → label and emoji. */
export function describeWeatherCode(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear sky', icon: '☀️' };
  if (code <= 2) return { label: 'Partly cloudy', icon: '⛅' };
  if (code === 3) return { label: 'Overcast', icon: '☁️' };
  if (code <= 48) return { label: 'Fog', icon: '🌫️' };
  if (code <= 57) return { label: 'Drizzle', icon: '🌦️' };
  if (code <= 67) return { label: 'Rain', icon: '🌧️' };
  if (code <= 77) return { label: 'Snow', icon: '❄️' };
  if (code <= 82) return { label: 'Rain showers', icon: '🌦️' };
  if (code <= 86) return { label: 'Snow showers', icon: '🌨️' };
  return { label: 'Thunderstorm', icon: '⛈️' };
}

/** Codes where outdoor tasks are worth flagging (rain, snow, storms). */
export function isWetWeather(code: number): boolean {
  return code >= 51;
}
