# Mitti Sentinel 🌾🛰️
### Real IoT Soil-Moisture Telemetry × Copernicus Sentinel-2 Satellite Intelligence × Google Gemini AI Copilot

[![Tests](https://img.shields.io/badge/tests-12%20passed-success)](TESTING.md)
[![Vite](https://img.shields.io/badge/vite-8.1.5-646CFF?logo=vite)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/supabase-PostgreSQL%20%2B%20RLS-3ECF8E?logo=supabase)](https://supabase.com)
[![Copernicus](https://img.shields.io/badge/satellite-Sentinel--2%20L2A-002F6C)](https://docs.sentinel-hub.com)
[![Gemini](https://img.shields.io/badge/AI-Google%20Gemini%20Flash-4285F4?logo=google)](https://ai.google.dev)

---

## 🌍 The Vision

Most agricultural intelligence platforms suffer from a critical credibility gap: they either rely solely on distant, coarse weather forecasts, or generate opaque AI predictions ungrounded in physical reality. 

**Mitti Sentinel** closes this gap by fusing **physical ground reality with spaceborne observation**:
1. **Physical Ground Reality**: Real capacitive soil-moisture IoT telemetry measured directly at crop root depth.
2. **Spaceborne Visual Truth**: Real Copernicus Sentinel-2 multispectral satellite passes over the farmer's exact GPS plot boundary.
3. **Safety-Gated Decision Agent**: Transparent rule-based heuristic that advises—never actuates—always requiring explicit farmer review.
4. **"Ask Mitti AI" powered by Google Gemini**: Plain-language multilingual agronomic advisor in English, Hindi (हिन्दी), and Marathi (मराठी).

---

## ⚖️ The Real vs. Simulated Split (Our Truth Contract)

Judges and evaluators trust teams that are transparent about what is measured versus what is modeled. Mitti Sentinel clearly marks every data stream:

| Data Stream | Classification | Source & Protocol |
|---|---|---|
| **Soil Moisture Telemetry** | **100% REAL** | Capacitive Soil Moisture Sensor v1.2 + ESP32 microcontroller ADC (GPIO34) reporting Volumetric Water Content (VWC %) via HTTP REST / Supabase. |
| **Satellite Imagery** | **100% REAL** | Copernicus Sentinel-2 L2A high-resolution optical imagery with ~5-day orbital revisit cadence; ISRO Bhuvan Open WMS backup. |
| **Plot Coordinates** | **100% REAL** | Active plot coordinates (`19.8762° N, 75.3433° E`, Chhatrapati Sambhajinagar, Maharashtra) + multi-plot regional switcher (Nashik, Vidarbha, Pune). |
| **24h Rainfall Forecast** | **SIMULATED** | Seeded, time-varying trigonometric weather engine with diurnal oscillation (visibly tagged with amber `SIMULATED` badge). |
| **Yield Impact Estimate** | **SIMULATED** | Dynamic vegetative water deficit model (-15% to +10%) correlating soil water balance with evaporative demand. |
| **Decision Logic** | **HONEST RULE-BASED** | Transparent heuristic correlation matrix. **Not** a certified agronomy model; satellite is for visual grounding. |

---

## 🏛️ System Architecture

```
                                  ┌─────────────────────────────┐
                                  │   Copernicus Sentinel-2     │
                                  │ (True Color + NDVI Bands)   │
                                  └──────────────┬──────────────┘
                                                 │ WMS / TMS Tiles
┌─────────────────────────┐                      ▼
│  ESP32 Capacitive Node  │ ────HTTP POST───► [ Antigravity Agent Core ] ◄─── [ Google Gemini API ]
│  (Real Root Moisture)   │                      │ (Safe Correlation)            (Farmer Copilot)
└─────────────────────────┘                      │
                                                 ├──► [ Supabase PostgreSQL & RLS ]
┌─────────────────────────┐                      │
│ Seeded Weather Engine   │ ─────────────────────┘
│ (Simulated 24h Rain)    │                      ▼
└─────────────────────────┘          [ Lovable Glassmorphic Bento UI ]
                                     - Interactive Leaflet Satellite Map
                                     - Animated Radial Moisture Dial
                                     - Trilingual Recommendations (EN/HI/MR)
                                     - Failure-Path Graceful Degradation Toggle
```

---

## ✨ Key Features

- 🛰️ **Interactive Leaflet Satellite Map**: Centered on actual plot coordinates with high-resolution satellite tiles, live polygon boundaries, and a pulsating status halo (green = steady, amber = watch, red = urgent action).
- 🌿 **True-Color vs. NDVI Vegetation View**: Instant toggle between optical imagery and chlorophyll absorption false-color vegetation index.
- ⏱️ **5-Day Orbital Pass Time-Scrubber**: Slider navigating historical Sentinel-2 orbital passes (20 Oct, 25 Oct, 30 Oct, 04 Nov, 09 Nov, 14 Nov).
- 💧 **Animated Framer Motion Radial Gauge**: Easing needle dial calibrated for Volumetric Water Content (VWC 0–100%).
- 🌐 **Trilingual Farmer Accessibility**: Instant recommendation translation across English, Hindi (हिन्दी), and Marathi (मराठी).
- 🛡️ **Graceful Degradation ("Knows What It Doesn't Know")**: When sensor telemetry is stale (>15 min) or satellite data is unreachable, the agent drops confidence to **0%** and withholds recommendations instead of hallucinating.
- 💬 **Ask Mitti AI (Google Gemini Flash)**: Multilingual interactive crop copilot grounded in live sensor and satellite context.
- 🍂 **Atmospheric Ambient Animation**: Powered by the trending `falling-leaves` canvas engine with an instant demo toggle.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js 20+ / 22+
- pnpm or npm

### Installation
```bash
# Clone the repository
git clone https://github.com/ayush123141/IdeaForageHackathon.git
cd IdeaForageHackathon/demo-scope-compass

# Install dependencies
pnpm install # or npm install

# Copy environment variables
cp .env.example .env

# Start local development server
pnpm run dev # or npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🗄️ Supabase Database Setup

To provision your remote Supabase database:
1. Log in to [Supabase](https://supabase.com/dashboard) and select your project.
2. Navigate to **SQL Editor** (`>_` in the left sidebar).
3. Paste the contents of [`supabase/migrations/20261116000000_mitti_sentinel_init.sql`](supabase/migrations/20261116000000_mitti_sentinel_init.sql) and click **Run**.
4. This creates:
   - `sensor_readings` (IoT hardware stream with device index)
   - `satellite_snapshots` (Sentinel-2 passes & tile references)
   - `simulated_signals` (Rainfall forecast & yield variance)
   - `recommendations` (Decision log with farmer confirmation state)
   - Row Level Security (RLS) policies.
5. Copy your **Project URL** and **anon public key** from `Settings` $\rightarrow$ `API` into your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_GEMINI_API_KEY=your-gemini-key
   ```

---

## 🧪 Testing Suite (12 / 12 Passing)

Run the automated test suite:
```bash
npm test # or npx vitest run
```

All 12 tests pass across 2 test suites ([detailed in TESTING.md](TESTING.md)):
- ✅ **Synthetic Scenarios**: Low moisture $\rightarrow$ `irrigate_now`; High moisture + heavy rain $\rightarrow$ `protect_crop`; Moderate moisture + rain $\rightarrow$ `hold_off`; Optimal $\rightarrow$ `no_action_needed`.
- ✅ **Real Hardware Run**: Full validation of captured payload from `MITTI-ESP32-01`.
- ✅ **Graceful Failure Degradation**: Verifies 0% confidence drop when sensor is stale (>15 min) or satellite imagery is missing.
- ✅ **Mobile Viewport (375px)**: Bento grid reflow and non-blocking throttled satellite tile rendering.

---

## 📜 License
MIT License. Built for hackathon innovation.
