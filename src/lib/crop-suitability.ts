import type { HistoricalWeatherSummary } from "./historical-weather";

export interface CropReference {
  id: string;
  name: string;
  waterNeed: "Low" | "Moderate" | "High";
  temperatureRangeC: [number, number];
  rainfallRangeMmYear: [number, number];
  moistureRangePercent: [number, number];
  note: string;
}

export interface CropAssessmentInput {
  history: HistoricalWeatherSummary | null;
  soilMoisturePercent: number | null;
  forecastRainfallMm24h: number | null;
}

export interface CropSuitabilityResult {
  crop: CropReference;
  score: number | null;
  reasons: string[];
  risks: string[];
  missingInputs: string[];
  impactLevel: "Lower relative stress" | "Watch conditions" | "Higher relative stress" | "Insufficient data";
  isPreliminary: true;
}

// Broad prototype ranges for comparison only; they are not locally validated crop prescriptions.
export const CROP_REFERENCES: CropReference[] = [
  { id: "cotton", name: "Cotton", waterNeed: "Moderate", temperatureRangeC: [21, 35], rainfallRangeMmYear: [500, 1000], moistureRangePercent: [30, 55], note: "Needs a warm growing season and drainage during heavy rain." },
  { id: "soybean", name: "Soybean", waterNeed: "Moderate", temperatureRangeC: [20, 32], rainfallRangeMmYear: [450, 900], moistureRangePercent: [30, 55], note: "Sensitive to prolonged waterlogging and long dry spells." },
  { id: "grapes", name: "Grapes", waterNeed: "Moderate", temperatureRangeC: [15, 32], rainfallRangeMmYear: [400, 900], moistureRangePercent: [25, 50], note: "Local variety, season, and disease pressure strongly affect suitability." },
  { id: "onion", name: "Onion", waterNeed: "Moderate", temperatureRangeC: [13, 30], rainfallRangeMmYear: [350, 700], moistureRangePercent: [25, 45], note: "Avoid prolonged wet conditions near harvest." },
  { id: "sugarcane", name: "Sugarcane", waterNeed: "High", temperatureRangeC: [20, 35], rainfallRangeMmYear: [900, 1800], moistureRangePercent: [35, 65], note: "Water demand is high; reliable water access is not assessed here." },
  { id: "citrus", name: "Citrus", waterNeed: "Moderate", temperatureRangeC: [18, 35], rainfallRangeMmYear: [600, 1200], moistureRangePercent: [30, 55], note: "Rootstock, soil drainage, and orchard age are not included." },
  { id: "wheat", name: "Wheat", waterNeed: "Moderate", temperatureRangeC: [10, 25], rainfallRangeMmYear: [300, 800], moistureRangePercent: [25, 50], note: "Season and sowing window materially affect suitability." },
];

function within(value: number, range: [number, number]): boolean {
  return value >= range[0] && value <= range[1];
}

export function assessCropSuitability(input: CropAssessmentInput): CropSuitabilityResult[] {
  return CROP_REFERENCES.map((crop) => {
    const missingInputs: string[] = [];
    const history = input.history;
    const temperature = history?.averageTemperatureC ?? null;
    const rainfallYear = history?.range === "12m" ? history.totalRainfallMm : null;
    const moisture = input.soilMoisturePercent;
    if (temperature === null) missingInputs.push("Historical average temperature");
    if (rainfallYear === null) missingInputs.push("12-month historical rainfall");
    if (moisture === null || !Number.isFinite(moisture)) missingInputs.push("Current soil-moisture reading");

    if (missingInputs.length) {
      return {
        crop,
        score: null,
        reasons: [],
        risks: [],
        missingInputs,
        impactLevel: "Insufficient data" as const,
        isPreliminary: true as const,
      };
    }

    let score = 50;
    const reasons: string[] = [];
    const risks: string[] = [];
    if (temperature !== null && within(temperature, crop.temperatureRangeC)) {
      score += 15;
      reasons.push(`Historical average temperature (${temperature.toFixed(1)} °C) is within this broad reference range.`);
    } else if (temperature !== null) {
      score -= 15;
      risks.push("Historical average temperature is outside this broad reference range.");
    }
    if (rainfallYear !== null && within(rainfallYear, crop.rainfallRangeMmYear)) {
      score += 15;
      reasons.push(`12-month rainfall (${rainfallYear.toFixed(0)} mm) is within this broad reference range.`);
    } else if (rainfallYear !== null) {
      score -= 15;
      risks.push("12-month rainfall is outside this broad reference range.");
    }
    if (moisture !== null && within(moisture, crop.moistureRangePercent)) {
      score += 10;
      reasons.push(`Current soil moisture (${moisture}%) is within the prototype reference range.`);
    } else if (moisture !== null) {
      score -= 10;
      risks.push("Current soil moisture is outside the prototype reference range.");
    }
    if (input.forecastRainfallMm24h !== null && input.forecastRainfallMm24h >= 25) {
      score -= 5;
      risks.push(`Heavy rain is in the 24-hour forecast (${input.forecastRainfallMm24h.toFixed(1)} mm); conditions may change.`);
    }
    if (reasons.length === 0) reasons.push("The available measurements did not match the broad climate references strongly.");

    const boundedScore = Math.max(0, Math.min(100, score));
    return {
      crop,
      score: boundedScore,
      reasons,
      risks,
      missingInputs,
      impactLevel: boundedScore >= 70 ? "Lower relative stress" : boundedScore >= 50 ? "Watch conditions" : "Higher relative stress",
      isPreliminary: true,
    };
  });
}