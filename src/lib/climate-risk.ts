import type { HistoricalWeatherSummary } from "./historical-weather";

export type RiskCategory = "low" | "moderate" | "high" | "critical";
export type ClimateRiskId = "drought" | "heavy_rain" | "heat_stress" | "dry_spell" | "waterlogging";

export interface ClimateRiskInput {
  history: HistoricalWeatherSummary | null;
  forecastRainfallMm24h: number | null;
  currentTemperatureC: number | null;
  soilMoisturePercent: number | null;
  updatedAt: string;
}

export interface ClimateRiskItem {
  id: ClimateRiskId;
  label: string;
  available: boolean;
  score: number | null;
  category: RiskCategory | null;
  factors: string[];
  consideration: string;
  confidenceLabel: "Limited" | "Moderate" | "Better coverage" | "Insufficient data";
  updatedAt: string;
}

export interface ClimateRiskAssessment {
  score: number | null;
  category: RiskCategory | null;
  items: ClimateRiskItem[];
  updatedAt: string;
  isPrototype: true;
}

export function getRiskCategory(score: number): RiskCategory {
  if (score <= 25) return "low";
  if (score <= 50) return "moderate";
  if (score <= 75) return "high";
  return "critical";
}

function confidence(inputCount: number): ClimateRiskItem["confidenceLabel"] {
  if (inputCount < 1) return "Insufficient data";
  if (inputCount === 1) return "Limited";
  if (inputCount === 2) return "Moderate";
  return "Better coverage";
}

function makeRisk(
  id: ClimateRiskId,
  label: string,
  score: number | null,
  factors: string[],
  consideration: string,
  confidenceLabel: ClimateRiskItem["confidenceLabel"],
  updatedAt: string,
): ClimateRiskItem {
  const boundedScore = score === null ? null : Math.max(0, Math.min(100, Math.round(score)));
  return {
    id,
    label,
    available: boundedScore !== null,
    score: boundedScore,
    category: boundedScore === null ? null : getRiskCategory(boundedScore),
    factors,
    consideration,
    confidenceLabel: boundedScore === null ? "Insufficient data" : confidenceLabel,
    updatedAt,
  };
}

