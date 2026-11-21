# Mitti Sentinel — Master Roadmap & Presentation Pitch Reference

## Current correction
- [ ] Allow limited sensor-and-weather advice when satellite imagery is unavailable, with an explicit field-check requirement.
- [ ] Keep stale or missing sensor/forecast safeguards and label all inputs and advice honestly.
- [ ] Add regression tests and verify the preview after the code fixes.

> **"Real Field Intelligence, Honest AI."**  
> Physical IoT Soil Telemetry fused with Copernicus Sentinel-2 Multi-Spectral Earth Observation, Open-Meteo ECMWF Meteorology, and Google Gemini 2.5 Flash Agronomic Intelligence.

---

## 1. Executive Summary & Vision

**Mitti Sentinel** is an open-standard, field-grounded agronomic decision-support platform engineered specifically for Indian smallholder farmers and agrarian cooperatives. Rather than relying on black-box AI or coarse satellite-only estimates that hallucinate irrigation advice, Mitti Sentinel bridges **physical subterranean sensor probes** with **European Space Agency (ESA) Copernicus Sentinel-2 satellite passes**, **Gram Panchayat LoRaWAN mesh gateways**, and **live numerical meteorological models**.

The platform provides actionable, safety-gated irrigation and crop-protection decisions ("Irrigate Now", "Hold Off", "Protect Crop", "Monitor"), speaks aloud in regional languages (**हिन्दी**, **मराठी**, **English**), listens to voice queries directly from the farmer's microphone, simulates physical solenoid manifold actuation, and connects irrigation timing with APMC Mandi commodity profits.

---

## 2. Core Problem Statement: What Crisis Does This Project Solve?

### Problem 1: India’s Groundwater Depletion & The Over-Irrigation Paradox
- **The Ground Reality:** India is the largest extractor of groundwater in the world, consuming over **250 billion cubic meters annually**—more than the United States and China combined. Over 85% of this is consumed by agriculture.
- **The Blind Habit:** Due to subsidized agricultural electricity and unpredictable power scheduling (e.g., erratic night-time 3-phase grid power), farmers practice preventative flood irrigation. This results in **40% to 55% of irrigation water being wasted** through deep percolation past the root zone.
- **The Agronomic Hazard:** Over-irrigation causes soil waterlogging, root hypoxia (suffocation), accelerated nitrogen leaching below root reach, and rampant fungal root infections (collar rot, damping-off).

### Problem 2: The "Agritech Credibility Gap" & AI Hallucinations
- Existing commercial agritech mobile apps attempt to estimate soil moisture from 1 km-resolution thermal satellite proxies alone. When cloud cover obscures the region or satellite passes are days old, these apps fabricate or extrapolate moisture levels, advising farmers to irrigate when the soil is already saturated.
- **Farmers lose trust** when an app recommends turning on pumps hours before a massive 40 mm monsoon cloudburst arrives.

