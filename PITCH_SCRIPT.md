# Mitti Sentinel — 2-Minute Stage Pitch & Judge Demo Walkthrough 🎙️

> **Tagline**: *"Ground truth on your soil. Spaceborne clarity above. Honest AI that advises, never blindly actuates."*

---

## ⏱️ The 2-Minute Hackathon Demo Script

### **[0:00 - 0:25] The Problem & Hook**
> *"Respected judges, 80% of India's freshwater is consumed by agriculture, yet farmers lose billions every year to over-irrigation, root-rot, and sudden weather anomalies. Most existing agri-apps fail because of a credibility gap: either they use distant 25-kilometer weather forecasts, or opaque AI that hallucinate recommendations.
> 
> We built **Mitti Sentinel** — an agronomic decision support platform that combines physical ground truth with spaceborne satellite clarity, honest data labeling, and trilingual AI copilot assistance."*

---

### **[0:25 - 0:50] The Live Centerpiece: Spaceborne Satellite Grounding**
> *(Point to the large Satellite Map on screen)*
> *"Look at our centerpiece. This is not a static stock photo. This is live Copernicus Sentinel-2 satellite imagery over an actual vineyard in Dindori, Nashik.
> - With one click, the farmer can toggle between **True Color optical imagery** and **NDVI Vegetation Health** to inspect chlorophyll absorption.
> - With our **5-Day Orbital Pass Scrubber**, the farmer can visually travel back through Sentinel-2's orbital passes (from October 20th to November 14th) to see their crop canopy developing over time.
> - Notice the glowing risk boundary on the field—it pulses amber or red if root moisture is in danger."*

---

### **[0:50 - 1:15] Ground Telemetry & The Truth Contract**
> *(Point to the Radial Gauge, Recharts Trend, and Hardware Studio)*
> *"On the ground, our ESP32 IoT capacitive sensor measures Volumetric Water Content (VWC) directly at the root zone.
> - Notice our honesty split: we clearly label what is **100% REAL** (Soil IoT, Copernicus Satellite, Open-Meteo Meteorology) versus what is **SIMULATED** (Yield Impact). Judges respect teams that tell the truth.
> - Down below, our **24-hour dual-depth profile** tracks topsoil evaporation (0–15cm) against deep taproot retention (15–45cm)."*

---

### **[1:15 - 1:40] Realtime Testing, Failure-Path Degradation & Voice Advisory**
> *(Interactive Demo Action)*
> *"Now watch what happens when we simulate real farm conditions:
> 1. *(Click "Listen Advisory 🔊")*: Our app audibly speaks the recommendation in natural colloquial **Marathi, Hindi, or English** for farmers working in bright sunlight.
> 2. *(Toggle "Sensor: Offline")*: Notice our **graceful degradation guarantee**. The agent knows what it doesn't know—it immediately drops confidence to 0% and withholds recommendations instead of hallucinating bad advice.
> 3. *(Click "Share Advisory")*: With one tap, the farmer can dispatch this exact advisory directly via **WhatsApp or SMS** to their tractor driver or local Krishi Vigyan Kendra."*

---

### **[1:40 - 2:00] Economic ROI & Closing**
> *(Point to Water & Electricity ROI Calculator)*
> *"Finally, our **Water ROI Engine** proves that deferring just one unnecessary irrigation cycle saves over **77,000 liters of aquifer groundwater**, **₹380+ in power tariffs**, and stops root-rot before it starts.
> 
> With full **Supabase PostgreSQL authentication**, **Open-Meteo micro-climate disease prediction**, and **Google Gemini 2.5 Flash copilot**, Mitti Sentinel brings space and soil together for Indian farmers. Thank you!"*

---

## 💡 Quick Q&A Cheat-Sheet for Tough Judge Questions

| Tough Question | Your Winning Answer |
|---|---|
| **"Why doesn't your app automatically turn on the motor valve?"** | *"That is by deliberate safety design. In Indian agriculture, automated valves without manual inspection frequently burst drip lines, flood uneven soil, or run dry pumps. Mitti Sentinel guarantees human-in-the-loop: it advises, but only the farmer's confirmation logs the decision."* |
| **"How does a farmer with poor internet use this?"** | *"Our satellite tiles and weather forecasts cache locally in the browser (PWA). Plus, our WhatsApp/SMS dispatcher allows extension workers or family members to push alerts over standard 2G cellular SMS."* |
| **"What makes your AI trustworthy?"** | *"Unlike generic ChatGPT wrappers, our Google Gemini 2.5 Flash model is strictly grounded in live root telemetry, cloud cover, and satellite date. It is instructed to advise farmers to verify their soil before spending money on power."* |
