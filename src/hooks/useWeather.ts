import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { LocationPermissionError, findCity, getCurrentCoordinates, getPlaceName } from '@/services/locationService';
import { queryKeys } from '@/services/queryClient';
import { loadManualCity, readCache, saveCache, saveManualCity } from '@/services/storageService';
import { fetchForecast } from '@/services/weatherService';
import type { CachedResult, Coordinates, WeatherReport } from '@/types';
import { toUserMessage } from '@/utils/errors';

type LocationState =
  | { status: 'locating' }
  | { status: 'ready'; coords: Coordinates; placeName: string | null; source: 'device' | 'manual' }
  | { status: 'denied' }
  | { status: 'error'; message: string };

const WEATHER_CACHE_KEY = 'weather';

/** Device GPS first; if that fails, a city the user typed earlier; otherwise explain why. */
async function resolveLocation(): Promise<LocationState> {
  try {
    const coords = await getCurrentCoordinates();
    return { status: 'ready', coords, placeName: await getPlaceName(coords), source: 'device' };
  } catch (error) {
    const manual = await loadManualCity();
    if (manual) return { status: 'ready', coords: manual.coords, placeName: manual.name, source: 'manual' };
    if (error instanceof LocationPermissionError) return { status: 'denied' };
    return { status: 'error', message: toUserMessage(error) };
  }
}

/**
 * Resolves where the user is (device GPS, or a city they typed if permission
 * was denied) and loads the Open-Meteo forecast for those coordinates.
 */
export function useWeather() {
  const [location, setLocation] = useState<LocationState>({ status: 'locating' });

  const relocate = useCallback(async () => {
    setLocation({ status: 'locating' });
    setLocation(await resolveLocation());
  }, []);

  useEffect(() => {
    let active = true;
    void resolveLocation().then((resolved) => {
      if (active) setLocation(resolved);
    });
    return () => {
      active = false;
    };
  }, []);

  /** Lets the user pick a city by name. Returns an error message, or null on success. */
  const chooseCity = useCallback(async (query: string): Promise<string | null> => {
    const trimmed = query.trim();
    if (!trimmed) return 'Enter a city name';
    try {
      const match = await findCity(trimmed);
      if (!match) return `Couldn't find "${trimmed}". Try a nearby larger town.`;
      await saveManualCity({ name: match.name, coords: match.coords });
      setLocation({ status: 'ready', coords: match.coords, placeName: match.name, source: 'manual' });
      return null;
    } catch (error) {
      return toUserMessage(error);
    }
  }, []);

  const coords = location.status === 'ready' ? location.coords : null;
  const placeName = location.status === 'ready' ? location.placeName : null;

  const forecast = useQuery<CachedResult<WeatherReport>>({
    queryKey: coords ? queryKeys.weather(coords.latitude, coords.longitude) : ['weather', 'none'],
    enabled: coords !== null,
    staleTime: 15 * 60 * 1000,
    queryFn: async () => {
      try {
        const result = await fetchForecast(coords as Coordinates);
        const report: WeatherReport = { ...result, placeName, fetchedAt: new Date().toISOString() };
        await saveCache(WEATHER_CACHE_KEY, report);
        return { items: report, fromCache: false, savedAt: null };
      } catch (error) {
        const cached = await readCache<WeatherReport>(WEATHER_CACHE_KEY);
        if (cached) return { items: cached.value, fromCache: true, savedAt: cached.savedAt };
        throw error;
      }
    },
  });

  return { location, forecast, relocate, chooseCity };
}
