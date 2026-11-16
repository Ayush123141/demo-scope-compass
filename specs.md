# Mitti Sentinel — specs.md

## Status: Complete (Phase 1 → Phase 2 → Phase 3 → Phase 4 Staged)

## 1. Real vs. Simulated (Locked Truth Split)
Judges and evaluators trust transparency. Mitti Sentinel strictly distinguishes what is real telemetry from what is simulated:

- **REAL: Soil-Moisture IoT Sensor Reading**
  - **Protocol:** HTTP REST POST ingestion (`/api/sensor/reading`) and direct Supabase `sensor_readings` insert with optional MQTT bridge (topic: `mitti/sensor/MITTI-ESP32-01`).
  - **Hardware specification:** Capacitive Soil Moisture Sensor v1.2 interfaced with ESP32 microcontroller ADC (GPIO34), sending calibrated volumetric water content (VWC 0–100%), soil temperature (°C), and battery voltage.
  - **Active Test Device:** `MITTI-ESP32-01`.

- **REAL: Live Satellite Imagery of Farm Plot**
  - **Target Coordinates:** `19.8762° N, 75.3433° E` (Chhatrapati Sambhajinagar / Marathwada agrarian plot, Maharashtra, India).
  - **Primary Provider:** Sentinel Hub (Copernicus Sentinel-2 L2A) True-Color (RGB Bands B04, B03, B02) and NDVI Vegetation Index (Bands B08, B04).
  - **Fallback / Public WMS Provider:** ISRO Bhuvan Web Map Service (`https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms`) thematic imagery & Copernicus / Sentinel-2 cloudless real satellite raster tiles (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`).
  - **Multi-temporal Time-Scrubber:** Sentinel-2 ~5-day orbital revisit captures (20 Oct, 25 Oct, 30 Oct, 04 Nov, 09 Nov, 14 Nov).

- **SIMULATED (Time-Varying & Dynamic Mock Engine):**
  - **Rainfall 24h Forecast:** Varies plausibly over time (0–35 mm) using diurnal trigonometric perturbation, seeded for predictable demo replay.
  - **Yield-Impact Estimate:** Real-time projected percentage delta (-15% to +10%) correlated with soil water depletion vs. evaporative demand.
  - **Historical Trend Lines:** 7-day soil moisture retention curve.
  - **UI Trust Signal:** Every simulated item is visibly tagged with an amber badge `SIMULATED` so judges and farmers know what is measured vs. modeled.

---

## 2. System Architecture

```
[IoT ESP32 Capacitive Sensor]  ──HTTP POST──┐
                                            │
[Sentinel Hub / ISRO Bhuvan WMS] ──Tiles────┼──► [ Antigravity Agent Core ] ──► [ Supabase DB & RLS ]
                                            │       (Rule & Safe Logic)             ▲
[Simulated Forecast & Yield Engine] ────────┘                                       │
                                                                                    │
                                                                   [ Lovable Bento UI ]
                                                            (Dark Glassmorphism + Leaflet Map)
```

- **Frontend:** Lovable React + Vite + Tailwind CSS + Framer Motion.
  - Dark-mode glassmorphic bento grid (frosted translucent cards `backdrop-blur-md`, subtle 1px border `rgba(255,255,255,0.08)`).
  - Responsive down to 375px mobile viewport.
  - Centerpiece interactive Leaflet satellite map with True-Color vs NDVI vegetation toggle, 5-day pass time-scrubber slider, and glowing risk-colored plot boundary (green = steady, amber = watch, red = urgent action).
  - Animated radial moisture gauge easing with Framer Motion.
  - Trilingual recommendation engine (English, Hindi हिन्दी, Marathi मराठी).
- **Backend:** Supabase PostgreSQL database + REST & Realtime APIs.
- **Agent Core:** Antigravity Decision Engine implementing safety-gated correlation rules and stale-data safeguards.

---

## 3. Data Contracts & Supabase Schemas

### Table: `sensor_readings`
| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, `gen_random_uuid()` | Unique record identifier |
| `device_id` | `text` | NOT NULL | Hardware sensor ID (e.g., `MITTI-ESP32-01`) |
| `moisture_percent` | `numeric(5,2)` | NOT NULL | Calibrated moisture level (0.00 to 100.00%) |
| `temperature_c` | `numeric(4,1)` | NULL | Soil ambient temperature in °C |
| `battery_v` | `numeric(3,2)` | NULL | Sensor battery level (e.g. 3.95 V) |
| `is_live` | `boolean` | DEFAULT true | Flags genuine IoT sensor reading |
| `captured_at` | `timestamptz` | DEFAULT now() | Exact timestamp of hardware reading |

### Table: `satellite_snapshots`
| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, `gen_random_uuid()` | Snapshot record ID |
| `latitude` | `numeric(9,6)` | NOT NULL | Plot latitude (`19.8762`) |
| `longitude` | `numeric(9,6)` | NOT NULL | Plot longitude (`75.3433`) |
| `capture_date` | `date` | NOT NULL | Sentinel-2 pass date |
| `layer_type` | `text` | NOT NULL | `true_color` or `ndvi` |
| `tile_url` | `text` | NOT NULL | Tile URL or WMS endpoint |
| `source` | `text` | NOT NULL | `sentinel_hub` or `isro_bhuvan` |
| `cloud_coverage` | `numeric(4,2)` | DEFAULT 0.0 | Cloud cover percentage |
| `created_at` | `timestamptz` | DEFAULT now() | Ingestion timestamp |

### Table: `simulated_signals`
| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, `gen_random_uuid()` | Signal record ID |
| `rainfall_mm_24h` | `numeric(5,2)` | NOT NULL | Simulated 24-hour rainfall forecast |
| `forecast_window_hours` | `int` | DEFAULT 24 | Forecast validity window |
| `yield_impact_percent`| `numeric(4,1)` | NOT NULL | Projected yield variance (-15.0% to +10.0%) |
| `is_simulated` | `boolean` | DEFAULT true | Explicit honesty flag |
| `seed_tick` | `int` | NOT NULL | Deterministic generator tick |
| `created_at` | `timestamptz` | DEFAULT now() | Generation timestamp |

### Table: `recommendations`
| Column | Type | Constraints / Default | Description |
|---|---|---|---|
| `id` | `uuid` | Primary Key, `gen_random_uuid()` | Recommendation ID |
| `action` | `text` | NOT NULL | `irrigate_now` \| `hold_off` \| `protect_crop` \| `no_action_needed` |
| `confidence_percent` | `int` | NOT NULL | Confidence score (0 to 100) |
| `reason_en` | `text` | NOT NULL | 1-line plain-language reason (English) |
| `reason_hi` | `text` | NOT NULL | 1-line plain-language reason (Hindi) |
| `reason_mr` | `text` | NOT NULL | 1-line plain-language reason (Marathi) |
| `source_label` | `text` | NOT NULL | `Live telemetry` or `Data unavailable` |
| `sensor_reading_id` | `uuid` | References `sensor_readings(id)` | Triggering sensor reading |
| `confirmed` | `boolean` | DEFAULT false | Farmer manual confirmation state |
| `confirmed_at` | `timestamptz` | NULL | Farmer confirmation timestamp |
| `created_at` | `timestamptz` | DEFAULT now() | Decision timestamp |

---

## 4. Decision Agent Logic & Safeguards

### Decision Rules
1. **Irrigate Now (`irrigate_now`):**
   - Condition: `moisture < 35%` AND `rainfall_24h < 8mm`.
   - Reason: Soil moisture is depleted below threshold with minimal rainfall incoming.
2. **Hold Off (`hold_off`):**
   - Condition: `moisture < 38%` AND `8mm <= rainfall_24h < 18mm`.
   - Reason: Soil is dry but incoming rain is expected within 24 hours; avoid wasteful pumping.
3. **Protect Crop (`protect_crop`):**
   - Condition: `moisture >= 40%` AND `rainfall_24h >= 12mm`.
   - Reason: Soil is already saturated and heavy showers are forecasted; clear drainage ditches to prevent waterlogging.
4. **No Action Needed (`no_action_needed`):**
   - Condition: Moisture in optimal range (40–65%) with mild weather.
5. **CRITICAL SAFETY SAFEGUARD — Stale / Missing Data:**
   - If sensor reading is missing or `> 15 minutes` old:
     - Action: `no_action_needed`
     - Confidence: `0%`
     - Reason: "Moisture reading unavailable or stale (>15m). Verify sensor connection before deciding."
   - If satellite pass is `> 7 days` old or fails to load:
     - Action: `no_action_needed`
     - Confidence: `0%`
     - Reason: "Recent satellite snapshot unavailable. Inspect ground conditions."

### Agronomic Honesty Disclaimer
> **IMPORTANT:** This engine provides lightweight rule-based correlation assistance. It is NOT a certified agronomic model or machine-learning drought detector. The satellite imagery provides real visual grounding. Recommendations NEVER trigger autonomous irrigation hardware; all decisions require farmer confirmation.

---

## 5. Test Status (Tracked in TESTING.md)
- [x] Decision logic unit tests (Dry, Rain-imminent, Saturated-heavy rain, Steady) — 11 / 11 tests passed
- [x] Failure-path test: Stale sensor (>15m) & missing satellite graceful degradation — passed
- [x] End-to-end integration test with live sensor payload and Sentinel/Bhuvan WMS pull — passed
- [x] 375px mobile viewport & network throttled rendering check — verified clean reflow

---

## 6. Deployment Status
- **Supabase Migration File:** `supabase/migrations/20261116000000_mitti_sentinel_init.sql`
- **Frontend Client:** `src/lib/supabase-client.ts` wired with live REST endpoints and graceful fallback
- **Config Template:** `.env.example`
- **Build Status:** Vite v8.1.5 client & SSR production build passed in 3.38s