export function assessClimateRisk(input: ClimateRiskInput): ClimateRiskAssessment {
  const history = input.history;
  const rainfall30d = history?.totalRainfallMm !== null && history?.totalRainfallMm !== undefined
    ? (history.totalRainfallMm / Math.max(history.dayCount, 1)) * 30
    : null;
  const dryDays = history?.currentDrySpellDays ?? null;
  const soilMoisture = typeof input.soilMoisturePercent === "number" && Number.isFinite(input.soilMoisturePercent)
    ? input.soilMoisturePercent
    : null;
  const forecastRainfall = typeof input.forecastRainfallMm24h === "number" && Number.isFinite(input.forecastRainfallMm24h)
    ? input.forecastRainfallMm24h
    : null;
  const currentTemperature = typeof input.currentTemperatureC === "number" && Number.isFinite(input.currentTemperatureC)
    ? input.currentTemperatureC
    : null;
  const hasSoil = soilMoisture !== null;
  const hasForecast = forecastRainfall !== null;
  const hasTemperature = currentTemperature !== null;
  const hasRainHistory = rainfall30d !== null && history !== null && history.dayCount >= 14;

  let droughtScore: number | null = null;
  const droughtFactors: string[] = [];
  if (hasRainHistory && hasSoil) {
    droughtScore = 15;
    if (rainfall30d !== null && rainfall30d < 30) {
      droughtScore += 30;
      droughtFactors.push(`About ${rainfall30d.toFixed(0)} mm rain in the last 30 days`);
    } else if (rainfall30d !== null && rainfall30d < 60) {
      droughtScore += 15;
      droughtFactors.push(`About ${rainfall30d.toFixed(0)} mm rain in the last 30 days`);
    }
    if (soilMoisture !== null && soilMoisture < 30) {
      droughtScore += 35;
      droughtFactors.push(`Soil moisture is ${soilMoisture}%`);
    } else if (soilMoisture !== null && soilMoisture < 38) {
      droughtScore += 22;
      droughtFactors.push(`Soil moisture is ${soilMoisture}%`);
    }
    if (dryDays !== null && dryDays >= 14) {
      droughtScore += 25;
      droughtFactors.push(`${dryDays} consecutive days with less than 1 mm rain`);
    } else if (dryDays !== null && dryDays >= 7) {
      droughtScore += 12;
      droughtFactors.push(`${dryDays} consecutive days with less than 1 mm rain`);
    }
  }

  const drySpellScore = dryDays === null
    ? null
    : dryDays >= 14 ? 82 : dryDays >= 10 ? 62 : dryDays >= 7 ? 48 : dryDays >= 4 ? 30 : 12;
  const drySpellFactors = dryDays === null ? [] : [`Current dry spell: ${dryDays} days (<1 mm/day)`];

  let rainScore: number | null = null;
  if (forecastRainfall !== null) {
    const rain = forecastRainfall;
    rainScore = rain >= 40 ? 90 : rain >= 25 ? 78 : rain >= 15 ? 58 : rain >= 8 ? 32 : 8;
  }

  let heatScore: number | null = null;
  if (currentTemperature !== null) {
    const temperature = currentTemperature;
    heatScore = temperature >= 42 ? 90 : temperature >= 39 ? 78 : temperature >= 36 ? 55 : temperature >= 33 ? 32 : 8;
  }

  let waterloggingScore: number | null = null;
  const waterloggingFactors: string[] = [];
  if (soilMoisture !== null && forecastRainfall !== null) {
    const moisture = soilMoisture;
    const rain = forecastRainfall;
    waterloggingScore = moisture >= 45 && rain >= 15 ? 86 : moisture >= 40 && rain >= 20 ? 72 : moisture >= 45 ? 38 : 10;
    if (moisture >= 40) waterloggingFactors.push(`Soil moisture is ${moisture}%`);
    if (rain >= 15) waterloggingFactors.push(`${rain.toFixed(1)} mm forecast over 24 hours`);
  }

  const items = [
    makeRisk("drought", "Drought stress", droughtScore, droughtFactors, "Check soil in the root zone and plan water use with the local forecast.", confidence(droughtFactors.length), input.updatedAt),
    makeRisk("dry_spell", "Extended dry spell", drySpellScore, drySpellFactors, "Check the field and crop condition; a dry-spell indicator is not an irrigation order.", dryDays === null ? "Insufficient data" : "Limited", input.updatedAt),
    makeRisk("heavy_rain", "Heavy rainfall", rainScore, forecastRainfall !== null ? [`24-hour forecast: ${forecastRainfall.toFixed(1)} mm`] : [], "Monitor local forecast updates and inspect field drainage before rain arrives.", hasForecast ? "Limited" : "Insufficient data", input.updatedAt),
    makeRisk("heat_stress", "Heat stress", heatScore, currentTemperature !== null ? [`Current temperature: ${currentTemperature.toFixed(1)} °C`] : [], "Watch crop and soil conditions during hot periods; this prototype does not diagnose crop damage.", hasTemperature ? "Limited" : "Insufficient data", input.updatedAt),
    makeRisk("waterlogging", "Excess moisture / waterlogging", waterloggingScore, waterloggingFactors, "Inspect low areas and drainage; do not change irrigation automatically.", hasSoil && hasForecast ? "Moderate" : "Insufficient data", input.updatedAt),
  ];
  const availableScores = items.flatMap((item) => item.score === null ? [] : [item.score]);
  const score = availableScores.length ? Math.max(...availableScores) : null;

  return {
    score,
    category: score === null ? null : getRiskCategory(score),
    items,
    updatedAt: input.updatedAt,
    isPrototype: true,
  };
}