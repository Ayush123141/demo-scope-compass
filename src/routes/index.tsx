import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleHelp,
  CloudRain,
  Droplets,
  Leaf,
  LocateFixed,
  Map,
  Radio,
  RefreshCw,
  ScanLine,
  Sparkles,
  Sun,
  Waves,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  createDemoSnapshot,
  formatRainfall,
  type FieldAction,
} from "@/lib/farm-simulator";
import "leaflet/dist/leaflet.css";
import demoFieldMap from "@/assets/demo-field-map.jpg";

const actionCopy: Record<
  FieldAction,
  { en: { title: string; reason: string }; hi: { title: string; reason: string }; mr: { title: string; reason: string } }
> = {
  irrigate_now: {
    en: { title: "Check before watering", reason: "Soil is on the dry side, with little rain in the outlook. Check the crop before watering." },
    hi: { title: "पानी देने से पहले जाँचें", reason: "मिट्टी थोड़ी सूखी है और बारिश की संभावना कम है। पानी देने से पहले फसल की जाँच करें।" },
    mr: { title: "पाणी देण्यापूर्वी तपासा", reason: "माती थोडी कोरडी आहे आणि पावसाची शक्यता कमी आहे. पाणी देण्यापूर्वी पिकाची पाहणी करा." },
  },
  hold_off: {
    en: { title: "Check the soil again", reason: "Moisture bears watching. Recheck the soil before choosing to irrigate." },
    hi: { title: "मिट्टी दोबारा जाँचें", reason: "नमी पर नज़र रखें। सिंचाई का फैसला लेने से पहले मिट्टी फिर जाँचें।" },
    mr: { title: "माती पुन्हा तपासा", reason: "ओलाव्यावर लक्ष ठेवा. पाणी देण्याचा निर्णय घेण्यापूर्वी माती पुन्हा तपासा." },
  },
  protect_crop: {
    en: { title: "Prepare for rainfall", reason: "Rain may arrive while soil still holds moisture. Prepare the field for heavier showers." },
    hi: { title: "बारिश के लिए तैयारी करें", reason: "मिट्टी में नमी है और बारिश आ सकती है। तेज़ बारिश के लिए खेत तैयार रखें।" },
    mr: { title: "पावसाची तयारी करा", reason: "मातीमध्ये ओलावा असताना पाऊस येऊ शकतो. जोरदार सरींसाठी शेत तयार ठेवा." },
  },
  no_action_needed: {
    en: { title: "Conditions look steady", reason: "Moisture and the rainfall outlook look steady. Check again with your next reading." },
    hi: { title: "स्थिति स्थिर लगती है", reason: "नमी और बारिश का अनुमान स्थिर है। अगली रीडिंग पर फिर जाँचें।" },
    mr: { title: "परिस्थिती स्थिर दिसते", reason: "ओलावा आणि पावसाचा अंदाज स्थिर दिसतो. पुढच्या रीडिंगमध्ये पुन्हा तपासा." },
  },
};

type Language = "en" | "hi" | "mr";
type MapMode = "true" | "vegetation";

const languageLabels: Record<Language, string> = { en: "EN", hi: "हिं", mr: "मर" };
const observationLabels = ["20 Oct", "25 Oct", "30 Oct", "04 Nov", "09 Nov", "14 Nov"];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mitti Sentinel — Field intelligence, made clear" },
      { name: "description", content: "A map-led field dashboard for soil moisture, crop observations, and transparent, farmer-first recommendations." },
      { property: "og:title", content: "Mitti Sentinel — Field intelligence, made clear" },
      { property: "og:description", content: "A map-led field dashboard for soil moisture, crop observations, and transparent, farmer-first recommendations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;650;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: MittiSentinel,
});

