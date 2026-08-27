import Papa from "papaparse";
import type { DisasterEvent } from "../types";
import { clusterByDistance } from "../geo";

const BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv";
// west,south,east,north - matches the spec's Indonesia bbox order.
const INDONESIA_BBOX = "95,-11,141,6";
const DAY_RANGE = 3;

const PRODUCTS = ["VIIRS_NOAA20_NRT", "VIIRS_SNPP_NRT", "MODIS_NRT"] as const;
type Product = (typeof PRODUCTS)[number];

// VIIRS and MODIS CSVs share most columns but not all: VIIRS reports
// `bright_ti4` and a categorical confidence (l/n/h); MODIS reports
// `brightness` and a numeric confidence (0-100). Confirmed against real
// samples pulled with a live MAP_KEY in Phase 0 - this wasn't in the spec.
type FirmsRow = {
  latitude: string;
  longitude: string;
  bright_ti4?: string;
  brightness?: string;
  confidence: string;
  acq_date: string;
  acq_time: string;
  frp: string;
  satellite: string;
  daynight: string;
};

export type FirmsHotspot = {
  lat: number;
  lon: number;
  brightnessK: number;
  confidencePercent: number;
  acqDate: string;
  acqTime: string;
  frp: number;
  satellite: string;
  product: Product;
  daynight: string;
};

function normalizeConfidence(row: FirmsRow, product: Product): number {
  if (product === "MODIS_NRT") {
    return Number.parseFloat(row.confidence);
  }
  // VIIRS: l(ow)=25, n(ominal)=50, h(igh)=90 - approximate numeric mapping
  // for consistent filtering across products; the letter is kept in raw data.
  switch (row.confidence) {
    case "h":
      return 90;
    case "n":
      return 50;
    case "l":
    default:
      return 25;
  }
}

async function fetchProduct(mapKey: string, product: Product): Promise<FirmsHotspot[]> {
  const url = `${BASE_URL}/${mapKey}/${product}/${INDONESIA_BBOX}/${DAY_RANGE}`;
  const res = await fetch(url, { next: { revalidate: 900 } });
  if (!res.ok) {
    throw new Error(`FIRMS ${product} returned HTTP ${res.status}`);
  }
  const csvText = await res.text();
  if (csvText.startsWith("Invalid") || csvText.length < 20) {
    throw new Error(`FIRMS ${product} returned an error body: ${csvText.slice(0, 100)}`);
  }

  const parsed = Papa.parse<FirmsRow>(csvText, { header: true, skipEmptyLines: true });

  return parsed.data.map((row) => ({
    lat: Number.parseFloat(row.latitude),
    lon: Number.parseFloat(row.longitude),
    brightnessK: Number.parseFloat(row.bright_ti4 ?? row.brightness ?? "0"),
    confidencePercent: normalizeConfidence(row, product),
    acqDate: row.acq_date,
    acqTime: row.acq_time,
    frp: Number.parseFloat(row.frp),
    satellite: row.satellite,
    product,
    daynight: row.daynight,
  }));
}

export async function fetchAllFirmsHotspots(mapKey: string): Promise<FirmsHotspot[]> {
  const results = await Promise.allSettled(PRODUCTS.map((product) => fetchProduct(mapKey, product)));
  const hotspots: FirmsHotspot[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") hotspots.push(...result.value);
  }
  return hotspots;
}

export type WildfireCluster = {
  id: string;
  centerLat: number;
  centerLon: number;
  pointCount: number;
  totalFrp: number;
  todayCount: number;
  yesterdayCount: number;
  latestAcqDate: string;
  points: FirmsHotspot[];
};

const CLUSTER_EPSILON_KM = 5;
const MIN_CLUSTER_POINTS = 2;

export function clusterHotspots(hotspots: FirmsHotspot[]): WildfireCluster[] {
  const groups = clusterByDistance(hotspots, CLUSTER_EPSILON_KM, (h) => ({ lat: h.lat, lon: h.lon }));

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  return groups
    .filter((group) => group.length >= MIN_CLUSTER_POINTS)
    .map((group, index) => {
      const centerLat = group.reduce((sum, p) => sum + p.lat, 0) / group.length;
      const centerLon = group.reduce((sum, p) => sum + p.lon, 0) / group.length;
      const totalFrp = group.reduce((sum, p) => sum + p.frp, 0);
      const todayCount = group.filter((p) => p.acqDate === today).length;
      const yesterdayCount = group.filter((p) => p.acqDate === yesterday).length;
      const latestAcqDate = group.reduce((max, p) => (p.acqDate > max ? p.acqDate : max), group[0].acqDate);

      return {
        id: `karhutla-${centerLat.toFixed(3)}-${centerLon.toFixed(3)}-${index}`,
        centerLat,
        centerLon,
        pointCount: group.length,
        totalFrp,
        todayCount,
        yesterdayCount,
        latestAcqDate,
        points: group,
      };
    });
}

function provisionalSeverity(cluster: WildfireCluster): 1 | 2 | 3 | 4 | 5 {
  // Placeholder combining point count and total FRP; the real aktif/mereda/
  // selesai + severity rules land in the Phase 3 status engine.
  const score = cluster.pointCount + cluster.totalFrp / 20;
  if (score >= 100) return 5;
  if (score >= 50) return 4;
  if (score >= 20) return 3;
  if (score >= 8) return 2;
  return 1;
}

const SEVERITY_LABEL_BY_LEVEL = {
  1: "Ringan",
  2: "Sedang",
  3: "Berat",
  4: "Sangat Berat",
  5: "Kritis",
} as const;

export function wildfireClusterToEvent(cluster: WildfireCluster): DisasterEvent {
  const severity = provisionalSeverity(cluster);
  return {
    id: cluster.id,
    type: "karhutla",
    title: `Titik Panas (${cluster.pointCount} deteksi) di ${cluster.centerLat.toFixed(2)}, ${cluster.centerLon.toFixed(2)}`,
    lat: cluster.centerLat,
    lon: cluster.centerLon,
    province: null,
    occurredAt: `${cluster.latestAcqDate}T00:00:00Z`,
    lastUpdatedAt: new Date().toISOString(),
    severity,
    severityLabel: SEVERITY_LABEL_BY_LEVEL[severity],
    status: "tidak-diketahui",
    statusReason:
      "Status karhutla (aktif/mereda/selesai) memerlukan perbandingan jumlah deteksi hari ini vs kemarin - belum diimplementasikan. Catatan: titik panas adalah sinyal panas satelit, bukan konfirmasi kebakaran.",
    raw: { pointCount: cluster.pointCount, totalFrp: cluster.totalFrp, points: cluster.points.length },
    sourceName: "NASA FIRMS",
    sourceUrl: "https://firms.modaps.eosdis.nasa.gov/",
  };
}
