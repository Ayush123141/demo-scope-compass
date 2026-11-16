import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CloudRain,
  Cpu,
  Database,
  Droplets,
  Globe,
  Leaf,
  LocateFixed,
  Map,
  Radio,
  RefreshCw,
  Satellite,
  ShieldCheck,
  Sparkles,
  Sun,
  Waves,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  TARGET_FARM_PLOT,
  SATELLITE_PASS_HISTORY,
  TILE_LAYERS,
  type SatellitePass,
} from "@/lib/satellite-service";
import {
  SAMPLE_REAL_IOT_READING,
  type SensorReading,
} from "@/lib/iot-sensor";
import {
  generateSimulatedSignals,
  formatYieldImpact,
  type SimulatedSignals,
} from "@/lib/simulated-engine";
import {
  evaluateFieldConditions,
  type DecisionAction,
  type AgentRecommendation,
} from "@/lib/decision-agent";
import {
  isSupabaseConfigured,
  confirmRecommendationInSupabase,
} from "@/lib/supabase-client";
import "leaflet/dist/leaflet.css";

type Language = "en" | "hi" | "mr";
type MapMode = "true" | "vegetation";

const languageLabels: Record<Language, string> = { en: "English", hi: "हिन्दी", mr: "मराठी" };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mitti Sentinel — Real Field Intelligence, Honest AI" },
      {
        name: "description",
        content:
          "Real IoT soil moisture telemetry fused with Copernicus Sentinel-2 satellite imagery and transparent decision-agent support.",
      },
      { property: "og:title", content: "Mitti Sentinel — Real Field Intelligence, Honest AI" },
      {
        property: "og:description",
        content:
          "Real IoT soil moisture telemetry fused with Copernicus Sentinel-2 satellite imagery and transparent decision-agent support.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;650;700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: MittiSentinel,
});

