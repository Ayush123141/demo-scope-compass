export type WeatherRange = "30d" | "90d" | "12m";

export interface HistoricalWeatherDay {
  date: string;
  precipitationMm: number | null;
  meanTemperatureC: number | null;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  meanHumidityPercent: number | null;
  meanWindSpeedKmh: number | null;
}

export interface HistoricalWeatherResult {
  available: boolean;
  days: HistoricalWeatherDay[];
  startDate: string | null;
  endDate: string | null;
  source: "Open-Meteo Historical Weather API";
  updatedAt: string;
  message: string | null;
}

export interface HistoricalWeatherSummary {
  range: WeatherRange;
  startDate: string | null;
  endDate: string | null;
  dayCount: number;
  totalRainfallMm: number | null;
  previousRainfallMm: number | null;
  rainfallDeviationPercent: number | null;
  averageTemperatureC: number | null;
  maxTemperatureC: number | null;
  minTemperatureC: number | null;
  averageHumidityPercent: number | null;
  averageWindSpeedKmh: number | null;
  maxDrySpellDays: number | null;
  currentDrySpellDays: number | null;
  monthlyRainfall: Array<{ month: string; rainfallMm: number }>;
  source: "Open-Meteo Historical Weather API";
  updatedAt: string;
}

const RANGE_DAYS: Record<WeatherRange, number> = { "30d": 30, "90d": 90, "12m": 365 };
const SOURCE = "Open-Meteo Historical Weather API" as const;
const DAILY_FIELDS = [
  "precipitation_sum",
  "temperature_2m_mean",
  "temperature_2m_min",
  "temperature_2m_max",
  "relative_humidity_2m_mean",
  "wind_speed_10m_mean",
].join(",");

function shiftDate(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readNumber(values: unknown, index: number): number | null {
  if (!Array.isArray(values)) return null;
  const value: unknown = values[index];
  return isFiniteNumber(value) ? value : null;
}

function mean(values: Array<number | null>): number | null {
  const usable = values.filter((value): value is number => value !== null);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null;
}

function sum(values: Array<number | null>): number | null {
  const usable = values.filter((value): value is number => value !== null);
  return usable.length ? usable.reduce((total, value) => total + value, 0) : null;
}

export async function fetchHistoricalWeather(
  latitude: number,
  longitude: number,
  now = new Date(),
): Promise<HistoricalWeatherResult> {
  const updatedAt = now.toISOString();
  const unavailable = (message: string): HistoricalWeatherResult => ({
    available: false,
    days: [],
    startDate: null,
    endDate: null,
    source: SOURCE,
    updatedAt,
    message,
  });

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return unavailable("A valid farm location is needed for historical weather.");
  }

  // Archive observations can lag the current day; leave a five-day margin for complete records.
  const end = shiftDate(now, -5);
  const start = shiftDate(end, -729);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: startDate,
    end_date: endDate,
    daily: DAILY_FIELDS,
    timezone: "auto",
  }).toString();

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return unavailable("Historical weather is temporarily unavailable.");

    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("daily" in payload)) {
      return unavailable("Historical weather returned no usable daily records.");
    }
    const daily = payload.daily;
    if (!daily || typeof daily !== "object" || !("time" in daily) || !Array.isArray(daily.time)) {
      return unavailable("Historical weather returned no usable daily records.");
    }

    const dates: unknown[] = daily.time;
    const days = dates.flatMap((date, index): HistoricalWeatherDay[] => {
      if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
      const row: HistoricalWeatherDay = {
        date,
        precipitationMm: readNumber("precipitation_sum" in daily ? daily.precipitation_sum : null, index),
        meanTemperatureC: readNumber("temperature_2m_mean" in daily ? daily.temperature_2m_mean : null, index),
        minTemperatureC: readNumber("temperature_2m_min" in daily ? daily.temperature_2m_min : null, index),
        maxTemperatureC: readNumber("temperature_2m_max" in daily ? daily.temperature_2m_max : null, index),
        meanHumidityPercent: readNumber("relative_humidity_2m_mean" in daily ? daily.relative_humidity_2m_mean : null, index),
        meanWindSpeedKmh: readNumber("wind_speed_10m_mean" in daily ? daily.wind_speed_10m_mean : null, index),
      };
      return Object.values(row).some(isFiniteNumber) ? [row] : [];
    });

    if (days.length < 14) return unavailable("Not enough historical weather records are available yet.");
    return { available: true, days, startDate, endDate, source: SOURCE, updatedAt, message: null };
  } catch {
    return unavailable("Historical weather could not be reached. Try again when the connection is available.");
  }
}

