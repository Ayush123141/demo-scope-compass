import { describe, expect, it } from "vitest";
import {
  evaluateFieldConditions,
  type DecisionAgentInputs,
} from "../lib/decision-agent";
import {
  SAMPLE_REAL_IOT_READING,
  parseSensorPayload,
  type SensorReading,
} from "../lib/iot-sensor";
import {
  TARGET_FARM_PLOT,
  SATELLITE_PASS_HISTORY,
  type SatellitePass,
} from "../lib/satellite-service";
import {
  generateSimulatedSignals,
  type SimulatedSignals,
} from "../lib/simulated-engine";

describe("Mitti Sentinel — Phase 3 Test Suite", () => {
  const baseNowMs = Date.UTC(2026, 10, 16, 8, 0, 0);

  const freshSatellitePass: SatellitePass = {
    ...SATELLITE_PASS_HISTORY[SATELLITE_PASS_HISTORY.length - 1]!,
    timestampMs: baseNowMs - 2 * 24 * 60 * 60 * 1000, // 2 days ago (fresh, <7 days)
    available: true,
  };

  // =========================================================================
  // (a) Unit tests for decision logic across synthetic scenarios
  // =========================================================================
  describe("(a) Decision Logic Rules Across Synthetic Scenarios", () => {
    it("low moisture (<35%) + dry forecast (<8mm) → triggers irrigate_now", () => {
      const sensor: SensorReading = {
        device_id: "MITTI-ESP32-01",
        moisture_percent: 26.5,
        temperature_c: 30.2,
        battery_v: 3.91,
        captured_at_ms: baseNowMs - 4 * 60_000,
        is_live: true,
      };

      const forecast: SimulatedSignals = {
        tick: 0,
        rainfallMm24h: 1.2,
        forecastWindowHours: 24,
        yieldImpactPercent: -6.4,
        evapotranspirationMmDay: 5.2,
        isSimulated: true,
        generatedAtMs: baseNowMs,
      };

      const result = evaluateFieldConditions({
        sensor,
        satellite: freshSatellitePass,
        forecast,
        nowMs: baseNowMs,
      });

      expect(result.action).toBe("irrigate_now");
      expect(result.confidencePercent).toBeGreaterThanOrEqual(75);
      expect(result.sourceLabel).toBe("Live telemetry");
      expect(result.copy.en.title).toBe("Irrigate Now");
      expect(result.copy.hi.title).toContain("सिंचाई");
      expect(result.copy.mr.title).toContain("पाणी");
    });

    it("adequate moisture (>=40%) + simulated heavy rain (>=12mm) → triggers protect_crop", () => {
      const sensor: SensorReading = {
        device_id: "MITTI-ESP32-01",
        moisture_percent: 45.0,
        temperature_c: 24.5,
        battery_v: 3.94,
        captured_at_ms: baseNowMs - 5 * 60_000,
        is_live: true,
      };

      const forecast: SimulatedSignals = {
        tick: 1,
        rainfallMm24h: 22.5,
        forecastWindowHours: 24,
        yieldImpactPercent: -2.1,
        evapotranspirationMmDay: 2.3,
        isSimulated: true,
        generatedAtMs: baseNowMs,
      };

      const result = evaluateFieldConditions({
        sensor,
        satellite: freshSatellitePass,
        forecast,
        nowMs: baseNowMs,
      });

      expect(result.action).toBe("protect_crop");
      expect(result.confidencePercent).toBeGreaterThanOrEqual(70);
      expect(result.copy.en.reason).toContain("drainage");
      expect(result.copy.hi.reason).toContain("जलभराव");
      expect(result.copy.mr.reason).toContain("चर मोकळे ठेवा");
    });

    it("depleted moisture (<38%) + approaching moderate rain (>=8mm & <18mm) → triggers hold_off", () => {
      const sensor: SensorReading = {
        device_id: "MITTI-ESP32-01",
        moisture_percent: 33.0,
        temperature_c: 28.0,
        battery_v: 3.93,
        captured_at_ms: baseNowMs - 3 * 60_000,
        is_live: true,
      };

      const forecast: SimulatedSignals = {
        tick: 2,
        rainfallMm24h: 11.0,
        forecastWindowHours: 24,
        yieldImpactPercent: 1.5,
        evapotranspirationMmDay: 3.8,
        isSimulated: true,
        generatedAtMs: baseNowMs,
      };

      const result = evaluateFieldConditions({
        sensor,
        satellite: freshSatellitePass,
        forecast,
        nowMs: baseNowMs,
      });

      expect(result.action).toBe("hold_off");
      expect(result.confidencePercent).toBe(78);
      expect(result.copy.en.title).toBe("Hold Off Irrigation");
    });

    it("optimal moisture (48%) + mild weather (2mm rain) → triggers no_action_needed", () => {
      const sensor: SensorReading = {
        device_id: "MITTI-ESP32-01",
        moisture_percent: 48.0,
        temperature_c: 27.5,
        battery_v: 3.96,
        captured_at_ms: baseNowMs - 2 * 60_000,
        is_live: true,
      };

      const forecast: SimulatedSignals = {
        tick: 3,
        rainfallMm24h: 2.0,
        forecastWindowHours: 24,
        yieldImpactPercent: 4.2,
        evapotranspirationMmDay: 4.1,
        isSimulated: true,
        generatedAtMs: baseNowMs,
      };

      const result = evaluateFieldConditions({
        sensor,
        satellite: freshSatellitePass,
        forecast,
        nowMs: baseNowMs,
      });

      expect(result.action).toBe("no_action_needed");
      expect(result.confidencePercent).toBe(88);
      expect(result.copy.en.title).toBe("Optimal Conditions");
    });
  });

  // =========================================================================
  // (b) End-to-end run with real captured sensor reading + real satellite plot
  // =========================================================================
  describe("(b) End-to-End Real Telemetry Ingestion Run", () => {
    it("successfully evaluates real ESP32 capacitive reading on real plot coordinates", () => {
      // Validate real payload schema
      const parsed = parseSensorPayload(SAMPLE_REAL_IOT_READING);
      expect(parsed.success).toBe(true);

      const realSensor = (parsed as { success: true; data: SensorReading }).data;
      expect(realSensor.device_id).toBe("MITTI-ESP32-01");
      expect(realSensor.is_live).toBe(true);

      // Verify real plot coordinates
      expect(TARGET_FARM_PLOT.latitude).toBeCloseTo(19.8762, 4);
      expect(TARGET_FARM_PLOT.longitude).toBeCloseTo(75.3433, 4);
      expect(TARGET_FARM_PLOT.boundaryPolygon.length).toBe(4);

      // Verify Sentinel-2 orbital revisit pass
      const latestPass = SATELLITE_PASS_HISTORY[SATELLITE_PASS_HISTORY.length - 1]!;
      expect(latestPass.source).toBe("sentinel_hub");
      expect(latestPass.cloudCoverPercent).toBeLessThan(10);

      // End-to-end decision agent run
      const forecast = generateSimulatedSignals(0, baseNowMs);
      const decision = evaluateFieldConditions({
        sensor: { ...realSensor, captured_at_ms: baseNowMs - 60_000 },
        satellite: { ...latestPass, timestampMs: baseNowMs - 86400_000 },
        forecast,
        nowMs: baseNowMs,
      });

      expect(decision).toBeDefined();
      expect(decision.confidencePercent).toBeGreaterThan(0);
      expect(decision.sourceLabel).toBe("Live telemetry");
      expect(decision.confirmed).toBe(false); // Farmer confirmation required
    });
  });

  // =========================================================================
  // (c) Failure-path test: Graceful Degradation ("Data Unavailable")
  // =========================================================================
  describe("(c) Failure-Path & Graceful Degradation (Knows What It Doesn't Know)", () => {
    const validForecast = generateSimulatedSignals(0, baseNowMs);

    it("sensor goes offline (null) → flags Data unavailable with 0% confidence", () => {
      const result = evaluateFieldConditions({
        sensor: null,
        satellite: freshSatellitePass,
        forecast: validForecast,
        nowMs: baseNowMs,
      });

      expect(result.action).toBe("no_action_needed");
      expect(result.confidencePercent).toBe(0);
      expect(result.sourceLabel).toBe("Data unavailable");
      expect(result.copy.en.title).toContain("Sensor Offline");
      expect(result.copy.en.reason).toContain("withholding recommendations");
    });

    it("sensor telemetry is stale (>15 minutes old) → flags Data unavailable with 0% confidence", () => {
      const staleSensor: SensorReading = {
        device_id: "MITTI-ESP32-01",
        moisture_percent: 22.0, // critically dry, but data is stale!
        temperature_c: 32.0,
        battery_v: 3.88,
        captured_at_ms: baseNowMs - 16 * 60_000, // 16 minutes old (> 15 min threshold)
        is_live: true,
      };

      const result = evaluateFieldConditions({
        sensor: staleSensor,
        satellite: freshSatellitePass,
        forecast: validForecast,
        nowMs: baseNowMs,
      });

      expect(result.action).toBe("no_action_needed");
      expect(result.confidencePercent).toBe(0);
      expect(result.sourceLabel).toBe("Data unavailable");
      expect(result.copy.en.title).toContain("Sensor Offline");
    });

    it("satellite API call fails / image unavailable → flags Data unavailable with 0% confidence", () => {
      const freshSensor: SensorReading = {
        device_id: "MITTI-ESP32-01",
        moisture_percent: 28.0,
        temperature_c: 29.0,
        battery_v: 3.92,
        captured_at_ms: baseNowMs - 2 * 60_000,
        is_live: true,
      };

      const result = evaluateFieldConditions({
        sensor: freshSensor,
        satellite: null, // Satellite service timed out or unavailable
        forecast: validForecast,
        nowMs: baseNowMs,
      });

      expect(result.action).toBe("no_action_needed");
      expect(result.confidencePercent).toBe(0);
      expect(result.sourceLabel).toBe("Data unavailable");
      expect(result.copy.en.title).toContain("Satellite Imagery Unavailable");
    });

    it("satellite pass is older than 7 days → flags Data unavailable with 0% confidence", () => {
      const freshSensor: SensorReading = {
        device_id: "MITTI-ESP32-01",
        moisture_percent: 28.0,
        temperature_c: 29.0,
        battery_v: 3.92,
        captured_at_ms: baseNowMs - 2 * 60_000,
        is_live: true,
      };

      const staleSatellite: SatellitePass = {
        ...freshSatellitePass,
        timestampMs: baseNowMs - 8 * 24 * 60 * 60 * 1000, // 8 days old (> 7 days)
      };

      const result = evaluateFieldConditions({
        sensor: freshSensor,
        satellite: staleSatellite,
        forecast: validForecast,
        nowMs: baseNowMs,
      });

      expect(result.action).toBe("no_action_needed");
      expect(result.confidencePercent).toBe(0);
      expect(result.sourceLabel).toBe("Data unavailable");
    });

    it("forecast signal missing → flags Data unavailable with 0% confidence", () => {
      const freshSensor: SensorReading = {
        device_id: "MITTI-ESP32-01",
        moisture_percent: 28.0,
        temperature_c: 29.0,
        battery_v: 3.92,
        captured_at_ms: baseNowMs - 2 * 60_000,
        is_live: true,
      };

      const result = evaluateFieldConditions({
        sensor: freshSensor,
        satellite: freshSatellitePass,
        forecast: null,
        nowMs: baseNowMs,
      });

      expect(result.action).toBe("no_action_needed");
      expect(result.confidencePercent).toBe(0);
      expect(result.sourceLabel).toBe("Data unavailable");
      expect(result.copy.en.title).toContain("Forecast Signal Missing");
    });
  });

  // =========================================================================
  // Telemetry Ingestion Payload Robustness
  // =========================================================================
  describe("Telemetry Ingestion Payload Robustness", () => {
    it("rejects invalid or corrupted sensor payload", () => {
      const corruptPayload = {
        device_id: "",
        moisture_percent: 150, // impossible > 100%
      };
      const result = parseSensorPayload(corruptPayload);
      expect(result.success).toBe(false);
    });
  });
});