function MittiSentinel() {
  const [snapshot, setSnapshot] = useState(() => createDemoSnapshot());
  const [mapMode, setMapMode] = useState<MapMode>("true");
  const [sceneIndex, setSceneIndex] = useState(observationLabels.length - 1);
  const [language, setLanguage] = useState<Language>("en");
  const [confirmedIds, setConfirmedIds] = useState<number[]>([]);
  const [nowLabel, setNowLabel] = useState("08:00");
  const reduceMotion = useReducedMotion();
  const copy = actionCopy[snapshot.decision.action]?.[language] ?? actionCopy.no_action_needed.en;
  const isConfirmed = confirmedIds.includes(snapshot.tick);
  const fadeIn = reduceMotion ? {} : { initial: { opacity: 0, y: 14 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.12 }, transition: { duration: 0.45 } };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSnapshot((current) => createDemoSnapshot(current.tick + 1));
      setNowLabel((previous) => {
        const [hourText = "08", minuteText = "00"] = previous.split(":");
        const nextMinute = (Number(minuteText) + 1) % 60;
        const nextHour = (Number(hourText) + (nextMinute === 0 ? 1 : 0)) % 24;
        return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  function refreshReading() {
    setSnapshot((current) => createDemoSnapshot(current.tick + 1));
  }

  function confirmRecommendation() {
    if (isConfirmed || snapshot.decision.sourceLabel === "Data unavailable") return;
    setConfirmedIds((current) => [...current, snapshot.tick]);
  }

  return (
    <main className="app-canvas min-h-screen overflow-x-hidden text-foreground">
      <div className="ambient-field" aria-hidden="true" />
      <header className="topbar">
        <a className="brand-mark" href="#home" aria-label="Mitti Sentinel home">
          <span className="brand-icon"><Leaf size={18} strokeWidth={2} /></span>
          <span className="brand-name">mitti<span>sentinel</span></span>
        </a>
        <nav className="topnav" aria-label="Main navigation">
          <a className="nav-link nav-link-active" href="#dashboard">Dashboard</a>
          <a className="nav-link" href="#history">History</a>
          <a className="nav-link" href="#sources">Data sources</a>
        </nav>
        <div className="topbar-right">
          <span className="demo-pill"><span className="status-dot" />Live demo</span>
          <span className="avatar-chip" aria-label="Farmer profile">A</span>
        </div>
      </header>

      <div className="page-frame">
        <motion.section id="home" className="intro-band" {...fadeIn}>
          <div className="intro-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> FIELD INTELLIGENCE <span className="eyebrow-separator">/</span> MON 16 NOV</div>
            <h1>A clearer read<br className="desktop-break" /> on <span>your field.</span></h1>
            <p>One place for what's happening in the soil, above the crop, and next.</p>
          </div>
          <div className="field-selector" aria-label="Selected field: demo plot">
            <span className="field-selector-mark"><LocateFixed size={17} /></span>
            <span className="field-selector-copy"><span className="micro-label">YOUR FIELD</span><span className="field-selector-name">Demo plot <span className="field-selector-dot">·</span> Maharashtra</span></span>
            <ChevronDown size={16} className="field-selector-chevron" />
          </div>
        </motion.section>

        <section className="dashboard-grid" id="dashboard" aria-label="Field dashboard">
          <motion.section className="glass-surface map-panel" {...fadeIn} aria-labelledby="map-title">
            <div className="panel-heading map-heading">
              <div className="panel-title-group">
                <span className="panel-icon"><Map size={17} /></span>
                <div><h2 id="map-title" className="panel-title">Field overview</h2><p className="panel-subtitle">Illustrative field view <span className="subtle-divider">·</span> location not supplied</p></div>
              </div>
              <div className="view-toggle" role="group" aria-label="Field map color mode">
                <Button variant={mapMode === "true" ? "toggleActive" : "toggle"} size="sm" onClick={() => setMapMode("true")} aria-pressed={mapMode === "true"}><Sun size={13} /> True color</Button>
                <Button variant={mapMode === "vegetation" ? "toggleActive" : "toggle"} size="sm" onClick={() => setMapMode("vegetation")} aria-pressed={mapMode === "vegetation"}><Leaf size={13} /> Vegetation</Button>
              </div>
            </div>

            <div className={`field-map-shell field-mode-${mapMode} field-risk-${snapshot.decision.action}`}>
              <InteractiveFieldMap sceneIndex={sceneIndex} action={snapshot.decision.action} />
              <div className="map-note"><CircleHelp size={13} /><span>Illustration — not satellite imagery</span></div>
              <div className="map-image-pill"><span className="image-pill-dot" /> {mapMode === "true" ? "TRUE COLOR" : "VEGETATION VIEW"}</div>
              <div className="map-legend"><span className="legend-outline" /> Demo field boundary</div>
              <div className="map-area-pill">MAHARASHTRA · SAMPLE VIEW</div>
            </div>

            <div className="map-scrubber">
              <div className="scrubber-topline"><div className="scrubber-label"><Activity size={14} /><span>Field observations</span></div><span className="scrubber-value">{observationLabels[sceneIndex] ?? "14 Nov"} <span>· demo</span></span></div>
              <Slider min={0} max={observationLabels.length - 1} step={1} value={[sceneIndex]} onValueChange={(value) => setSceneIndex(value[0] ?? 0)} aria-label="Illustrative observation date" className="map-slider" />
              <div className="scrubber-dates"><span>20 Oct</span><span>04 Nov</span><span>14 Nov <span className="latest-tick" /></span></div>
            </div>
          </motion.section>

          <motion.section className="glass-surface moisture-panel" {...fadeIn} aria-labelledby="moisture-title">
            <div className="panel-heading">
              <div className="panel-title-group"><span className="panel-icon panel-icon-green"><Droplets size={17} /></span><div><h2 id="moisture-title" className="panel-title">Soil moisture</h2><p className="panel-subtitle">Demo sensor reading <span className="offline-chip">NOT CONNECTED</span></p></div></div>
              <Button variant="iconGhost" size="icon" onClick={refreshReading} aria-label="Generate another demo reading" title="Generate another demo reading"><RefreshCw size={15} /></Button>
            </div>
            <MoistureGauge value={snapshot.moisture.moisturePercent} reducedMotion={Boolean(reduceMotion)} />
            <div className="gauge-footer"><span className="reading-time"><span className="tiny-status-dot" /> Latest demo sample</span><span className="reading-time">{nowLabel} <span className="time-zone-label">IST</span></span></div>
            <div className="moisture-ranges"><span>DRY</span><span>WATCH</span><span>GOOD</span></div>
          </motion.section>

          <motion.section className={`glass-surface recommendation-panel risk-panel-${snapshot.decision.action}`} {...fadeIn} aria-labelledby="recommendation-title" aria-live="polite">
            <div className="panel-heading recommendation-heading">
              <div className="panel-title-group"><span className="panel-icon panel-icon-amber"><Sparkles size={17} /></span><div><h2 id="recommendation-title" className="panel-title">Field recommendation</h2><p className="panel-subtitle">Rule-based demo <span className="subtle-divider">·</span> not agronomy advice</p></div></div>
              <label className="language-picker"><span className="sr-only">Recommendation language</span><select aria-label="Recommendation language" value={language} onChange={(event) => setLanguage(event.target.value as Language)}>{Object.entries(languageLabels).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select><ChevronDown size={13} aria-hidden="true" /></label>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div className="recommendation-body" key={`${snapshot.tick}-${language}`} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -5 }} transition={{ duration: reduceMotion ? 0 : 0.22 }}>
                <div className="action-title-row"><h3>{copy.title}</h3><span className={`confidence-chip ${snapshot.decision.confidencePercent === 0 ? "confidence-unavailable" : ""}`}>{snapshot.decision.confidencePercent === 0 ? "—" : `${snapshot.decision.confidencePercent}%`} confidence</span></div>
                <p className="recommendation-reason">{snapshot.decision.reason}</p>
                <div className={`recommendation-source ${snapshot.decision.confidencePercent === 0 ? "recommendation-source-warning" : ""}`}><Waves size={13} /><span>{snapshot.decision.sourceLabel}: simulated signals only</span></div>
                <Button variant={isConfirmed ? "confirmed" : "recommendation"} size="default" onClick={confirmRecommendation} disabled={isConfirmed || snapshot.decision.confidencePercent === 0} className="recommendation-button">{isConfirmed ? <><Check size={15} /> Recorded for this demo</> : <>I’ve reviewed this <ArrowRight size={15} /></>}</Button>
                <p className="no-control-note">Your confirmation is only noted here. It does not control irrigation.</p>
              </motion.div>
            </AnimatePresence>
          </motion.section>

          <motion.section className="glass-surface health-panel" {...fadeIn} aria-labelledby="health-title">
            <div className="panel-heading">
              <div className="panel-title-group"><span className="panel-icon panel-icon-lime"><Leaf size={16} /></span><div><h2 id="health-title" className="panel-title">Field outlook</h2><p className="panel-subtitle">Demo estimate · not a diagnosis</p></div></div>
              <span className="trend-chip"><ArrowUpRight size={13} /> STEADY</span>
            </div>
            <div className="health-metrics"><div className="health-score"><span>{snapshot.fieldHealthPercent}</span><span className="score-max">/100</span></div><div className="health-score-label">Estimated field health</div></div>
            <div className="health-meter" aria-hidden="true"><span style={{ width: `${snapshot.fieldHealthPercent}%` }} /></div>
            <div className="health-footer"><span><CloudRain size={14} /> Rain next 24h</span><strong>{formatRainfall(snapshot.forecast.rainfallMm24h)}</strong></div>
          </motion.section>
        </section>

        <motion.section id="history" className="history-section" {...fadeIn} aria-labelledby="history-title">
          <div className="section-heading-row"><div><div className="eyebrow"><span className="eyebrow-line" /> FIELD NOTES</div><h2 id="history-title" className="section-title">The recent picture.</h2></div><span className="history-counter"><Activity size={14} /> Local demo session</span></div>
          <div className="glass-surface history-strip">
            <div className="history-row history-row-featured"><span className="history-marker"><ArrowDownRight size={15} /></span><div className="history-main"><div className="history-event-title">{copy.title}<span className="history-demo-label">DEMO</span></div><div className="history-event-reason">{snapshot.decision.reason}</div></div><span className="history-status">{isConfirmed ? "REVIEWED" : snapshot.decision.sourceLabel === "Data unavailable" ? "WAITING" : "TO REVIEW"}</span><span className="history-time">{nowLabel}</span></div>
            <div className="history-row"><span className="history-marker history-marker-quiet"><Check size={14} /></span><div className="history-main"><div className="history-event-title">Field image preview captured<span className="history-demo-label">DEMO</span></div><div className="history-event-reason">Illustrative image only · no real satellite pass or field coordinates connected.</div></div><span className="history-status history-status-muted">PREVIEW</span><span className="history-time">07:30</span></div>
            {confirmedIds.slice(-2).reverse().map((id, index) => <div className="history-row" key={`${id}-${index}`}><span className="history-marker history-marker-reviewed"><Check size={14} /></span><div className="history-main"><div className="history-event-title">Farmer reviewed a demo recommendation<span className="history-demo-label">SESSION</span></div><div className="history-event-reason">No command sent to a device.</div></div><span className="history-status history-status-reviewed">REVIEWED</span><span className="history-time">{index === 0 ? "NOW" : "EARLIER"}</span></div>)}
          </div>
        </motion.section>

        <footer id="sources" className="trust-footer">
          <div className="trust-heading"><Radio size={15} /><span>What’s powering this view</span></div>
          <div className="trust-sources"><span><i className="source-mark source-mark-muted" /> Sensor <b>demo sample</b></span><span><i className="source-mark source-mark-muted" /> Map image <b>illustration</b></span><span><i className="source-mark source-mark-amber" /> Rain outlook <b>simulated</b></span><span><i className="source-mark source-mark-amber" /> Field estimate <b>simulated</b></span><span><i className="source-mark source-mark-muted" /> Recommendations <b>demo only</b></span></div>
          <div className="trust-disclaimer">Decision support, not certified agronomy. Always verify conditions on the ground.</div>
          <div className="footer-bottom"><a className="footer-brand" href="#home"><Leaf size={14} /> Mitti Sentinel</a><span>Built to be clear about what it knows — and what it doesn’t.</span><a className="footer-backtop" href="#home">Back to top <ArrowUpRight size={13} /></a></div>
        </footer>
      </div>
    </main>
  );
}

function MoistureGauge({ value, reducedMotion }: { value: number; reducedMotion: boolean }) {
  const radius = 57;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className="gauge-wrap" role="meter" aria-label="Demo soil moisture" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <svg className="gauge-svg" viewBox="0 0 160 160" aria-hidden="true">
        <circle className="gauge-track" cx="80" cy="80" r={radius} />
        <motion.circle className="gauge-fill" cx="80" cy="80" r={radius} initial={false} animate={{ strokeDashoffset: circumference * (1 - progress) }} transition={{ duration: reducedMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }} />
        <circle className="gauge-cap" cx="80" cy="80" r="4" />
      </svg>
      <div className="gauge-center"><motion.div key={value} initial={reducedMotion ? false : { opacity: 0.45, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.32 }} className="gauge-reading">{value}<span>%</span></motion.div><div className="gauge-condition">MOISTURE</div></div>
    </div>
  );
}

