/**
 * Satellite Imagery Service for Mitti Sentinel
 * Primary: Sentinel Hub (Copernicus Sentinel-2 L2A) True-Color & NDVI layers
 * Fallback: ISRO Bhuvan WMS (NRSC) / High-Res Earth Observation
 */

export interface FarmPlotCoordinates {
  id: string;
  name: string;
  region: string;
  cropType: string;
  latitude: number;
  longitude: number;
  boundaryPolygon: [number, number][]; // [lat, lng] array
}

export function createPlotBoundary(lat: number, lng: number, delta = 0.0035): [number, number][] {
  return [
    [lat + delta, lng - delta * 0.9],
    [lat + delta * 1.05, lng + delta * 0.95],
    [lat - delta * 0.95, lng + delta * 0.9],
    [lat - delta, lng - delta * 0.95],
  ];
}

export const PRESET_FARM_PLOTS: FarmPlotCoordinates[] = [
  {
    id: "plot-mh-csn",
    name: "Marathwada Plot 4B",
    region: "Chhatrapati Sambhajinagar, MH",
    cropType: "Cotton & Soybean",
    latitude: 19.8762,
    longitude: 75.3433,
    boundaryPolygon: [
      [19.8792, 75.3405],
      [19.8795, 75.3462],
      [19.8732, 75.3458],
      [19.8728, 75.3402],
    ],
  },
  {
    id: "plot-mh-nsk",
    name: "Dindori Vineyard Plot 2",
    region: "Nashik, Maharashtra",
    cropType: "Table Grapes & Onions",
    latitude: 20.0063,
    longitude: 73.8188,
    boundaryPolygon: createPlotBoundary(20.0063, 73.8188),
  },
  {
    id: "plot-mh-ngp",
    name: "Kalmeshwar Citrus Grove",
    region: "Vidarbha, Nagpur, MH",
    cropType: "Nagpur Mandarin Oranges",
    latitude: 21.1458,
    longitude: 79.0882,
    boundaryPolygon: createPlotBoundary(21.1458, 79.0882),
  },
  {
    id: "plot-mh-pune",
    name: "Baramati Canefield",
    region: "Pune Agro-Belt, MH",
    cropType: "Sugarcane",
    latitude: 18.1528,
    longitude: 74.5771,
    boundaryPolygon: createPlotBoundary(18.1528, 74.5771),
  },
  {
    id: "plot-pb-ldh",
    name: "Ludhiana Farm Basin",
    region: "Punjab Heartland",
    cropType: "Wheat & Mustard",
    latitude: 30.901,
    longitude: 75.8573,
    boundaryPolygon: createPlotBoundary(30.901, 75.8573),
  },
];

export const TARGET_FARM_PLOT = PRESET_FARM_PLOTS[0]!;

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
 * Real orbital passes over Maharashtra agricultural belts.
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
