/**
 * Real Meteorological Service for Mitti Sentinel
 *
 * Fetches live weather, 24h rainfall forecasts, and FAO-56 Reference
 * Evapotranspiration (ET0) from Open-Meteo (open-source, WMO/ECMWF data).
 *
 * Real where it matters, transparent and graceful fallback if offline.
 */

export interface LiveWeatherData {
  isLive: boolean;
  source: string;
  temperatureC: number;
  humidityPercent: number;
  windSpeedKmh: number;
  rainfallMm24h: number;
  rainProbabilityPercent: number;
  evapotranspirationMmDay: number;
  weatherDescription: string;
  lastUpdated: string;
}

export const DEFAULT_FALLBACK_WEATHER: LiveWeatherData = {
  isLive: false,
  source: "Simulated Model Fallback",
  temperatureC: 28.5,
  humidityPercent: 54,
  windSpeedKmh: 12.0,
  rainfallMm24h: 3.5,
  rainProbabilityPercent: 25,
  evapotranspirationMmDay: 4.8,
  weatherDescription: "Partly Cloudy",
  lastUpdated: "Just now",
};

export async function fetchLivePlotWeather(
  latitude: number,
  longitude: number
): Promise<LiveWeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability,precipitation&daily=precipitation_sum,et0_fao_evapotranspiration,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2`;

    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      return DEFAULT_FALLBACK_WEATHER;
    }

    const data = await res.json();
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    const weatherCode = current?.weather_code ?? 0;
    const weatherDescription = mapWeatherCodeToCondition(weatherCode);

    const rainSum24h = daily?.precipitation_sum?.[0] ?? current?.precipitation ?? 0;
    const et0 = daily?.et0_fao_evapotranspiration?.[0] ?? 4.5;
    const rainProb = hourly?.precipitation_probability?.[0] ?? (rainSum24h > 1 ? 65 : 15);

    return {
      isLive: true,
      source: "Open-Meteo WMO / ECMWF",
      temperatureC: Math.round((current?.temperature_2m ?? 28) * 10) / 10,
      humidityPercent: Math.round(current?.relative_humidity_2m ?? 50),
      windSpeedKmh: Math.round(current?.wind_speed_10m ?? 10),
      rainfallMm24h: Math.round(rainSum24h * 10) / 10,
      rainProbabilityPercent: Math.round(rainProb),
      evapotranspirationMmDay: Math.round(et0 * 10) / 10,
      weatherDescription,
      lastUpdated: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch (err) {
    console.warn("Live weather fetch timed out or failed, using simulated model:", err);
    return DEFAULT_FALLBACK_WEATHER;
  }
}

function mapWeatherCodeToCondition(code: number): string {
  if (code === 0) return "Clear Sky";
  if (code <= 3) return "Partly Cloudy";
  if (code >= 45 && code <= 48) return "Fog / Mist";
  if (code >= 51 && code <= 55) return "Light Drizzle";
  if (code >= 61 && code <= 65) return "Moderate Rain";
  if (code >= 80 && code <= 82) return "Rain Showers";
  if (code >= 95) return "Thunderstorm Alert";
  return "Clear / Mild";
}
