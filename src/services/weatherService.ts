import type { Coordinates, CurrentWeather, DailyForecast } from '@/types';
import { RateLimitError, TimeoutError } from '@/utils/errors';

/*
 * Open-Meteo forecast API — free, no key required.
 * Fair-use limit for non-commercial use is roughly 10,000 calls/day; the app
 * caches results for 15 minutes (see useWeather) to stay well under it.
 * https://open-meteo.com/en/docs
 */
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 12000;

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[];
  };
}

export async function fetchForecast({ latitude, longitude }: Coordinates) {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '7',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}?${params.toString()}`, { signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) throw new TimeoutError('The weather service took too long to respond.');
    throw error;
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 429) throw new RateLimitError();
  if (!response.ok) throw new Error(`Weather service error (${response.status}). Try again shortly.`);

  const body = (await response.json()) as OpenMeteoResponse;
  return { current: mapCurrent(body), daily: mapDaily(body) };
}

function mapCurrent({ current }: OpenMeteoResponse): CurrentWeather {
  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    windSpeed: current.wind_speed_10m,
    precipitation: current.precipitation,
    weatherCode: current.weather_code,
    isDay: current.is_day === 1,
  };
}

function mapDaily({ daily }: OpenMeteoResponse): DailyForecast[] {
  return daily.time.map((date, index) => ({
    date,
    weatherCode: daily.weather_code[index],
    maxTemp: daily.temperature_2m_max[index],
    minTemp: daily.temperature_2m_min[index],
    precipitationProbability: daily.precipitation_probability_max[index] ?? 0,
  }));
}
