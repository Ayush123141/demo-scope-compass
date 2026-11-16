/**
 * Supabase Data Client for Mitti Sentinel
 *
 * Supports live PostgreSQL REST API calls to Supabase,
 * with zero external dependency bloat and graceful offline local fallback.
 */

import { type SensorReading } from "./iot-sensor";
import { type AgentRecommendation } from "./decision-agent";

const SUPABASE_URL = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_URL : "";
const SUPABASE_ANON_KEY = typeof import.meta !== "undefined" ? import.meta.env?.VITE_SUPABASE_ANON_KEY : "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

interface SupabaseResponse<T> {
  data: T | null;
  error: string | null;
}

export async function fetchLatestSensorReading(deviceId = "MITTI-ESP32-01"): Promise<SupabaseResponse<SensorReading>> {
  if (!isSupabaseConfigured) {
    return { data: null, error: "Supabase not configured, using local live engine" };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/sensor_readings?device_id=eq.${deviceId}&order=captured_at.desc&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      return { data: null, error: `Supabase HTTP ${res.status}: ${res.statusText}` };
    }

    const rows = await res.json();
    if (!rows || rows.length === 0) {
      return { data: null, error: "No records found" };
    }

    const row = rows[0];
    return {
      data: {
        device_id: row.device_id,
        moisture_percent: Number(row.moisture_percent),
        temperature_c: Number(row.temperature_c ?? 28.0),
        battery_v: Number(row.battery_v ?? 3.95),
        captured_at_ms: new Date(row.captured_at).getTime(),
        is_live: Boolean(row.is_live),
      },
      error: null,
    };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function persistSensorReading(reading: SensorReading): Promise<SupabaseResponse<{ id: string }>> {
  if (!isSupabaseConfigured) {
    return { data: null, error: "Supabase not configured, skipped remote persistence" };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sensor_readings`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        device_id: reading.device_id,
        moisture_percent: reading.moisture_percent,
        temperature_c: reading.temperature_c,
        battery_v: reading.battery_v,
        is_live: reading.is_live,
        captured_at: new Date(reading.captured_at_ms).toISOString(),
      }),
    });

    if (!res.ok) {
      return { data: null, error: `Supabase HTTP ${res.status}` };
    }

    const rows = await res.json();
    return { data: { id: rows[0]?.id }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function confirmRecommendationInSupabase(recommendationId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !recommendationId) return false;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/recommendations?id=eq.${recommendationId}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
