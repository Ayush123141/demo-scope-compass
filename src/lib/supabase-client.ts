/**
 * Supabase Data & Auth Client for Mitti Sentinel
 *
 * Provides real PostgreSQL queries, Supabase Auth (Magic Link, Email/Password, Sessions),
 * Realtime subscriptions on IoT telemetry, and graceful offline fallback.
 */

import { supabase, isSupabaseConfigured } from "./supabase";
import { type SensorReading } from "./iot-sensor";
import { type AgentRecommendation } from "./decision-agent";
import type { Session, User } from "@supabase/supabase-js";

export { supabase, isSupabaseConfigured };

export interface SupabaseResponse<T> {
  data: T | null;
  error: string | null;
}

export interface FarmerProfile {
  id: string;
  name: string;
  kisanId: string;
  email?: string;
  mobile?: string;
  deviceId: string;
  isGuest: boolean;
}

export const DEFAULT_GUEST_FARMER: FarmerProfile = {
  id: "guest-ramesh-patil",
  name: "Ramesh Patil",
  kisanId: "MH-FAR-4192",
  email: "ramesh.patil.kisan@gov.in",
  mobile: "+91 98221 44021",
  deviceId: "MITTI-ESP32-01",
  isGuest: true,
};

// ==========================================
// 1. SUPABASE AUTHENTICATION HELPERS
// ==========================================

export async function getCurrentFarmerSession(): Promise<{ user: User | null; session: Session | null }> {
  if (!isSupabaseConfigured) {
    return { user: null, session: null };
  }
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      return { user: null, session: null };
    }
    return { user: data.session.user, session: data.session };
  } catch {
    return { user: null, session: null };
  }
}

export async function signInWithMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase credentials not configured in .env" };
  }
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function signInWithPassword(email: string, password: string): Promise<{ user: User | null; error?: string }> {
  if (!isSupabaseConfigured) {
    return { user: null, error: "Supabase not configured" };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: undefined };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function signUpWithEmail(email: string, password: string, name: string, kisanId: string): Promise<{ user: User | null; error?: string }> {
  if (!isSupabaseConfigured) {
    return { user: null, error: "Supabase not configured" };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          kisan_id: kisanId,
        },
      },
    });
    if (error) return { user: null, error: error.message };
    return { user: data.user, error: undefined };
  } catch (err) {
    return { user: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function signOutFarmer(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("Sign out error:", err);
  }
}

// ==========================================
// 2. IOT TELEMETRY DATABASE OPERATIONS
// ==========================================

export async function fetchLatestSensorReading(deviceId = "MITTI-ESP32-01"): Promise<SupabaseResponse<SensorReading>> {
  if (!isSupabaseConfigured) {
    return { data: null, error: "Supabase not configured, using local live engine" };
  }

  try {
    const { data, error } = await supabase
      .from("sensor_readings")
      .select("*")
      .eq("device_id", deviceId)
      .order("captured_at", { ascending: false })
      .limit(1);

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: null, error: "No records found" };
    }

    const row = data[0];
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

export async function fetchSensorHistory(deviceId = "MITTI-ESP32-01", limit = 12): Promise<SensorReading[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from("sensor_readings")
      .select("*")
      .eq("device_id", deviceId)
      .order("captured_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];

    return data.map((row) => ({
      device_id: row.device_id,
      moisture_percent: Number(row.moisture_percent),
      temperature_c: Number(row.temperature_c ?? 28.0),
      battery_v: Number(row.battery_v ?? 3.95),
      captured_at_ms: new Date(row.captured_at).getTime(),
      is_live: Boolean(row.is_live),
    })).reverse();
  } catch {
    return [];
  }
}

export async function persistSensorReading(reading: SensorReading): Promise<SupabaseResponse<{ id: string }>> {
  if (!isSupabaseConfigured) {
    return { data: null, error: "Supabase not configured, skipped remote persistence" };
  }

  try {
    const { data, error } = await supabase
      .from("sensor_readings")
      .insert({
        device_id: reading.device_id,
        moisture_percent: reading.moisture_percent,
        temperature_c: reading.temperature_c,
        battery_v: reading.battery_v,
        is_live: reading.is_live,
        captured_at: new Date(reading.captured_at_ms).toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: { id: data.id }, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

// ==========================================
// 3. RECOMMENDATIONS & DECISION AUDIT TRAIL
// ==========================================

export interface PersistedRecommendation {
  id: string;
  action: string;
  confidence_percent: number;
  reason_en: string;
  reason_hi: string;
  reason_mr: string;
  source_label: string;
  confirmed: boolean;
  confirmed_at: string | null;
  created_at: string;
}

export async function fetchRecentRecommendations(limit = 6): Promise<PersistedRecommendation[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from("recommendations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as PersistedRecommendation[];
  } catch {
    return [];
  }
}

export async function saveRecommendationToSupabase(
  rec: AgentRecommendation,
  sensorReadingId?: string
): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from("recommendations")
      .insert({
        action: rec.action,
        confidence_percent: rec.confidencePercent,
        reason_en: rec.copy.en.reason,
        reason_hi: rec.copy.hi.reason,
        reason_mr: rec.copy.mr.reason,
        source_label: rec.sourceLabel,
        sensor_reading_id: sensorReadingId || null,
        confirmed: false,
      })
      .select("id")
      .single();

    if (error || !data) return null;
    return data.id;
  } catch {
    return null;
  }
}

export async function confirmRecommendationInSupabase(recommendationId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !recommendationId) return false;

  try {
    const { error } = await supabase
      .from("recommendations")
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", recommendationId);

    return !error;
  } catch {
    return false;
  }
}
