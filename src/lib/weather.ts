// Previsao do tempo para o dia da corrida (Open-Meteo: gratuito, sem chave, com CORS).
// So existe para etapas com coordenadas (hoje, as da F1 via Jolpica) e ate ~16 dias a frente.

export type RaceWeather = {
  temperatureMax: number;
  temperatureMin: number;
  rainChance: number;
  windKmh: number;
  /** Codigo WMO simplificado. */
  condition: 'clear' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'storm';
};

const cache = new Map<string, Promise<RaceWeather | null>>();

function conditionOf(code: number): RaceWeather['condition'] {
  if (code === 0 || code === 1) return 'clear';
  if (code === 2 || code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'cloudy';
}

export function weatherWindowOpen(date: string, now = Date.now()): boolean {
  const day = new Date(`${date}T12:00:00Z`).getTime();
  const days = (day - now) / 86_400_000;
  return days > -1 && days <= 15;
}

export function fetchRaceWeather(lat: number, lng: number, date: string): Promise<RaceWeather | null> {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}:${date}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weather_code` +
    `&timezone=auto&start_date=${date}&end_date=${date}`;

  const promise = fetch(url)
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Open-Meteo HTTP ${res.status}`))))
    .then((json: { daily?: Record<string, number[]> }) => {
      const d = json.daily;
      if (!d?.temperature_2m_max?.length) return null;
      return {
        temperatureMax: d.temperature_2m_max[0],
        temperatureMin: d.temperature_2m_min[0],
        rainChance: d.precipitation_probability_max?.[0] ?? 0,
        windKmh: d.wind_speed_10m_max?.[0] ?? 0,
        condition: conditionOf(d.weather_code?.[0] ?? 3),
      } satisfies RaceWeather;
    })
    .catch((error: unknown) => {
      cache.delete(key);
      console.error('Falha ao buscar a previsao do tempo.', error);
      return null;
    });

  cache.set(key, promise);
  return promise;
}
