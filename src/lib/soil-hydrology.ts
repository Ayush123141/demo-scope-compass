/**
 * Soil Hydrology Dynamics Engine for Mitti Sentinel
 *
 * Models authentic physical soil drying, diurnal evaporation (ET0),
 * capillary moisture movement, and analog capacitive sensor ADC noise
 * so field telemetry feels completely real and scientifically plausible.
 */

export interface HydrologyState {
  currentMoisture: number;
  rawAdcReading: number; // 12-bit ADC (0 - 4095)
  temperatureC: number;
  isPercolating: boolean;
  drainageRatePerHour: number;
}

/**
 * Calculates smooth, realistic physical soil moisture with natural micro-jitter
 * based on ambient temperature, humidity, and time since last irrigation pulse.
 */
export function calculateRealisticSoilMoisture(
  baselineMoisture = 31.8,
  tickCount = 0,
  ambientTempC = 28.5,
  humidityPercent = 52,
  manualPulseOffset = 0
): HydrologyState {
  // If user triggered an irrigation pulse or test scenario, use that as base
  const targetBase = manualPulseOffset !== 0 ? manualPulseOffset : baselineMoisture;

  // Diurnal sinusoidal solar radiation curve (daytime peak drying, nighttime stabilization)
  const hourOfDay = (8 + (tickCount * 0.5)) % 24;
  const solarFactor = Math.max(0, Math.sin(((hourOfDay - 6) / 12) * Math.PI)); // peaks at 12:00
  
  // Evaporation rate driven by temperature, humidity, and solar factor
  const evaporativeDemand = ((ambientTempC - 20) / 25) * (1 - humidityPercent / 100) * solarFactor;
  const naturalDrift = -(evaporativeDemand * 0.35);

  // Microscopic capacitive sensor analog noise (ESP32 ADC jitter +/- 0.12%)
  const seed = tickCount * 17.31 + Math.sin(tickCount * 0.8) * 5;
  const pseudoNoise = ((Math.sin(seed * 3.14) * 0.12) + (Math.cos(seed * 2.71) * 0.08));

  const finalMoisture = Number(
    Math.max(12, Math.min(68, targetBase + naturalDrift + pseudoNoise)).toFixed(1)
  );

  // Calibrate to authentic 12-bit capacitive sensor ADC:
  // Dry air ~= 3100 counts, pure water ~= 1350 counts.
  // ADC = Dry - (MoisturePercent / 100) * (Dry - Wet)
  const rawAdc = Math.round(3100 - (finalMoisture / 100) * (3100 - 1350) + (pseudoNoise * 30));

  return {
    currentMoisture: finalMoisture,
    rawAdcReading: rawAdc,
    temperatureC: Number((ambientTempC + (solarFactor * 3.2) + pseudoNoise * 0.5).toFixed(1)),
    isPercolating: finalMoisture > 45,
    drainageRatePerHour: Number((0.15 + evaporativeDemand * 0.25).toFixed(2)),
  };
}
