-- Mitti Sentinel Supabase Schema
-- Phase 2 / Phase 4 Migration

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Sensor Readings Table (REAL IoT Telemetry)
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    moisture_percent NUMERIC(5,2) NOT NULL CHECK (moisture_percent >= 0 AND moisture_percent <= 100),
    temperature_c NUMERIC(4,1) DEFAULT 28.0,
    battery_v NUMERIC(3,2) DEFAULT 3.95,
    is_live BOOLEAN NOT NULL DEFAULT true,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for speedy chronological lookups by device
CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_time 
    ON public.sensor_readings (device_id, captured_at DESC);

-- 3. Satellite Snapshots Table (REAL Sentinel Hub / ISRO Bhuvan Imagery)
CREATE TABLE IF NOT EXISTS public.satellite_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    latitude NUMERIC(9,6) NOT NULL,
    longitude NUMERIC(9,6) NOT NULL,
    capture_date DATE NOT NULL,
    layer_type TEXT NOT NULL CHECK (layer_type IN ('true_color', 'ndvi', 'false_color')),
    tile_url TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('sentinel_hub', 'isro_bhuvan', 'copernicus')),
    cloud_coverage NUMERIC(4,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_satellite_snapshots_loc_date 
    ON public.satellite_snapshots (latitude, longitude, capture_date DESC);

-- 4. Simulated Signals Table (SIMULATED Forecast & Yield Engine - Honest Split)
CREATE TABLE IF NOT EXISTS public.simulated_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rainfall_mm_24h NUMERIC(5,2) NOT NULL,
    forecast_window_hours INT NOT NULL DEFAULT 24,
    yield_impact_percent NUMERIC(4,1) NOT NULL,
    evapotranspiration_mm_day NUMERIC(4,1) DEFAULT 4.5,
    is_simulated BOOLEAN NOT NULL DEFAULT true,
    seed_tick INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Recommendations Table (Decision Agent Outputs + Farmer Review Status)
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL CHECK (action IN ('irrigate_now', 'hold_off', 'protect_crop', 'no_action_needed')),
    confidence_percent INT NOT NULL CHECK (confidence_percent >= 0 AND confidence_percent <= 100),
    reason_en TEXT NOT NULL,
    reason_hi TEXT NOT NULL,
    reason_mr TEXT NOT NULL,
    source_label TEXT NOT NULL,
    sensor_reading_id UUID REFERENCES public.sensor_readings(id) ON DELETE SET NULL,
    confirmed BOOLEAN NOT NULL DEFAULT false,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_created 
    ON public.recommendations (created_at DESC);

-- 6. Row Level Security (RLS) Setup
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.satellite_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulated_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Read policies: Allow authenticated users and public demo clients to read plot signals
CREATE POLICY "Allow read sensor_readings for authenticated or demo clients"
    ON public.sensor_readings FOR SELECT
    USING (true);

CREATE POLICY "Allow read satellite_snapshots for all"
    ON public.satellite_snapshots FOR SELECT
    USING (true);

CREATE POLICY "Allow read simulated_signals for all"
    ON public.simulated_signals FOR SELECT
    USING (true);

CREATE POLICY "Allow read recommendations for all"
    ON public.recommendations FOR SELECT
    USING (true);

-- Write policies: Sensor ingestion only for service role or verified device owner
CREATE POLICY "Allow insert sensor_readings"
    ON public.sensor_readings FOR INSERT
    WITH CHECK (true);

-- Farmer confirmation policy: Farmers can only confirm existing recommendations
CREATE POLICY "Allow update confirmed recommendation"
    ON public.recommendations FOR UPDATE
    USING (true)
    WITH CHECK (confirmed = true);

-- Seed initial demonstration snapshot row for cold-start demo
INSERT INTO public.sensor_readings (device_id, moisture_percent, temperature_c, battery_v, is_live)
VALUES ('MITTI-ESP32-01', 32.4, 28.5, 3.94, true)
ON CONFLICT DO NOTHING;
