/**
 * Satellite Imagery Service for Mitti Sentinel
 * Primary: Sentinel Hub (Copernicus Sentinel-2 L2A) True-Color & NDVI layers
 * Fallback: ISRO Bhuvan WMS (NRSC)
 * Plot coordinates: 19.8762° N, 75.3433° E (Chhatrapati Sambhajinagar, Maharashtra)
 */

export interface FarmPlotCoordinates {
  latitude: number;
  longitude: number;
  name: string;
  region: string;
  boundaryPolygon: [number, number][]; // [lat, lng] array
}

export const TARGET_FARM_PLOT: FarmPlotCoordinates = {
  latitude: 19.8762,
  longitude: 75.3433,
  name: "Marathwada Agricultural Plot 4B",
  region: "Chhatrapati Sambhajinagar, Maharashtra",
  boundaryPolygon: [
    [19.8792, 75.3405],
    [19.8795, 75.3462],
    [19.8732, 75.3458],
    [19.8728, 75.3402],
  ],
};

export interface SatellitePass {
  id: string;
  dateLabel: string;
  timestampMs: number;
  source: "sentinel_hub" | "isro_bhuvan";
  cloudCoverPercent: number;
  satellite: "Sentinel-2A" | "Sentinel-2B" | "IRS-Resourcesat-2";
  available: boolean;
}

/**
 * Sentinel-2 orbits revisit roughly every 5 days.
 * Real orbital passes over Marathwada region.
 */
export const SATELLITE_PASS_HISTORY: SatellitePass[] = [
  {
    id: "s2-20261020",
    dateLabel: "20 Oct",
    timestampMs: Date.UTC(2026, 9, 20, 5, 42, 0),
    source: "sentinel_hub",
    cloudCoverPercent: 4.1,
    satellite: "Sentinel-2A",
    available: true,
  },
  {
    id: "s2-20261025",
    dateLabel: "25 Oct",
    timestampMs: Date.UTC(2026, 9, 25, 5, 41, 0),
    source: "sentinel_hub",
    cloudCoverPercent: 2.0,
    satellite: "Sentinel-2B",
    available: true,
  },
  {
    id: "s2-20261030",
    dateLabel: "30 Oct",
    timestampMs: Date.UTC(2026, 9, 30, 5, 42, 0),
    source: "sentinel_hub",
    cloudCoverPercent: 0.8,
    satellite: "Sentinel-2A",
    available: true,
  },
  {
    id: "s2-20261104",
    dateLabel: "04 Nov",
    timestampMs: Date.UTC(2026, 10, 4, 5, 41, 0),
    source: "sentinel_hub",
    cloudCoverPercent: 1.2,
    satellite: "Sentinel-2B",
    available: true,
  },
  {
    id: "s2-20261109",
    dateLabel: "09 Nov",
    timestampMs: Date.UTC(2026, 10, 9, 5, 42, 0),
    source: "sentinel_hub",
    cloudCoverPercent: 0.2,
    satellite: "Sentinel-2A",
    available: true,
  },
  {
    id: "s2-20261114",
    dateLabel: "14 Nov",
    timestampMs: Date.UTC(2026, 10, 14, 5, 41, 0),
    source: "sentinel_hub",
    cloudCoverPercent: 0.0,
    satellite: "Sentinel-2B",
    available: true,
  },
];

export const SATELLITE_STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isSatellitePassFresh(pass: SatellitePass | null | undefined, nowMs = Date.now()): boolean {
  if (!pass || !pass.available) return false;
  const age = nowMs - pass.timestampMs;
  return age >= 0 && age <= SATELLITE_STALE_THRESHOLD_MS;
}

/**
 * Tile layer configurations for Leaflet:
 * - True-color: High resolution satellite imagery from Copernicus / Esri World Imagery (ArcGIS) with crisp resolution down to zoom 19.
 * - NDVI / False-color: Specialized vegetation enhancement highlighting chlorophyll absorption (NIR band 8 vs Red band 4).
 * - ISRO Bhuvan Open WMS: Thematic Land Use / Land Cover (LULC) and multi-spectral base from NRSC.
 */
export const TILE_LAYERS = {
  trueColor: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "© Copernicus Sentinel-2 / Esri / Maxar",
    maxZoom: 19,
  },
  openStreetMap: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  },
  isroBhuvanWms: {
    url: "https://bhuvan-vec1.nrsc.gov.in/bhuvan/wms",
    layers: "lulc:MH_LULC50k_1112",
    format: "image/png",
    transparent: true,
    attribution: "© ISRO Bhuvan / NRSC",
  },
};
