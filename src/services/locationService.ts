import * as Location from 'expo-location';

import type { Coordinates } from '@/types';

/** Raised when the user declines location access, so the UI can show a manual-city fallback. */
export class LocationPermissionError extends Error {
  constructor() {
    super('Location permission was denied.');
    this.name = 'LocationPermissionError';
  }
}

export async function getCurrentCoordinates(): Promise<Coordinates> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) throw new LocationPermissionError();

  // A recent cached fix is fine for weather and avoids a slow GPS wait indoors.
  const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 });
  const position = lastKnown ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));

  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}

/** Reverse geocodes coordinates into a short place name. Failure is non-fatal. */
export async function getPlaceName(coords: Coordinates): Promise<string | null> {
  try {
    const [place] = await Location.reverseGeocodeAsync(coords);
    if (!place) return null;
    return [place.city ?? place.subregion, place.country].filter(Boolean).join(', ') || null;
  } catch {
    return null;
  }
}

/** Forward geocodes a typed city name, used when location permission is denied. */
export async function findCity(query: string): Promise<{ coords: Coordinates; name: string } | null> {
  const [match] = await Location.geocodeAsync(query);
  if (!match) return null;
  const coords = { latitude: match.latitude, longitude: match.longitude };
  return { coords, name: (await getPlaceName(coords)) ?? query };
}
