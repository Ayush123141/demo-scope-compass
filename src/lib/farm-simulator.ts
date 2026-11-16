export type FieldAction = "irrigate_now" | "hold_off" | "protect_crop" | "no_action_needed";

export interface MoistureSignal {
  moisturePercent: number;
  capturedAtMs: number;
  isLive: boolean;
}

export interface RainSignal {
  rainfallMm24h: number;
  forecastWindowHours: number;
  isSimulated: boolean;
}

export interface SatelliteSignal {
  available: boolean;
  capturedAtMs: number;
  isLive: boolean;
}

export interface FieldDecision {
  action: FieldAction;
  confidencePercent: number;
  reason: string;
  sourceLabel: "Demo decision" | "Data unavailable";
}

export interface DemoSnapshot {
  tick: number;
  moisture: MoistureSignal;
  forecast: RainSignal;
  satellite: SatelliteSignal;
  decision: FieldDecision;
  fieldHealthPercent: number;
}

const DEMO_EPOCH_MS = Date.UTC(2026, 10, 16, 8, 0, 0);
const SENSOR_MAX_AGE_MS = 15 * 60 * 1000;
const SATELLITE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const moistureCycle = [32, 31, 28, 36, 43, 49, 55, 51, 46, 38, 30, 34];
const rainfallCycle = [0, 1, 0, 2, 14, 18, 16, 7, 3, 0, 0, 1];

export function decideFieldAction(input: {
  moisture: MoistureSignal | null;
  forecast: RainSignal | null;
  satellite: SatelliteSignal | null;
  nowMs: number;
}): FieldDecision {
  const { moisture, forecast, satellite, nowMs } = input;

  if (!moisture || nowMs - moisture.capturedAtMs > SENSOR_MAX_AGE_MS) {
    return {
      action: "no_action_needed",
      confidencePercent: 0,
      reason: "A fresh moisture reading is unavailable. Check the sensor before deciding.",
      sourceLabel: "Data unavailable",
    };
  }

  if (
    !satellite?.available ||
    nowMs - satellite.capturedAtMs > SATELLITE_MAX_AGE_MS
  ) {
    return {
      action: "no_action_needed",
      confidencePercent: 0,
      reason: "A recent field image is unavailable. Check field conditions before deciding.",
      sourceLabel: "Data unavailable",
    };
  }

  if (!forecast) {
    return {
      action: "no_action_needed",
      confidencePercent: 0,
      reason: "A rainfall outlook is unavailable. Check local conditions before deciding.",
      sourceLabel: "Data unavailable",
    };
  }

  if (moisture.moisturePercent < 35 && forecast.rainfallMm24h < 8) {
    return {
      action: "irrigate_now",
      confidencePercent: 78,
      reason: "Soil is on the dry side, with little rain in the outlook. Check the crop before watering.",
      sourceLabel: "Demo decision",
    };
  }

  if (moisture.moisturePercent >= 40 && forecast.rainfallMm24h >= 12) {
    return {
      action: "protect_crop",
      confidencePercent: 76,
      reason: "Rain may arrive while soil still holds moisture. Prepare the field for heavier showers.",
      sourceLabel: "Demo decision",
    };
  }

  if (moisture.moisturePercent < 38 && forecast.rainfallMm24h < 12) {
    return {
      action: "hold_off",
      confidencePercent: 64,
      reason: "Moisture bears watching. Recheck the soil before choosing to irrigate.",
      sourceLabel: "Demo decision",
    };
  }

  return {
    action: "no_action_needed",
    confidencePercent: 71,
    reason: "Moisture and the rainfall outlook look steady. Check again with your next reading.",
    sourceLabel: "Demo decision",
  };
}

export function createDemoSnapshot(tick = 0): DemoSnapshot {
  const offset = Math.abs(Math.trunc(tick)) % moistureCycle.length;
  const nowMs = DEMO_EPOCH_MS + Math.abs(Math.trunc(tick)) * 60_000;
  const moisturePercent = moistureCycle[offset] ?? 32;
  const rainfallMm24h = rainfallCycle[offset] ?? 0;
  const moisture: MoistureSignal = {
    moisturePercent,
    capturedAtMs: nowMs - 2 * 60_000,
    isLive: false,
  };
  const forecast: RainSignal = {
    rainfallMm24h,
    forecastWindowHours: 24,
    isSimulated: true,
  };
  const satellite: SatelliteSignal = {
    available: true,
    capturedAtMs: nowMs - 2 * 24 * 60 * 60 * 1000,
    isLive: false,
  };

  return {
    tick: Math.abs(Math.trunc(tick)),
    moisture,
    forecast,
    satellite,
    decision: decideFieldAction({ moisture, forecast, satellite, nowMs }),
    fieldHealthPercent: Math.max(
      42,
      Math.min(94, Math.round(54 + moisturePercent * 0.42 + (rainfallMm24h > 12 ? 4 : 0))),
    ),
  };
}

export function formatRainfall(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} mm`;
}