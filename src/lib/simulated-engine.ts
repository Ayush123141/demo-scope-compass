/**
 * Believable, Seeded Simulated Signals Generator
 * Produces smooth, physically plausible, time-varying forecasts:
 * - 24h rainfall forecast (mm) with diurnal oscillation
 * - Crop yield impact estimate (% variance from baseline)
 * - Historical soil-moisture retention trendline
 *
 * Seeded deterministically by `tick` so stage demos are 100% reproducible.
 * All signals have `is_simulated: true` for honest transparency.
 */

export interface SimulatedSignals {
  tick: number;
  rainfallMm24h: number;
  forecastWindowHours: number;
  yieldImpactPercent: number; // e.g., -8.5% (drought loss) or +4.2% (optimal)
  evapotranspirationMmDay: number;
  isSimulated: true;
  generatedAtMs: number;
}

/**
 * Deterministic pseudo-random generator with sine oscillation
 */
function seededSine(tick: number, period: number, phase = 0): number {
  return Math.sin(((tick + phase) * 2 * Math.PI) / period);
}

export function generateSimulatedSignals(tick = 0, baseTimestampMs = Date.now()): SimulatedSignals {
  const safeTick = Math.abs(Math.trunc(tick));

  // Diurnal and weekly weather patterns (period of 24 ticks representing 24h cycle)
  const rainWave = Math.max(0, seededSine(safeTick, 18, 4) * 16 + seededSine(safeTick, 7, 1) * 6);
  const rainfallMm24h = Math.round(rainWave * 10) / 10;

  // Evaporation rate peaks when rain is zero and dips during showers
  const et0 = Math.max(2.1, Math.min(6.8, 4.5 - rainWave * 0.18 + seededSine(safeTick, 12) * 0.8));

  // Yield impact estimate: correlated with water balance
  // If severe rain (>20mm) or zero rain with dry spells, yield takes a hit
  const yieldVariance = -3.5 + seededSine(safeTick, 20, 2) * 5.2 - (rainfallMm24h > 18 ? 4.0 : 0);
  const yieldImpactPercent = Math.round(yieldVariance * 10) / 10;

  return {
    tick: safeTick,
    rainfallMm24h,
    forecastWindowHours: 24,
    yieldImpactPercent,
    evapotranspirationMmDay: Math.round(et0 * 10) / 10,
    isSimulated: true,
    generatedAtMs: baseTimestampMs,
  };
}

export function formatYieldImpact(percent: number): { text: string; isPositive: boolean } {
  const sign = percent > 0 ? "+" : "";
  return {
    text: `${sign}${percent.toFixed(1)}%`,
    isPositive: percent >= 0,
  };
}