function InteractiveFieldMap({ sceneIndex, action }: { sceneIndex: number; action: FieldAction }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    let map: import("leaflet").Map | null = null;
    void import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;
      map = L.map(containerRef.current, { crs: L.CRS.Simple, zoomControl: true, attributionControl: false, minZoom: -0.5, maxZoom: 2, zoomSnap: 0.25, scrollWheelZoom: false });
      L.imageOverlay(demoFieldMap, [[0, 0], [1024, 1536]]).addTo(map);
      const fieldBoundary: [number, number][] = [[235, 422], [236, 1020], [760, 1022], [755, 424]];
      L.polygon(fieldBoundary, { className: "field-outline", weight: 2, fillOpacity: 0.07, interactive: false }).addTo(map);
      const initialIcon = L.divIcon({ className: `mitti-map-marker mitti-map-marker--${action}`, html: "<span></span>", iconSize: [22, 22], iconAnchor: [11, 11] });
      markerRef.current = L.marker([520, 720], { icon: initialIcon, keyboard: false, title: "Illustrative demo plot — location not supplied" }).addTo(map);
      map.fitBounds([[20, 0], [980, 1536]], { padding: [4, 4] });
      mapRef.current = map;
      window.setTimeout(() => map?.invalidateSize(), 50);
    });
    return () => {
      cancelled = true;
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!markerRef.current) return;
    void import("leaflet").then((L) => {
      const icon = L.divIcon({ className: `mitti-map-marker mitti-map-marker--${action}`, html: "<span></span>", iconSize: [22, 22], iconAnchor: [11, 11] });
      markerRef.current?.setIcon(icon);
    });
  }, [action]);

  return <div className="field-map" data-scene={sceneIndex} ref={containerRef} role="img" aria-label={`Interactive illustrative field map, observation ${observationLabels[sceneIndex] ?? "14 Nov"}. No live satellite imagery or actual location connected.`} />;
}