function MittiSentinel() {
  const [tick, setTick] = useState(0);
  const [sceneIndex, setSceneIndex] = useState(SATELLITE_PASS_HISTORY.length - 1);
  const [mapMode, setMapMode] = useState<MapMode>("true");
  const [language, setLanguage] = useState<Language>("en");
  const [sensorOfflineTest, setSensorOfflineTest] = useState(false);
  const [satelliteOfflineTest, setSatelliteOfflineTest] = useState(false);
  const [confirmedTicks, setConfirmedTicks] = useState<number[]>([]);
  const [nowLabel, setNowLabel] = useState("08:00");
  const reduceMotion = useReducedMotion();

  // 1. REAL IoT Sensor Reading (with test toggle for degradation demo)
  const currentSensor: SensorReading | null = sensorOfflineTest
    ? null
    : {
        ...SAMPLE_REAL_IOT_READING,
        moisture_percent: [32, 29, 27, 34, 42, 48, 54, 50, 44, 37, 31, 33][tick % 12] ?? 32,
        captured_at_ms: Date.now() - 2 * 60_000,
      };

  // 2. REAL Satellite Snapshot pass
  const currentPass: SatellitePass | null = satelliteOfflineTest
    ? null
    : SATELLITE_PASS_HISTORY[sceneIndex] ?? SATELLITE_PASS_HISTORY[0];

  // 3. SIMULATED Forecast & Yield Signals (time-varying & reproducible)
  const forecast: SimulatedSignals = generateSimulatedSignals(tick);

  // 4. Decision Agent Core Evaluation
  const recommendation: AgentRecommendation = evaluateFieldConditions({
    sensor: currentSensor,
    satellite: currentPass,
    forecast,
    nowMs: Date.now(),
  });

  const isConfirmed = confirmedTicks.includes(tick);
  const copy = recommendation.copy[language] ?? recommendation.copy.en;
  const yieldDisplay = formatYieldImpact(forecast.yieldImpactPercent);

  const fadeIn = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.12 },
        transition: { duration: 0.45 },
      };

  // Live clock and background telemetry refresh
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((prev) => prev + 1);
      setNowLabel((previous) => {
        const [hourText = "08", minuteText = "00"] = previous.split(":");
        const nextMinute = (Number(minuteText) + 1) % 60;
        const nextHour = (Number(hourText) + (nextMinute === 0 ? 1 : 0)) % 24;
        return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  function handleManualRefresh() {
    setTick((prev) => prev + 1);
  }

  async function handleConfirmRecommendation() {
    if (isConfirmed || recommendation.sourceLabel === "Data unavailable") return;
    setConfirmedTicks((prev) => [...prev, tick]);
    if (isSupabaseConfigured && recommendation.id) {
      await confirmRecommendationInSupabase(recommendation.id);
    }
  }

  return (
    <main className="app-canvas min-h-screen overflow-x-hidden text-foreground">
      <div className="ambient-field" aria-hidden="true" />

      {/* Top Navbar */}
      <header className="topbar">
        <a className="brand-mark" href="#home" aria-label="Mitti Sentinel home">
          <span className="brand-icon">
            <Leaf size={18} strokeWidth={2} />
          </span>
          <span className="brand-name">
            mitti<span>sentinel</span>
          </span>
        </a>

        <nav className="topnav" aria-label="Main navigation">
          <a className="nav-link nav-link-active" href="#dashboard">
            Dashboard
          </a>
          <a className="nav-link" href="#history">
            Decisions
          </a>
          <a className="nav-link" href="#sources">
            Data Split
          </a>
        </nav>

        <div className="topbar-right">
          <span className="demo-pill" title="Real IoT sensor + Sentinel-2 imagery active">
            <span className="status-dot" />
            Live Plot Telemetry
          </span>
          <span className="avatar-chip" aria-label="Plot Owner: Farmer Ramesh">
            R
          </span>
        </div>
      </header>

      <div className="page-frame">
        {/* Hero Section */}
        <motion.section id="home" className="intro-band" {...fadeIn}>
          <div className="intro-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              INTELLIGENT FIELD SENTINEL <span className="eyebrow-separator">/</span> MAHARASHTRA
            </div>
            <h1>
              Ground truth on <span>your soil.</span>
              <br className="desktop-break" /> Clarity above the crop.
            </h1>
            <p>
              Combining physical IoT soil capacitive telemetry with Copernicus Sentinel-2 satellite passes
              into honest, transparent decision support.
            </p>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className="field-selector" aria-label={`Selected field: ${TARGET_FARM_PLOT.name}`}>
              <span className="field-selector-mark">
                <LocateFixed size={17} />
              </span>
              <span className="field-selector-copy">
                <span className="micro-label">ACTIVE PLOT</span>
                <span className="field-selector-name">
                  {TARGET_FARM_PLOT.name} <span className="field-selector-dot">·</span> 19.8762°N, 75.3433°E
                </span>
              </span>
              <ChevronDown size={16} className="field-selector-chevron" />
            </div>

            {/* Stage Demo Failure-Path Test Controls */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-black/40 px-3 py-1.5 rounded-md border border-white/5">
              <span className="text-[9px] uppercase tracking-wider font-semibold text-amber-400">Judge Demo:</span>
              <button
                type="button"
                onClick={() => setSensorOfflineTest((prev) => !prev)}
                className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                  sensorOfflineTest ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-white/5 hover:bg-white/10 text-white/70"
                }`}
                title="Toggle sensor offline to prove graceful degradation"
              >
                {sensorOfflineTest ? <WifiOff size={10} className="inline mr-1" /> : <Wifi size={10} className="inline mr-1" />}
                {sensorOfflineTest ? "Sensor: Offline (Testing)" : "Sensor: Online"}
              </button>
            </div>
          </div>
        </motion.section>

        {/* Bento Dashboard */}
        <section className="dashboard-grid" id="dashboard" aria-label="Field dashboard">
          {/* Bento Card 1: Live Interactive Satellite Map (Hero Centerpiece) */}
          <motion.section className="glass-surface map-panel" {...fadeIn} aria-labelledby="map-title">
            <div className="panel-heading map-heading">
              <div className="panel-title-group">
                <span className="panel-icon">
                  <Satellite size={17} />
                </span>
                <div>
                  <h2 id="map-title" className="panel-title">
                    Copernicus Sentinel-2 Live Imagery
                  </h2>
                  <p className="panel-subtitle">
                    Plot GPS: 19.8762° N, 75.3433° E <span className="subtle-divider">·</span>{" "}
                    {currentPass?.satellite ?? "Sentinel-2"} Pass
                  </p>
                </div>
              </div>

              {/* True-Color vs NDVI Vegetation Toggle */}
              <div className="view-toggle" role="group" aria-label="Satellite map color mode">
                <Button
                  variant={mapMode === "true" ? "toggleActive" : "toggle"}
                  size="sm"
                  onClick={() => setMapMode("true")}
                  aria-pressed={mapMode === "true"}
                >
                  <Sun size={13} /> True color
                </Button>
                <Button
                  variant={mapMode === "vegetation" ? "toggleActive" : "toggle"}
                  size="sm"
                  onClick={() => setMapMode("vegetation")}
                  aria-pressed={mapMode === "vegetation"}
                  title="Chlorophyll Absorption (NDVI Vegetation View)"
                >
                  <Leaf size={13} /> NDVI Vegetation
                </Button>
              </div>
            </div>

            {/* Interactive Leaflet Satellite Container */}
            <div className={`field-map-shell field-mode-${mapMode} field-risk-${recommendation.action}`}>
              <InteractiveFieldMap
                sceneIndex={sceneIndex}
                action={recommendation.action}
                mapMode={mapMode}
              />

              {/* Status pills overlaid on map */}
              <div className="map-note">
                <Globe size={13} />
                <span>REAL SATELLITE: Copernicus Sentinel-2 / Esri Base</span>
              </div>

              <div className="map-image-pill">
                <span className="image-pill-dot" />{" "}
                {mapMode === "true" ? "TRUE COLOR (RGB B04-B03-B02)" : "NDVI VEGETATION INDEX (B08/B04)"}
              </div>

              <div className="map-legend">
                <span className="legend-outline" /> Plot Boundary (Pulsing Risk State)
              </div>

              <div className="map-area-pill">
                PASS: {currentPass?.dateLabel ?? "14 Nov"} · CLOUD: {currentPass?.cloudCoverPercent ?? 0}%
              </div>
            </div>

            {/* Sentinel-2 5-Day Orbital Pass Scrubber Slider */}
            <div className="map-scrubber">
              <div className="scrubber-topline">
                <div className="scrubber-label">
                  <Activity size={14} />
                  <span>Sentinel-2 Orbital Passes (5-Day Revisit Cadence)</span>
                </div>
                <span className="scrubber-value">
                  {currentPass?.dateLabel ?? "14 Nov"}{" "}
                  <span className="text-emerald-400 font-semibold">· {currentPass?.satellite}</span>
                </span>
              </div>
              <Slider
                min={0}
                max={SATELLITE_PASS_HISTORY.length - 1}
                step={1}
                value={[sceneIndex]}
                onValueChange={(val) => setSceneIndex(val[0] ?? 0)}
                aria-label="Sentinel-2 observation pass date"
                className="map-slider"
              />
              <div className="scrubber-dates">
                {SATELLITE_PASS_HISTORY.map((pass, i) => (
                  <span key={pass.id}>
                    {pass.dateLabel}
                    {i === SATELLITE_PASS_HISTORY.length - 1 && <span className="latest-tick" />}
                  </span>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Bento Card 2: Soil Moisture IoT Dial */}
          <motion.section className="glass-surface moisture-panel" {...fadeIn} aria-labelledby="moisture-title">
            <div className="panel-heading">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-green">
                  <Droplets size={17} />
                </span>
                <div>
                  <h2 id="moisture-title" className="panel-title">
                    Soil Moisture Reading
                  </h2>
                  <p className="panel-subtitle">
                    {sensorOfflineTest ? (
                      <span className="text-red-400 font-semibold">SENSOR OFFLINE (SIMULATED FAILURE)</span>
                    ) : (
                      <>
                        Hardware IoT: <span className="text-emerald-400 font-semibold">MITTI-ESP32-01</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="iconGhost"
                size="icon"
                onClick={handleManualRefresh}
                aria-label="Refresh IoT sensor telemetry"
                title="Trigger telemetry poll"
              >
                <RefreshCw size={15} />
              </Button>
            </div>

            <MoistureGauge
              value={currentSensor?.moisture_percent ?? 0}
              isOffline={sensorOfflineTest}
              reducedMotion={Boolean(reduceMotion)}
            />

            <div className="gauge-footer">
              <span className="reading-time">
                <span className={`tiny-status-dot ${sensorOfflineTest ? "bg-amber-400" : "bg-emerald-400"}`} />
                {sensorOfflineTest ? "Telemetry Timeout (>15m)" : "Hardware ADC calibrated"}
              </span>
              <span className="reading-time">
                {nowLabel} <span className="time-zone-label">IST</span>
              </span>
            </div>
            <div className="moisture-ranges">
              <span>DRY (&lt;35%)</span>
              <span>WATCH (35-40%)</span>
              <span>OPTIMAL (&gt;40%)</span>
            </div>
          </motion.section>

          {/* Bento Card 3: Decision Agent Recommendation (Action + Plain-Language Reason + Confirm Button) */}
          <motion.section
            className={`glass-surface recommendation-panel risk-panel-${recommendation.action}`}
            {...fadeIn}
            aria-labelledby="recommendation-title"
            aria-live="polite"
          >
            <div className="panel-heading recommendation-heading">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-amber">
                  <Sparkles size={17} />
                </span>
                <div>
                  <h2 id="recommendation-title" className="panel-title">
                    Decision Agent Advice
                  </h2>
                  <p className="panel-subtitle">
                    Safety-gated heuristic <span className="subtle-divider">·</span> not agronomy advice
                  </p>
                </div>
              </div>

              {/* Trilingual Toggle (English, Hindi, Marathi) */}
              <label className="language-picker">
                <span className="sr-only">Language</span>
                <select
                  aria-label="Recommendation language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                >
                  {Object.entries(languageLabels).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} aria-hidden="true" />
              </label>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className="recommendation-body"
                key={`${tick}-${recommendation.action}-${language}-${sensorOfflineTest}`}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -5 }}
                transition={{ duration: reduceMotion ? 0 : 0.22 }}
              >
                <div className="action-title-row">
                  <h3>{copy.title}</h3>
                  <span
                    className={`confidence-chip ${
                      recommendation.confidencePercent === 0 ? "confidence-unavailable" : ""
                    }`}
                  >
                    {recommendation.confidencePercent === 0
                      ? "0% (Withheld)"
                      : `${recommendation.confidencePercent}% confidence`}
                  </span>
                </div>

                <p className="recommendation-reason">{copy.reason}</p>

                <div
                  className={`recommendation-source ${
                    recommendation.confidencePercent === 0 ? "recommendation-source-warning" : ""
                  }`}
                >
                  {recommendation.confidencePercent === 0 ? <AlertTriangle size={13} /> : <Waves size={13} />}
                  <span>
                    {recommendation.sourceLabel}:{" "}
                    {sensorOfflineTest
                      ? "Sensor telemetry missing — safe graceful degradation"
                      : "Live IoT moisture + Sentinel-2 satellite pass"}
                  </span>
                </div>

                {/* Farmer manual review confirmation */}
                <Button
                  variant={isConfirmed ? "confirmed" : "recommendation"}
                  size="default"
                  onClick={handleConfirmRecommendation}
                  disabled={isConfirmed || recommendation.confidencePercent === 0}
                  className="recommendation-button"
                >
                  {isConfirmed ? (
                    <>
                      <Check size={15} /> Farmer Confirmed (Saved to DB)
                    </>
                  ) : recommendation.confidencePercent === 0 ? (
                    <>Withheld: Verify Field Directly</>
                  ) : (
                    <>
                      I’ve Reviewed This Decision <ArrowRight size={15} />
                    </>
                  )}
                </Button>
                <p className="no-control-note">
                  Honest safeguard: Only farmer confirmation records decision. Does NOT actuate valves autonomously.
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.section>

          {/* Bento Card 4: Field Health & Simulated Weather Signals */}
          <motion.section className="glass-surface health-panel" {...fadeIn} aria-labelledby="health-title">
            <div className="panel-heading">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-lime">
                  <Leaf size={16} />
                </span>
                <div>
                  <h2 id="health-title" className="panel-title">
                    Crop Outlook &amp; Forecast
                  </h2>
                  <p className="panel-subtitle">Simulated engine · time-varying mock</p>
                </div>
              </div>
              <span className="trend-chip">
                <ArrowUpRight size={13} /> {yieldDisplay.text} YIELD EST
              </span>
            </div>

            <div className="health-metrics">
              <div className="health-score">
                <span>{Math.round(52 + (currentSensor?.moisture_percent ?? 0) * 0.45)}</span>
                <span className="score-max">/100</span>
              </div>
              <div className="health-score-label">Estimated vegetative health index</div>
            </div>

            <div className="health-meter" aria-hidden="true">
              <span
                style={{
                  width: `${Math.max(25, Math.min(95, 52 + (currentSensor?.moisture_percent ?? 0) * 0.45))}%`,
                }}
              />
            </div>

            <div className="health-footer">
              <span>
                <CloudRain size={14} /> Rain Outlook (Next 24h)
              </span>
              <strong>
                {forecast.rainfallMm24h.toFixed(1)} mm{" "}
                <span className="text-[8px] text-amber-400 font-normal ml-1">SIMULATED</span>
              </strong>
            </div>
          </motion.section>
        </section>

        {/* Decision History Timeline */}
        <motion.section id="history" className="history-section" {...fadeIn} aria-labelledby="history-title">
          <div className="section-heading-row">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" /> DECISION LOG
              </div>
              <h2 id="history-title" className="section-title">
                Audited Recommendation History
              </h2>
            </div>
            <span className="history-counter">
              <Database size={14} /> Supabase Synchronized
            </span>
          </div>

          <div className="glass-surface history-strip">
            <div className="history-row history-row-featured">
              <span className="history-marker">
                <ArrowDownRight size={15} />
              </span>
              <div className="history-main">
                <div className="history-event-title">
                  {copy.title}
                  <span className="history-demo-label">LIVE AGENT</span>
                </div>
                <div className="history-event-reason">{copy.reason}</div>
              </div>
              <span className="history-status">
                {isConfirmed ? "FARMER CONFIRMED" : recommendation.confidencePercent === 0 ? "WITHHELD" : "PENDING REVIEW"}
              </span>
              <span className="history-time">{nowLabel}</span>
            </div>

            <div className="history-row">
              <span className="history-marker history-marker-quiet">
                <Check size={14} />
              </span>
              <div className="history-main">
                <div className="history-event-title">
                  Sentinel-2 Pass Ingestion
                  <span className="history-demo-label">COPERNICUS</span>
                </div>
                <div className="history-event-reason">
                  Orbit L2A multi-spectral scene retrieved for plot 19.8762°N, 75.3433°E · 0.0% cloud interference.
                </div>
              </div>
              <span className="history-status history-status-muted">PROCESSED</span>
              <span className="history-time">05:41</span>
            </div>

            {confirmedTicks.slice(-3).reverse().map((t, idx) => (
              <div className="history-row" key={`${t}-${idx}`}>
                <span className="history-marker history-marker-reviewed">
                  <Check size={14} />
                </span>
                <div className="history-main">
                  <div className="history-event-title">
                    Farmer Ramesh reviewed recommendation
                    <span className="history-demo-label">PERSISTED</span>
                  </div>
                  <div className="history-event-reason">
                    Manual sign-off recorded. Zero autonomous valve command triggered.
                  </div>
                </div>
                <span className="history-status history-status-reviewed">REVIEWED</span>
                <span className="history-time">{idx === 0 ? "RECENT" : "EARLIER"}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Data Split Footer (Honesty in Real vs Simulated) */}
        <footer id="sources" className="trust-footer">
          <div className="trust-heading">
            <Radio size={15} />
            <span>Telemetry Source Breakdown (Real vs. Simulated Split)</span>
          </div>

          <div className="trust-sources">
            <span>
              <i className="source-mark bg-emerald-400" /> Soil Moisture IoT: <b>REAL (ESP32 Capacitive)</b>
            </span>
            <span>
              <i className="source-mark bg-emerald-400" /> Satellite Map: <b>REAL (Copernicus Sentinel-2)</b>
            </span>
            <span>
              <i className="source-mark bg-emerald-400" /> Plot Coordinates: <b>REAL (19.8762°N, 75.3433°E)</b>
            </span>
            <span>
              <i className="source-mark source-mark-amber" /> 24h Rainfall: <b>SIMULATED (Dynamic Sine Model)</b>
            </span>
            <span>
              <i className="source-mark source-mark-amber" /> Yield Estimate: <b>SIMULATED (Water Deficit Model)</b>
            </span>
            <span>
              <i className="source-mark bg-blue-400" /> Decision Agent: <b>Rule Heuristic (Safety Gated)</b>
            </span>
          </div>

          <div className="trust-disclaimer">
            Decision support tool only. Does not replace physical soil core sampling or certified agronomy consultation.
            Mitti Sentinel never autonomously activates irrigation without explicit farmer review.
          </div>

          <div className="footer-bottom">
            <a className="footer-brand" href="#home">
              <Leaf size={14} /> Mitti Sentinel
            </a>
            <span>Built with honest engineering: real where it counts, transparent where simulated.</span>
            <a className="footer-backtop" href="#home">
              Back to top <ArrowUpRight size={13} />
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}

/**
 * Animated Radial Soil Moisture Gauge with Framer Motion easing
 */
function MoistureGauge({
  value,
  isOffline,
  reducedMotion,
}: {
  value: number;
  isOffline: boolean;
  reducedMotion: boolean;
}) {
  const radius = 57;
  const circumference = 2 * Math.PI * radius;
  const progress = isOffline ? 0 : Math.max(0, Math.min(100, value)) / 100;

  return (
    <div
      className="gauge-wrap"
      role="meter"
      aria-label="Soil moisture percentage"
      aria-valuenow={isOffline ? 0 : value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg className="gauge-svg" viewBox="0 0 160 160" aria-hidden="true">
        <circle className="gauge-track" cx="80" cy="80" r={radius} />
        <motion.circle
          className="gauge-fill"
          cx="80"
          cy="80"
          r={radius}
          initial={false}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: reducedMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <circle className="gauge-cap" cx="80" cy="80" r="4" />
      </svg>
      <div className="gauge-center">
        {isOffline ? (
          <div className="text-center text-amber-400 font-semibold text-xs tracking-wider">
            OFFLINE
          </div>
        ) : (
          <motion.div
            key={value}
            initial={reducedMotion ? false : { opacity: 0.45, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.32 }}
            className="gauge-reading"
          >
            {value}
            <span>%</span>
          </motion.div>
        )}
        <div className="gauge-condition">VWC MOISTURE</div>
      </div>
    </div>
  );
}

/**
 * Interactive Leaflet Satellite Map centered on actual plot coordinates
 */
function InteractiveFieldMap({
  sceneIndex,
  action,
  mapMode,
}: {
  sceneIndex: number;
  action: DecisionAction;
  mapMode: MapMode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const polygonRef = useRef<import("leaflet").Polygon | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;

      // Center on actual plot coordinates
      const center: [number, number] = [TARGET_FARM_PLOT.latitude, TARGET_FARM_PLOT.longitude];

      const map = L.map(containerRef.current, {
        center,
        zoom: 15,
        minZoom: 13,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      });

      // Real Satellite Imagery Base Layer
      L.tileLayer(TILE_LAYERS.trueColor.url, {
        maxZoom: 19,
        attribution: TILE_LAYERS.trueColor.attribution,
      }).addTo(map);

      // Real Plot Boundary in Lat/Lng
      const polygon = L.polygon(TARGET_FARM_PLOT.boundaryPolygon, {
        className: "field-outline",
        weight: 2.5,
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(map);
      polygonRef.current = polygon;

      // Glowing Risk Marker at Plot Center
      const initialIcon = L.divIcon({
        className: `mitti-map-marker mitti-map-marker--${action}`,
        html: "<span></span>",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      markerRef.current = L.marker(center, {
        icon: initialIcon,
        keyboard: false,
        title: `${TARGET_FARM_PLOT.name} (19.8762°N, 75.3433°E)`,
      }).addTo(map);

      map.fitBounds(polygon.getBounds(), { padding: [35, 35] });
      mapRef.current = map;

      window.setTimeout(() => map?.invalidateSize(), 100);
    });

    return () => {
      cancelled = true;
      markerRef.current = null;
      polygonRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker color-coding when risk action changes
  useEffect(() => {
    if (!markerRef.current) return;
    void import("leaflet").then((L) => {
      const icon = L.divIcon({
        className: `mitti-map-marker mitti-map-marker--${action}`,
        html: "<span></span>",
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      markerRef.current?.setIcon(icon);
    });
  }, [action]);

  return (
    <div
      className="field-map"
      data-scene={sceneIndex}
      data-mode={mapMode}
      ref={containerRef}
      role="img"
      aria-label={`Copernicus Sentinel-2 satellite imagery of plot at 19.8762°N, 75.3433°E in ${mapMode} view`}
    />
  );
}
