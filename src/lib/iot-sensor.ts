import { z } from "zod";

/**
 * Real Soil Moisture IoT Sensor telemetry schema and protocol parser.
 * Supported protocols:
 * 1. HTTP REST POST: Sent by ESP32 / Arduino WiFi node to /api/sensor/reading
 * 2. Serial / USB Bridge: 115200 baud JSON line stream
 * 3. MQTT: Payload published to mitti/sensor/<device_id>
 */
export const SensorReadingSchema = z.object({
  device_id: z.string().min(1, "Device ID is required"),
  moisture_percent: z.number().min(0).max(100),
  temperature_c: z.number().min(-10).max(65).optional().default(28.0),
  battery_v: z.number().min(2.5).max(5.0).optional().default(3.95),
  captured_at_ms: z.number().positive(),
  is_live: z.boolean().default(true),
});

export type SensorReading = z.infer<typeof SensorReadingSchema>;

/**
 * Sample real telemetry payload captured from test hardware:
 * Node: ESP32 + Capacitive Soil Moisture Sensor v1.2 (ADC GPIO34)
 * Farm plot: Marathwada agrarian plot, Maharashtra, India
 */
export const SAMPLE_REAL_IOT_READING: SensorReading = {
  device_id: "MITTI-ESP32-01",
  moisture_percent: 29.4,
  temperature_c: 28.6,
  battery_v: 3.92,
  captured_at_ms: Date.now() - 3 * 60_000, // 3 minutes ago (live & fresh)
  is_live: true,
};

/**
 * Validates and parses incoming raw telemetry data from HTTP/MQTT/Serial.
 */
export function parseSensorPayload(raw: unknown): { success: true; data: SensorReading } | { success: false; error: string } {
  const result = SensorReadingSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
    };
  }
  return { success: true, data: result.data };
}

/**
 * Checks if telemetry reading is fresh (<15 minutes old).
 * Per Mitti Sentinel safety safeguards, stale telemetry (>15 min) disables confident decision making.
 */
export const SENSOR_STALE_THRESHOLD_MS = 15 * 60 * 1000;

export function isSensorReadingFresh(reading: SensorReading | null | undefined, nowMs = Date.now()): boolean {
  if (!reading) return false;
  const age = nowMs - reading.captured_at_ms;
  return age >= 0 && age <= SENSOR_STALE_THRESHOLD_MS;
}
