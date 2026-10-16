import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Coordinates, Preferences } from '@/types';

/*
 * Local storage complements the remote database; it never replaces it.
 * Used for: offline copies of the last-fetched lists, user preferences,
 * unsaved task drafts, a manually chosen weather city, and the
 * device-specific IDs of scheduled reminder notifications.
 */

const KEYS = {
  cache: (key: string) => `taskflow:cache:${key}`,
  preferences: 'taskflow:preferences',
  draft: (key: string) => `taskflow:draft:${key}`,
  reminders: 'taskflow:reminders',
  manualCity: 'taskflow:manual-city',
} as const;

export const DEFAULT_PREFERENCES: Preferences = {
  temperatureUnit: 'celsius',
  defaultReminderMinutes: 30,
  hideCompleted: false,
};

async function readJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    // Corrupt or unreadable local data must never crash the app — treat it as missing.
    return null;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage is best-effort; the remote database remains the source of truth.
  }
}

// ---- Offline list cache ----

interface CacheEntry<T> {
  savedAt: string;
  value: T;
}

export async function saveCache<T>(key: string, value: T): Promise<void> {
  await writeJson(KEYS.cache(key), { savedAt: new Date().toISOString(), value } satisfies CacheEntry<T>);
}

export function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  return readJson<CacheEntry<T>>(KEYS.cache(key));
}

// ---- Preferences ----

export async function loadPreferences(): Promise<Preferences> {
  const stored = await readJson<Partial<Preferences>>(KEYS.preferences);
  return { ...DEFAULT_PREFERENCES, ...stored };
}

export function savePreferences(preferences: Preferences): Promise<void> {
  return writeJson(KEYS.preferences, preferences);
}

// ---- Drafts ----

export function loadDraft<T>(key: string): Promise<T | null> {
  return readJson<T>(KEYS.draft(key));
}

export function saveDraft<T>(key: string, draft: T): Promise<void> {
  return writeJson(KEYS.draft(key), draft);
}

export async function clearDraft(key: string): Promise<void> {
  await AsyncStorage.removeItem(KEYS.draft(key)).catch(() => undefined);
}

// ---- Manual weather city (fallback when location is denied) ----

export interface ManualCity {
  name: string;
  coords: Coordinates;
}

export function loadManualCity(): Promise<ManualCity | null> {
  return readJson<ManualCity>(KEYS.manualCity);
}

export function saveManualCity(city: ManualCity): Promise<void> {
  return writeJson(KEYS.manualCity, city);
}

// ---- Reminder notification IDs (task id → notification id, this device only) ----

export async function loadReminderMap(): Promise<Record<string, string>> {
  return (await readJson<Record<string, string>>(KEYS.reminders)) ?? {};
}

export function saveReminderMap(map: Record<string, string>): Promise<void> {
  return writeJson(KEYS.reminders, map);
}

/** Removes everything this user stored locally. Called on sign-out so the next user starts clean. */
export async function clearUserData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const userKeys = keys.filter((key) => key.startsWith('taskflow:') && key !== KEYS.preferences);
  await AsyncStorage.multiRemove(userKeys);
}