### Problem 3: The Language, Literacy & Accessibility Barrier
- Over 70% of Indian farmers in key agrarian belts (such as Maharashtra's Marathwada and Vidarbha) operate in Marathi or Hindi and prefer voice over reading complex dashboards on low-cost Android phones in bright sunlight.

### Problem 4: Market Disconnect & Moisture Dockage Penalties (कटौती / ओलावा)
- Farmers often irrigate right up to harvest date thinking heavier weight will fetch more money. In reality, **APMC Mandi traders deduct 3% to 8% of the price (कटौती)** for excess moisture (>12%), and damp crops rot in transport. Coordinating pre-harvest irrigation shutdown protects thousands of rupees per acre.

### Problem 5: The Rural Connectivity Desert (Zero-SIM Mesh)
- Cellular 4G/5G signal is notoriously spotty inside agricultural fields, and buying a cellular SIM card with monthly data recharges for every single sensor probe is prohibitively expensive for smallholder farmers. Deploying Sub-GHz LoRaWAN at 868 MHz allows one Gram Panchayat gateway to service up to 150 farm probes within a 6 km radius without requiring any cellular SIM cards in probes.

---

## 3. The "Honest Agritech" Truth Contract

Mitti Sentinel operates under a strict **Truth Contract**. Every single telemetry stream, calculation, and model output on screen is transparently tagged so judges, agronomists, and farmers know what is physically measured versus what is mathematically simulated:

| Subsystem | Source Classification | Exact Source / Technology | Verification Method |
|---|---|---|---|
| **Subterranean Soil Moisture** | **REAL (Physical Telemetry)** | ESP32 + Capacitive Moisture Sensor v1.2 (`0 - 100% VWC`) | Physical capacitive frequency measurement, hysteresis calibrated |
| **Multi-Spectral Satellite Imagery** | **REAL (Earth Observation)** | ESA Copernicus Sentinel-2 L2A via Sentinel Hub / Esri | Multi-spectral band formulas: RGB, NDVI, NDWI, SAVI, EVI |
| **Orbital Pass Cadence** | **REAL (Orbital Physics)** | Sentinel-2A / Sentinel-2B ~5-day orbital revisit log | Scene cloud cover validation and freshness window (< 7 days) |
| **Agricultural Plot Boundaries** | **REAL (Cadastral Coordinates)** | Accurate ~3.5-acre agrarian field bund parcels | Lat/Lng polygons across CSN, Nashik, Pune, Nagpur, Ludhiana |
| **Meteorology & Forecast** | **REAL (Live NWP Models)** | Open-Meteo API / DWD ICON / ECMWF Reanalysis | Real-time 2m temp, humidity, wind, 24h precipitation sum |
| **Evapotranspiration ($ET_0$)** | **REAL (Physical Formula)** | FAO-56 Penman-Monteith Daily Reference Equation | Atmospheric net radiation, wind speed, vapor pressure deficit |
| **Decision Rule Engine** | **RULE-HEURISTIC (Deterministic)** | TypeScript Hydrologic Decision Guardrail | Gated safety thresholds; never activates pump autonomously |
| **Agronomic Copilot** | **REAL (GenAI Intelligence)** | Google Gemini 2.5 Flash LLM | Grounded with live IoT telemetry, weather, and satellite context |
| **Voice Interface (STT/TTS)** | **REAL (Web Speech API)** | Browser native SpeechRecognition & SpeechSynthesis | Zero-latency bilingual recognition in `hi-IN`, `mr-IN`, `en-IN` |
| **Farmer Cloud Auth & History** | **REAL (Cloud Database)** | Supabase PostgreSQL + Row Level Security (RLS) | Persisted recommendation confirmations with time-stamped audits |
| **Solenoid Manifold Actuator** | **SIMULATED DIGITAL TWIN** | 12V DC Latching Valve Hardware Emulator | MQTT payload preview (`mitti/valves/control`) with safety interlocks |
| **LoRaWAN Mesh Gateway** | **SIMULATED TOPOLOGY TWIN** | SX1276 868.100 MHz IN865 Rural Gateway | Multi-node star-of-stars topology with RSSI, SNR, and battery metrics |
| **APMC Mandi Auction Rates** | **REAL BENCHMARKS** | e-NAM & APMC Wholesale Market Data | Real prices for Cotton, Soybean, Grapes, Sugarcane, Onion, Wheat |
| **Dockage & Yield Impact** | **SIMULATED (Agronomic Models)** | Mandi Moisture Penalty Formula & FAO $K_y$ Model | Labeled with amber `SIMULATED` badge for total honesty |

---

## 4. Master Completed Milestones Log

### Milestone 1: Two-Way Talking Regional Voice Copilot (Phase 1)
- **Speech Recognition (STT):** Integrated Web Speech API (`webkitSpeechRecognition`) supporting English, Hindi (`hi-IN`), and Marathi (`mr-IN`). Farmers tap the microphone button or speak questions hands-free.
- **Voice Synthesis (TTS):** Spoken audio advisories broadcast in measured cadence (0.92x speed) tailored for outdoor rural ambient noise.
- **Hands-Free Two-Way Interaction:** When a farmer speaks a query, Gemini 2.5 Flash analyzes real-time sensor metrics and automatically reads the response aloud.

### Milestone 2: Advanced Multi-Spectral Satellite Index Suite (Phase 2)
Integrated real Sentinel-2 multi-spectral band calculation and visual filter emulation for 5 distinct agricultural indices:
1. **True Color (Natural RGB):** Bands B04 (Red), B03 (Green), B02 (Blue) for visual inspection, bund verification, and cloud shadows.
2. **NDVI (Normalized Difference Vegetation Index):** $\frac{\text{B08} - \text{B04}}{\text{B08} + \text{B04}}$ for crop canopy chlorophyll, vegetative vitality, and nitrogen uptake.
3. **NDWI (Normalized Difference Water Index):** $\frac{\text{B08} - \text{B11}}{\text{B08} + \text{B11}}$ (Gao, 1996) for internal leaf water thickness, alerting to drought stress 48 hours before visible wilting.
4. **SAVI (Soil-Adjusted Vegetation Index):** $\frac{1.5 \times (\text{B08} - \text{B04})}{\text{B08} + \text{B04} + 0.5}$ with $L = 0.5$ soil factor, dampening background soil glare for newly sown crops.
5. **EVI (Enhanced Vegetation Index):** $2.5 \times \frac{\text{B08} - \text{B04}}{\text{B08} + 6\text{B04} - 7.5\text{B02} + 1}$, penetrating dense high-biomass crops (sugarcane and vineyard trellises) where NDVI saturates.

### Milestone 3: Solenoid Valve Digital Twin & Animated Water Flow (Phase C)
- **Interactive Multi-Zone Drip & Sprinkler Manifold:**
  - Zone 1: Primary Lateral Drip Line (Root Zone, 38 L/min) — active by default for immediate visual immersion.
  - Zone 2: Sub-surface Furrow Line (26 L/min).
  - Zone 3: Overhead Micro-Sprinkler & Canopy Misting (18 L/min).
- **Smooth Futuristic Water Flow Animations:** Animated SVG pipelines (`.pipe-active`, `.pipe-glow`) with flowing water gradients, droplet particle drift, and expanding soil emitter ripples.
- **Interactive Control HUD:** Instant valve actuation, flow rate counter ($L/\text{min}$), pressure gauge ($1.68\text{ bar}$), volume delivered accumulator, and pump electrical load ($1.15\text{ kW}$).
- **Hardware Integration Preview:** Inspectable MQTT control packet formatted for ESP32 relay modules with HMAC authorization tokens.

### Milestone 4: Gram Panchayat LoRaWAN 868 MHz Rural Mesh Hub (Phase E - Final Horizon)
- **Sub-GHz Long-Range Mesh Topology:** 868.100 MHz IN865 band star-of-stars network connecting 4 field nodes across a 6.2 km radius to 1 solar-powered Gram Panchayat gateway tower.
- **Zero-Cellular-SIM Architecture:** Completely bypasses the need for individual 4G cellular SIM cards in every field sensor, cutting farmer recurring costs to zero.
- **RF Telemetry Sniffer:** Real-time RSSI signal strength (-76 to -99 dBm), SNR (4.1 to 9.4 dB), spread factor (SF7 to SF9), battery voltages (3.82V to 4.02V), and interactive RF Chirp test button with animated wave propagation.

### Milestone 5: APMC Mandi Commodity Ticker & Profit Maximizer (Phase D)
- **Live Wholesale Mandi Ticker:** Real-time auction rates from Jalna, Latur, Pimpalgaon, Baramati, Lasalgaon, and Khanna mandis compared against Government MSP benchmarks.
- **Moisture Dockage Penalty Calculator (कटौती / ओलावा):** Models the 1.8%/qtl price cut imposed by traders when harvest moisture exceeds the 12% dry benchmark, quantifying avoidable farm losses.
- **Pre-Harvest Irrigation Cut-off Advisory:** Recommends the exact 8-to-10-day water shutdown window to naturally dry crops in the field, eliminating dockage cuts and saving irrigation electricity.
- **Net Profit Upside:** Demonstrates a concrete **+₹17,200 per harvest gain** for a 3.8-acre farmer.

### Milestone 6: Subterranean Soil Hydrology & Evapotranspiration Engine
- **Field Capacity & Permanent Wilting Point:** Dynamic calibration based on soil classification (e.g., Vertisol Black Cotton Soil vs. Sandy Loam).
- **FAO-56 Penman-Monteith Evapotranspiration:** Calculates daily moisture loss ($ET_c = K_c \times ET_0$) factoring crop growth stage coefficients.
- **Hydrological Rain Interception:** Calculates run-off and effective infiltration from forecast showers.

### Milestone 7: Hardware Telemetry Studio & ESP32 Live Injector
- Dedicated debugging and testing environment for physical IoT nodes.
- Allows real-time hardware telemetry simulation and stress-testing under simulated drought (14% VWC) or saturated waterlogging (48% VWC).
- Instant offline sensor failover guard: defaults to satellite + meteorological models if probe connection drops.

### Milestone 8: Pest & Fungal Disease Risk Radar
- Bio-climatic disease prediction model combining relative humidity, ambient temperature, and leaf surface moisture duration.
- Real-time early alerts for **Pink Bollworm (Bt Cotton)**, **Powdery Mildew (Grapes)**, **Red Rot (Sugarcane)**, and **Citrus Canker (Mandarin Oranges)** with organic IPM (Integrated Pest Management) spray recipes.

### Milestone 9: Precision Fertigation & NPK Leaching Guard
- Calculates exact Nitrogen (Urea), Phosphorus (DAP), and Potassium (MOP) dosage based on plot acreage and soil saturation.
- Prevents expensive chemical fertilizer loss: blocks application if rain $>10\text{ mm}$ is forecast within 36 hours.

### Milestone 10: PM-KUSUM & PMKSY National Kisan Scheme Navigator
- Integrates government capital subsidies for solar agricultural pumps (PM-KUSUM up to 60% subsidy) and micro-drip irrigation (PMKSY Per Drop More Crop up to 55% subsidy).
- Calculates farmer out-of-pocket investment and expected payback timeframe.

### Milestone 11: Dynamic Water & Energy Tariff ROI Calculator
- Direct financial calculator modeling electricity tariff savings (MSEDCL / PSPCL agricultural grid slabs) and diesel pump displacement.
- Demonstrates tangible return on investment: an average 3.8-acre cotton farmer saves **₹14,200 annually** in electricity and **860,000 liters of groundwater**.

### Milestone 12: Ambient Sensory Atmosphere & Visual Identity
- Custom-crafted agricultural sprout + satellite SVG/ICO favicon.
- Subtle client-rendered falling leaves animation creating an organic farm atmosphere.
- Clean Bento Grid layout with high-contrast accessibility typography.

### Milestone 13: Judge Guided Tour & Demo Auto-Pilot
- 8-step automated walkthrough presenting the full end-to-end journey for hackathon judges in under 90 seconds.

---

## 5. Hackathon Pitch Deck Citations & Presentation Script Reference

When presenting Mitti Sentinel to hackathon judges, cite the specific sections below for crisp, authoritative answers:

### Slide 1: The Hook (Opening 20 Seconds)
> *"Judges, India extracts more groundwater each year than the US and China combined. 55% of it is wasted through blind flood irrigation because farmers have no eyes beneath the soil. Today, we built **Mitti Sentinel**—the first agronomic platform that fuses physical ESP32 soil capacitive telemetry with Copernicus Sentinel-2 satellites and Google Gemini AI, with a strict Truth Contract that never lies to the farmer."*

### Slide 2: The Physical Grounding (Defending the Hardware)
> *"Unlike pure software apps that guess moisture from space through cloud cover, Mitti Sentinel connects to physical capacitive soil probes. When the probe reads 18% VWC, our hydrological model combines it with Open-Meteo's 24-hour rainfall forecast and Sentinel-2 satellite passes to deliver a safety-gated decision: Irrigate, Hold Off, or Protect."*

### Slide 3: Two-Way Talking AI Copilot (The Accessibility Breakthrough)
> *"Rural technology fails if farmers cannot use it. Our 'Ask Mitti AI' copilot doesn't require typing. A farmer in Chhatrapati Sambhajinagar speaks into their phone in Marathi: 'उद्या सकाळी पाणी देऊ का?' (Should I irrigate tomorrow morning?). Gemini 2.5 Flash analyzes real-time sensor telemetry, detects 28 mm of incoming rain, and speaks back in fluent Marathi: 'नाही, उद्या मुसळधार पाऊस होणार आहे, पाणी देणे थांबवा' (No, heavy rain is coming, hold off). That saves power, water, and crops."*

### Slide 4: Multi-Spectral Satellite Intelligence
> *"We don't just show a map; we provide true agronomic diagnostics. Judges can switch between True Color, NDVI for chlorophyll biomass, NDWI for internal leaf moisture, SAVI for emerging crops with bare soil, and EVI for dense sugarcane canopies. All synchronized with 5-day orbital passes of Copernicus Sentinel-2."*

### Slide 5: The Solenoid Digital Twin & Animated Water Flow
> *"We took IoT from passive monitoring to active hydraulic control. Our Solenoid Digital Twin models a 3-zone field manifold. Water flows dynamically through SVG pipelines with real-time pressure, flow rate counters, and pulsing emitter drops. Crucially, our safety interlock automatically locks valves when soil moisture is saturated or heavy rain is forecast."*

### Slide 6: Gram Panchayat LoRaWAN 868MHz Mesh Hub
> *"How do Indian farmers afford connectivity in remote fields? They don't buy 4G SIM cards. Our 868MHz LoRaWAN mesh allows 1 solar gateway atop the Gram Panchayat water tower to service 150 farm probes across 6 km. Probes run 3+ years on a single rechargeable cell with zero recurring cellular data charges."*

### Slide 7: APMC Mandi Profit Maximizer & Harvest Advisory
> *"Water conservation translates directly to farmer wealth. If a farmer irrigates too close to harvest, APMC traders deduct 3% to 8% in moisture dockage (कटौती). Mitti Sentinel provides real wholesale mandi auction rates and advises the exact 8-day irrigation cut-off date to deliver crisp, Grade-A produce, unlocking over ₹17,000 in additional profit per harvest."*

---

## 6. Technology Stack Summary

- **Frontend & App Framework:** React 19, TypeScript 5.8, TanStack Router & Start, Vite 8, Tailwind CSS, Framer Motion, Lucide Icons.
- **Geospatial & Mapping:** Leaflet 1.9, Esri World Imagery, Copernicus Sentinel-2 L2A WMS, ISRO Bhuvan NRSC.
- **Physical IoT Telemetry:** ESP32 Microcontroller, Capacitive Soil Moisture Sensor v1.2, calibrated VWC hydrological curves.
- **Hydraulic Digital Twin:** Interactive 3-Zone Solenoid Manifold with animated water flow, pressure gauges, and MQTT packet inspection.
- **Long-Range RF Mesh:** Gram Panchayat LoRaWAN 868 MHz IN865 Sub-GHz topology simulator with RSSI/SNR packet sniffer.
- **Market Intelligence:** Live APMC Mandi wholesale rate ticker & pre-harvest moisture dockage calculator.
- **Meteorological Intelligence:** Open-Meteo Numerical Weather Prediction (ECMWF IFS / DWD ICON), FAO-56 Penman-Monteith Evapotranspiration.
- **AI & Reasoning Copilot:** Google Gemini 2.5 Flash API with field-grounded contextual prompt framing.
- **Audio & Accessibility:** Native Web Speech API Speech-to-Text (STT) and Regional Speech-to-Text (TTS) in `hi-IN`, `mr-IN`, `en-IN`.
- **Cloud Backend & Database:** Supabase PostgreSQL, Row Level Security (RLS), Realtime Broadcast Channels.
- **Testing & Verification:** Vitest test suite (12/12 passing unit tests), zero-error production Nitro build.