export function summarizeHistoricalWeather(
  rows: HistoricalWeatherDay[],
  range: WeatherRange,
  updatedAt = new Date().toISOString(),
): HistoricalWeatherSummary {
  const days = [...rows].sort((left, right) => left.date.localeCompare(right.date));
  const lastDate = days.at(-1)?.date ?? null;
  const endTime = lastDate ? Date.parse(`${lastDate}T00:00:00Z`) : Number.NaN;
  const count = RANGE_DAYS[range];
  const selected = Number.isFinite(endTime)
    ? days.filter((day) => {
        const timestamp = Date.parse(`${day.date}T00:00:00Z`);
        return timestamp > endTime - count * 86_400_000 && timestamp <= endTime;
      })
    : [];
  const previous = Number.isFinite(endTime)
    ? days.filter((day) => {
        const timestamp = Date.parse(`${day.date}T00:00:00Z`);
        return timestamp > endTime - count * 2 * 86_400_000 && timestamp <= endTime - count * 86_400_000;
      })
    : [];

  const rainfall = sum(selected.map((day) => day.precipitationMm));
  const previousRainfall = sum(previous.map((day) => day.precipitationMm));
  const rainfallDeviationPercent =
    rainfall !== null && previousRainfall !== null && previousRainfall > 0
      ? ((rainfall - previousRainfall) / previousRainfall) * 100
      : null;

  let currentDrySpellDays: number | null = null;
  let maxDrySpellDays: number | null = null;
  let runningDryDays = 0;
  let hasRainfallRecord = false;
  for (const day of selected) {
    if (day.precipitationMm === null) continue;
    hasRainfallRecord = true;
    if (day.precipitationMm < 1) {
      runningDryDays += 1;
      maxDrySpellDays = Math.max(maxDrySpellDays ?? 0, runningDryDays);
    } else {
      runningDryDays = 0;
    }
  }
  if (hasRainfallRecord) currentDrySpellDays = runningDryDays;

  const monthly = new Map<string, number>();
  for (const day of selected) {
    if (day.precipitationMm === null) continue;
    const month = day.date.slice(0, 7);
    monthly.set(month, (monthly.get(month) ?? 0) + day.precipitationMm);
  }

  return {
    range,
    startDate: selected[0]?.date ?? null,
    endDate: selected.at(-1)?.date ?? null,
    dayCount: selected.length,
    totalRainfallMm: rainfall,
    previousRainfallMm: previousRainfall,
    rainfallDeviationPercent,
    averageTemperatureC: mean(selected.map((day) => day.meanTemperatureC)),
    maxTemperatureC: selected.reduce<number | null>(
      (maximum, day) => day.maxTemperatureC === null ? maximum : Math.max(maximum ?? day.maxTemperatureC, day.maxTemperatureC),
      null,
    ),
    minTemperatureC: selected.reduce<number | null>(
      (minimum, day) => day.minTemperatureC === null ? minimum : Math.min(minimum ?? day.minTemperatureC, day.minTemperatureC),
      null,
    ),
    averageHumidityPercent: mean(selected.map((day) => day.meanHumidityPercent)),
    averageWindSpeedKmh: mean(selected.map((day) => day.meanWindSpeedKmh)),
    maxDrySpellDays,
    currentDrySpellDays,
    monthlyRainfall: [...monthly.entries()].map(([month, rainfallMm]) => ({ month, rainfallMm })),
    source: SOURCE,
    updatedAt,
  };
}