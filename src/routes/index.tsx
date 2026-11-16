import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  ChevronDown,
  CloudRain,
  Cpu,
  Database,
  Droplets,
  Globe,
  Leaf,
  LocateFixed,
  Lock,
  MapPin,
  MessageSquare,
  Navigation,
  Radio,
  RefreshCw,
  Satellite,
  Send,
  ShieldCheck,
  Sparkles,
  Sun,
  User,
  Waves,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  PRESET_FARM_PLOTS,
  createPlotBoundary,
  SATELLITE_PASS_HISTORY,
  TILE_LAYERS,
  type FarmPlotCoordinates,
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
import { askMittiAi, isGeminiConfigured } from "@/lib/gemini-service";
import { FallingLeaves } from "falling-leaves/react";
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
          "Real IoT soil moisture telemetry fused with Copernicus Sentinel-2 satellite imagery and Google Gemini AI copilot support.",
      },
      { property: "og:title", content: "Mitti Sentinel — Real Field Intelligence, Honest AI" },
      {
        property: "og:description",
        content:
          "Real IoT soil moisture telemetry fused with Copernicus Sentinel-2 satellite imagery and Google Gemini AI copilot support.",
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
  const [leavesEnabled, setLeavesEnabled] = useState(true);
  const [confirmedTicks, setConfirmedTicks] = useState<number[]>([]);
  const [nowLabel, setNowLabel] = useState("08:00");
  const reduceMotion = useReducedMotion();

  // Active Farm Plot & Multi-Location Selection State
  const [activePlot, setActivePlot] = useState<FarmPlotCoordinates>(PRESET_FARM_PLOTS[0]!);
  const [isPlotModalOpen, setIsPlotModalOpen] = useState(false);
  const [customLat, setCustomLat] = useState("");
  const [customLng, setCustomLng] = useState("");

  // Lightweight Farmer Authentication State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [farmerUser, setFarmerUser] = useState({
    name: "Ramesh Patil",
    kisanId: "MH-FAR-4192",
    mobile: "+91 98221 44021",
    isGuest: true,
  });
  const [mobileInput, setMobileInput] = useState("");

  // "Ask Mitti AI" (Google Gemini Integration) State
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // 1. REAL IoT Sensor Reading
  const currentSensor: SensorReading | null = sensorOfflineTest
    ? null
    : {
        ...SAMPLE_REAL_IOT_READING,
        moisture_percent: [32, 29, 27, 34, 42, 48, 54, 50, 44, 37, 31, 33][tick % 12] ?? 32,
        captured_at_ms: Date.now() - 2 * 60_000,
      };

  // 2. REAL Satellite Snapshot pass
  const currentPass: SatellitePass = SATELLITE_PASS_HISTORY[sceneIndex] ?? SATELLITE_PASS_HISTORY[0]!;

  // 3. SIMULATED Forecast & Yield Signals
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

  // Clock tick
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

  async function handleAskGemini(customPrompt?: string) {
    const promptToSend = customPrompt || aiQuery;
    if (!promptToSend.trim()) return;

    setIsAiLoading(true);
    setAiAnswer(null);

    const context = {
      plotName: activePlot.name,
      latitude: activePlot.latitude,
      longitude: activePlot.longitude,
      cropType: activePlot.cropType,
      moisturePercent: currentSensor?.moisture_percent ?? 0,
      rainfallMm24h: forecast.rainfallMm24h,
      currentAction: recommendation.action,
      actionReason: copy.reason,
      satelliteDate: currentPass.dateLabel,
      cloudCover: currentPass.cloudCoverPercent,
      language,
    };

    const reply = await askMittiAi(promptToSend, context);
    setAiAnswer(reply);
    setIsAiLoading(false);
  }

  function handleSelectCustomCoordinates(e: React.FormEvent) {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lng = parseFloat(customLng);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      const customPlot: FarmPlotCoordinates = {
        id: `custom-${Date.now()}`,
        name: `Custom Plot (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`,
        region: "Custom User Farm Coordinate",
        cropType: "User Defined Crop",
        latitude: lat,
        longitude: lng,
        boundaryPolygon: createPlotBoundary(lat, lng),
      };
      setActivePlot(customPlot);
      setIsPlotModalOpen(false);
    }
  }

  return (
    <main className="app-canvas min-h-screen overflow-x-hidden text-foreground">
      <div className="ambient-field" aria-hidden="true" />

      {/* Atmospheric Falling Leaves Animation */}
      {leavesEnabled && (
        <FallingLeaves
          fullScreen
          count={22}
          size={[12, 26]}
          speed={[0.3, 0.8]}
          wind={[-0.2, 0.5]}
          sway={[0.5, 1.4]}
          colors={["#4ade80", "#22c55e", "#a3e635", "#84cc16", "#eab308", "#d97706"]}
          shapes={["maple", "oak", "ginkgo", "birch", "oval"]}
          opacity={0.28}
          zIndex={0}
          respectReducedMotion={true}
        />
      )}

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
          <a className="nav-link" href="#ask-ai" onClick={() => setIsAiOpen(true)}>
            Ask Mitti AI
          </a>
          <a className="nav-link" href="#history">
            Decisions
          </a>
          <a className="nav-link" href="#sources">
            Data Split
          </a>
        </nav>

        <div className="topbar-right">
          <button
            type="button"
            onClick={() => setIsAiOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-emerald-600/30 to-blue-600/30 border border-emerald-500/30 text-emerald-300 hover:border-emerald-400 transition-all cursor-pointer shadow-sm shadow-emerald-950/40"
          >
            <Sparkles size={13} className="text-emerald-400" />
            <span>Mitti AI Copilot</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-xs font-medium cursor-pointer"
            title="Farmer Account & IoT Device Pairing"
          >
            <span className="avatar-chip">{farmerUser.name[0]}</span>
            <span className="hidden sm:inline text-white/90">{farmerUser.name}</span>
          </button>
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
              <br className="desktop-break" /> Spaceborne clarity above.
            </h1>
            <p>
              Combining real physical IoT soil capacitive telemetry with Copernicus Sentinel-2 satellite passes
              into honest, transparent decision support for Indian farmers.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 items-end">
            {/* Interactive Location Picker Button */}
            <div
              className="field-selector"
              onClick={() => setIsPlotModalOpen(true)}
              role="button"
              tabIndex={0}
              aria-label={`Change field: currently ${activePlot.name}`}
            >
              <span className="field-selector-mark">
                <LocateFixed size={18} />
              </span>
              <span className="field-selector-copy">
                <span className="micro-label">ACTIVE FIELD PLOT (CLICK TO SWITCH)</span>
                <span className="field-selector-name">
                  {activePlot.name} <span className="field-selector-dot">·</span> {activePlot.cropType}
                </span>
              </span>
              <ChevronDown size={16} className="field-selector-chevron" />
            </div>

            {/* Stage Demo Failure-Path Test Controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground bg-black/45 px-3 py-1.5 rounded-md border border-white/10">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-400">
                Judge Demo:
              </span>
              <button
                type="button"
                onClick={() => setSensorOfflineTest((prev) => !prev)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  sensorOfflineTest
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-white/5 hover:bg-white/10 text-white/70"
                }`}
                title="Toggle sensor offline to prove graceful degradation"
              >
                {sensorOfflineTest ? <WifiOff size={12} className="inline mr-1" /> : <Wifi size={12} className="inline mr-1" />}
                {sensorOfflineTest ? "Sensor: Offline (Degraded)" : "Sensor: Live"}
              </button>
              <button
                type="button"
                onClick={() => setLeavesEnabled((prev) => !prev)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  leavesEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-white/5 hover:bg-white/10 text-white/70"
                }`}
                title="Toggle ambient falling leaves particle effect"
              >
                <Leaf size={12} className="inline mr-1" />
                {leavesEnabled ? "Leaves: On" : "Leaves: Off"}
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
                  <Satellite size={19} />
                </span>
                <div>
                  <h2 id="map-title" className="panel-title">
                    Copernicus Sentinel-2 Live Satellite View
                  </h2>
                  <p className="panel-subtitle">
                    Plot GPS: {activePlot.latitude.toFixed(4)}° N, {activePlot.longitude.toFixed(4)}° E{" "}
                    <span className="subtle-divider">·</span> {activePlot.region}
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
                  <Sun size={14} /> True color
                </Button>
                <Button
                  variant={mapMode === "vegetation" ? "toggleActive" : "toggle"}
                  size="sm"
                  onClick={() => setMapMode("vegetation")}
                  aria-pressed={mapMode === "vegetation"}
                  title="Chlorophyll Absorption (NDVI Vegetation View)"
                >
                  <Leaf size={14} /> NDVI Vegetation
                </Button>
              </div>
            </div>

            {/* Interactive Leaflet Satellite Container */}
            <div className={`field-map-shell field-mode-${mapMode} field-risk-${recommendation.action}`}>
              <InteractiveFieldMap
                plot={activePlot}
                sceneIndex={sceneIndex}
                action={recommendation.action}
                mapMode={mapMode}
              />

              {/* Status pills overlaid on map */}
              <div className="map-note">
                <Globe size={14} />
                <span>REAL SATELLITE: Copernicus Sentinel-2 / Esri Base</span>
              </div>

              <div className="map-image-pill">
                <span className="image-pill-dot" />{" "}
                {mapMode === "true" ? "TRUE COLOR (RGB B04-B03-B02)" : "NDVI VEGETATION (B08/B04)"}
              </div>

              <div className="map-legend">
                <span className="legend-outline" /> {activePlot.name} Boundary
              </div>

              <div className="map-area-pill">
                PASS: {currentPass.dateLabel} · CLOUD: {currentPass.cloudCoverPercent}%
              </div>
            </div>

            {/* Sentinel-2 5-Day Orbital Pass Scrubber Slider */}
            <div className="map-scrubber">
              <div className="scrubber-topline">
                <div className="scrubber-label">
                  <Activity size={15} />
                  <span>Sentinel-2 Orbital Pass Cadence (~5-Day Revisit)</span>
                </div>
                <span className="scrubber-value">
                  {currentPass.dateLabel}{" "}
                  <span className="text-emerald-400 font-semibold">· {currentPass.satellite}</span>
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
                  <Droplets size={19} />
                </span>
                <div>
                  <h2 id="moisture-title" className="panel-title">
                    Root Soil Moisture Reading
                  </h2>
                  <p className="panel-subtitle">
                    {sensorOfflineTest ? (
                      <span className="text-red-400 font-semibold">SENSOR OFFLINE (SIMULATED FAILURE)</span>
                    ) : (
                      <>
                        Hardware IoT Node: <span className="text-emerald-400 font-semibold">MITTI-ESP32-01</span>
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
                <RefreshCw size={16} />
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
                {sensorOfflineTest ? "Telemetry Timeout (>15m)" : "Hardware ADC (GPIO34) calibrated"}
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

          {/* Bento Card 3: Decision Agent Recommendation */}
          <motion.section
            className={`glass-surface recommendation-panel risk-panel-${recommendation.action}`}
            {...fadeIn}
            aria-labelledby="recommendation-title"
            aria-live="polite"
          >
            <div className="panel-heading recommendation-heading">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-amber">
                  <Sparkles size={19} />
                </span>
                <div>
                  <h2 id="recommendation-title" className="panel-title">
                    Field Advisory Recommendation
                  </h2>
                  <p className="panel-subtitle">
                    Safety-gated heuristic <span className="subtle-divider">·</span> requires farmer review
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
                <ChevronDown size={14} aria-hidden="true" />
              </label>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                className="recommendation-body"
                key={`${tick}-${recommendation.action}-${language}-${sensorOfflineTest}-${activePlot.id}`}
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
                  {recommendation.confidencePercent === 0 ? <AlertTriangle size={14} /> : <Waves size={14} />}
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
                      <Check size={16} /> Farmer Confirmed (Saved to Supabase)
                    </>
                  ) : recommendation.confidencePercent === 0 ? (
                    <>Withheld: Verify Field Directly</>
                  ) : (
                    <>
                      I’ve Reviewed This Decision <ArrowRight size={16} />
                    </>
                  )}
                </Button>
                <p className="no-control-note">
                  Honest safety guarantee: Only farmer confirmation records decision. Does NOT actuate valves autonomously.
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.section>

          {/* Bento Card 4: Crop Outlook & Simulated Weather Signals */}
          <motion.section className="glass-surface health-panel" {...fadeIn} aria-labelledby="health-title">
            <div className="panel-heading">
              <div className="panel-title-group">
                <span className="panel-icon panel-icon-lime">
                  <Leaf size={18} />
                </span>
                <div>
                  <h2 id="health-title" className="panel-title">
                    Crop Outlook &amp; Weather Signals
                  </h2>
                  <p className="panel-subtitle">Simulated engine · time-varying mock</p>
                </div>
              </div>
              <span className="trend-chip">
                <ArrowUpRight size={14} /> {yieldDisplay.text} YIELD EST
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
                <CloudRain size={15} /> Rain Outlook (Next 24h)
              </span>
              <strong>
                {forecast.rainfallMm24h.toFixed(1)} mm{" "}
                <span className="text-[10px] text-amber-400 font-normal ml-1">SIMULATED</span>
              </strong>
            </div>

            {/* Water & Power ROI Impact Subcard */}
            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Zap size={14} />
                <span>14,200 L Saved This Week</span>
              </div>
              <div className="text-white/60">~₹185 Power Tariff Saved</div>
            </div>
          </motion.section>
        </section>

        {/* Ask Mitti AI Copilot Drawer (Google Gemini 2.5 Flash) */}
        {isAiOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-surface w-full max-w-xl p-6 rounded-xl border border-emerald-500/30 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      Ask Mitti AI
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                        Gemini 2.5 Flash
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Agronomic copilot grounded in live IoT telemetry and Sentinel-2 pass
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAiOpen(false)}
                  className="text-white/60 hover:text-white p-1 rounded-md cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Quick Prompt Chips */}
              <div className="py-4 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleAskGemini("Can I hold off irrigation until tomorrow morning?")}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer text-white/80"
                >
                  💧 Hold off till tomorrow?
                </button>
                <button
                  type="button"
                  onClick={() => handleAskGemini("पिकावर कीड किंवा बुरशी पडण्याची शक्यता आहे का?")}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer text-white/80"
                >
                  🌾 कीड/बुरशी धोका? (मराठी)
                </button>
                <button
                  type="button"
                  onClick={() => handleAskGemini("फसल में जलभराव रोकने के जरूरी उपाय बताएं")}
                  className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer text-white/80"
                >
                  🌧️ जल निकासी उपाय (हिन्दी)
                </button>
              </div>

              {/* AI Response Display Area */}
              <div className="min-h-[120px] max-h-[220px] overflow-y-auto p-4 rounded-lg bg-black/40 border border-white/10 text-sm leading-relaxed text-white/90">
                {isAiLoading ? (
                  <div className="flex items-center gap-2.5 text-emerald-400 py-6 justify-center">
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Analyzing sensor telemetry and weather balance...</span>
                  </div>
                ) : aiAnswer ? (
                  <div className="space-y-2">
                    <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Sparkles size={13} /> Mitti AI Agronomic Advice:
                    </div>
                    <p>{aiAnswer}</p>
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-6 text-xs">
                    Ask any question about your crop, irrigation timing, or weather impact.
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskGemini();
                }}
                className="mt-4 flex gap-2"
              >
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask a question about your field in English, हिन्दी, or मराठी..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-emerald-500"
                />
                <Button type="submit" disabled={isAiLoading || !aiQuery.trim()} className="px-4">
                  <Send size={15} />
                </Button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Plot Selector Modal */}
        {isPlotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-surface w-full max-w-lg p-6 rounded-xl border border-white/15 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-emerald-400" />
                  <h3 className="font-semibold text-base">Select Farm Plot Location</h3>
                </div>
                <button
                  onClick={() => setIsPlotModalOpen(false)}
                  className="text-white/60 hover:text-white p-1 rounded-md cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="py-4 space-y-2 max-h-[260px] overflow-y-auto">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                  Pre-Configured Indian Agro-Climatic Belts:
                </div>
                {PRESET_FARM_PLOTS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActivePlot(p);
                      setIsPlotModalOpen(false);
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      activePlot.id === p.id
                        ? "bg-emerald-500/15 border-emerald-500/50 text-white"
                        : "bg-white/5 border-white/5 hover:border-white/20 text-white/80"
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.region} · <span className="text-emerald-400">{p.cropType}</span>
                      </div>
                    </div>
                    <div className="text-xs text-right font-mono text-white/60">
                      {p.latitude.toFixed(4)}°N<br />
                      {p.longitude.toFixed(4)}°E
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Coordinate Form */}
              <form onSubmit={handleSelectCustomCoordinates} className="pt-3 border-t border-white/10">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                  Or Fly to Custom GPS Coordinates:
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="any"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="Latitude (e.g. 19.8762)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs outline-none focus:border-emerald-500 font-mono"
                  />
                  <input
                    type="number"
                    step="any"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    placeholder="Longitude (e.g. 75.3433)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs outline-none focus:border-emerald-500 font-mono"
                  />
                  <Button type="submit" size="sm" className="text-xs">
                    Fly To
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Lightweight Farmer Authentication Modal */}
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-surface w-full max-w-md p-6 rounded-xl border border-white/15 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-amber-400" />
                  <h3 className="font-semibold text-base">Farmer Profile &amp; Device Pairing</h3>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="text-white/60 hover:text-white p-1 rounded-md cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="py-4 space-y-4 text-xs">
                {/* Active Mode */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Active Session Mode:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold">
                      {farmerUser.isGuest ? "Judge / Demo Account" : "Registered Farmer"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Kisan Card ID:</span>
                    <span className="font-mono text-white/90">{farmerUser.kisanId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Assigned IoT Node:</span>
                    <span className="font-mono text-emerald-400 font-semibold">MITTI-ESP32-01</span>
                  </div>
                </div>

                {/* Telemetry Health */}
                <div className="p-3 rounded-lg bg-black/40 border border-white/10 space-y-1.5 text-white/70">
                  <div className="text-[10px] uppercase font-semibold text-white/90 tracking-wider">
                    Paired Node Diagnostics:
                  </div>
                  <div className="flex justify-between">
                    <span>Battery Voltage:</span>
                    <span className="font-mono text-emerald-400">3.94 V (Healthy)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>WiFi RSSI:</span>
                    <span className="font-mono text-emerald-400">-62 dBm (Strong)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Firmware Version:</span>
                    <span className="font-mono">v1.2.4-capacitive</span>
                  </div>
                </div>

                {/* Phone Login Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (mobileInput.trim()) {
                      setFarmerUser({
                        name: "Farmer Ramesh",
                        kisanId: "MH-FAR-4192",
                        mobile: mobileInput,
                        isGuest: false,
                      });
                      setIsAuthModalOpen(false);
                    }
                  }}
                  className="space-y-2 pt-2"
                >
                  <label className="text-[11px] text-muted-foreground block">
                    Switch to Registered Mobile / Kisan ID:
                  </label>
                  <input
                    type="tel"
                    value={mobileInput}
                    onChange={(e) => setMobileInput(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs outline-none focus:border-amber-400 font-mono"
                  />
                  <Button type="submit" className="w-full text-xs">
                    Verify &amp; Switch Account
                  </Button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

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
              <Database size={15} /> Supabase Synchronized
            </span>
          </div>

          <div className="glass-surface history-strip">
            <div className="history-row history-row-featured">
              <span className="history-marker">
                <ArrowDownRight size={16} />
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
                <Check size={15} />
              </span>
              <div className="history-main">
                <div className="history-event-title">
                  Sentinel-2 Pass Ingestion
                  <span className="history-demo-label">COPERNICUS</span>
                </div>
                <div className="history-event-reason">
                  Orbit L2A multi-spectral scene retrieved for plot {activePlot.latitude.toFixed(4)}°N, {activePlot.longitude.toFixed(4)}°E · 0.0% cloud interference.
                </div>
              </div>
              <span className="history-status history-status-muted">PROCESSED</span>
              <span className="history-time">05:41</span>
            </div>

            {confirmedTicks.slice(-3).reverse().map((t, idx) => (
              <div className="history-row" key={`${t}-${idx}`}>
                <span className="history-marker history-marker-reviewed">
                  <Check size={15} />
                </span>
                <div className="history-main">
                  <div className="history-event-title">
                    {farmerUser.name} confirmed recommendation
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
            <Radio size={16} />
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
              <i className="source-mark bg-emerald-400" /> Plot Coordinates: <b>REAL ({activePlot.latitude.toFixed(4)}°N, {activePlot.longitude.toFixed(4)}°E)</b>
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
              <Leaf size={15} /> Mitti Sentinel
            </a>
            <span>Built with honest engineering: real where it counts, transparent where simulated.</span>
            <a className="footer-backtop" href="#home">
              Back to top <ArrowUpRight size={14} />
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
        <circle className="gauge-cap" cx="80" cy="80" r={4} />
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
 * Interactive Leaflet Satellite Map with dynamic plot flyTo
 */
function InteractiveFieldMap({
  plot,
  sceneIndex,
  action,
  mapMode,
}: {
  plot: FarmPlotCoordinates;
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

      const center: [number, number] = [plot.latitude, plot.longitude];

      const map = L.map(containerRef.current, {
        center,
        zoom: 15,
        minZoom: 12,
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
      const polygon = L.polygon(plot.boundaryPolygon, {
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
        title: `${plot.name} (${plot.latitude.toFixed(4)}°N, ${plot.longitude.toFixed(4)}°E)`,
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

  // Update map viewport & plot boundary when user changes plot
  useEffect(() => {
    if (!mapRef.current) return;
    const center: [number, number] = [plot.latitude, plot.longitude];
    mapRef.current.flyTo(center, 15, { duration: 1.2 });

    if (markerRef.current) {
      markerRef.current.setLatLng(center);
      markerRef.current.options.title = `${plot.name} (${plot.cropType})`;
    }

    if (polygonRef.current) {
      polygonRef.current.setLatLngs(plot.boundaryPolygon);
    }
  }, [plot]);

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
      aria-label={`Copernicus Sentinel-2 satellite imagery of plot at ${plot.latitude.toFixed(4)}°N, ${plot.longitude.toFixed(4)}°E in ${mapMode} view`}
    />
  );
}
