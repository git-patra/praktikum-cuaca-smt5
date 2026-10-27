export const API_URL = 'https://api.open-meteo.com/v1/forecast?latitude=-6.2&longitude=106.8&hourly=temperature_2m';

export interface WeatherRow {
  time: string;
  temperature: number | null;
}
export interface WeatherData {
  rows: WeatherRow[];
  total: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Dua array dari API dipasangkan menurut indeks yang sama.
export function parseWeather(value: unknown): WeatherData {
  if (!isObject(value) || !isObject(value.hourly) || !isObject(value.hourly_units)) {
    throw new Error('Format respons API tidak sesuai.');
  }
  if (value.utc_offset_seconds !== 0 || value.hourly_units.temperature_2m !== '°C') {
    throw new Error('Zona waktu atau satuan suhu API tidak sesuai.');
  }
  const times = value.hourly.time;
  const temperatures = value.hourly.temperature_2m;
  if (!Array.isArray(times) || !Array.isArray(temperatures) || times.length !== temperatures.length) {
    throw new Error('Jumlah data waktu dan suhu tidak sesuai.');
  }
  const rows: WeatherRow[] = [];
  for (let index = 0; index < times.length; index++) {
    const time: unknown = times[index];
    const temperature: unknown = temperatures[index];
    if (typeof time !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time) ||
        !Number.isFinite(Date.parse(`${time}Z`)) ||
        (temperature !== null && (typeof temperature !== 'number' || !Number.isFinite(temperature)))) {
      throw new Error('Data waktu atau suhu tidak valid.');
    }
    rows.push({ time, temperature });
  }
  return { rows, total: times.length };
}

export async function fetchWeather(
  signal?: AbortSignal,
  fetcher: typeof fetch = fetch,
): Promise<WeatherData> {
  const response = await fetcher(API_URL, { signal });
  if (!response.ok) throw new Error(`API mengembalikan HTTP ${response.status}.`);
  return parseWeather(await response.json());
}
