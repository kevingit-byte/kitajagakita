import Papa from "papaparse";
import { clusterByDistance } from "../geo";
import { isNearStaticSource } from "../firms/staticSources";
import type { WildfireCluster } from "../status/wildfire";

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
//
// Neither CSV has a `type` field (0=vegetation fire, 1=volcano, 2=other
// static land source, 3=offshore) - confirmed against both saved samples
// and a fresh live fetch, the NRT area/csv API this app uses simply does
// not return that column. A `type`-carrying product exists
// (VIIRS_NOAA20_SP, "Standard Processing") but returned zero detections
// for all of Indonesia over a full day when tested - unusably stale for a
// 15-minute-refresh app. So there is no `type`-based filter here; the
// confidence filter below and lib/firms/staticSources.ts are the only two
// layers actually available against this data source.
export type FirmsRow = {
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
  // for display/scoring; filtering itself uses the raw category, not this.
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

/**
 * VIIRS confidence is categorical (l/n/h) - drop low-confidence detections
 * entirely. MODIS confidence is numeric 0-100, a genuinely different scale
 * that must not be treated as the same thing (that would be a real bug:
 * MODIS's "confidence" number and VIIRS's letter code aren't comparable).
 * Threshold of >=80 for MODIS follows KLHK SiPongi practice.
 */
export function passesConfidenceFilter(row: FirmsRow, product: Product): boolean {
  if (product === "MODIS_NRT") {
    return Number.parseFloat(row.confidence) >= 80;
  }
  return row.confidence === "n" || row.confidence === "h";
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

  return parsed.data
    .filter((row) => passesConfidenceFilter(row, product))
    .map((row) => ({
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
    }))
    .filter((hotspot) => isNearStaticSource(hotspot.lat, hotspot.lon) === null);
}

export async function fetchAllFirmsHotspots(mapKey: string): Promise<FirmsHotspot[]> {
  const results = await Promise.allSettled(PRODUCTS.map((product) => fetchProduct(mapKey, product)));
  const hotspots: FirmsHotspot[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") hotspots.push(...result.value);
  }
  return hotspots;
}

const CLUSTER_EPSILON_KM = 5;
const MIN_CLUSTER_POINTS = 2;

export function clusterHotspots(hotspots: FirmsHotspot[]): WildfireCluster[] {
  const groups = clusterByDistance(hotspots, CLUSTER_EPSILON_KM, (h) => ({ lat: h.lat, lon: h.lon }));

  return groups
    .filter((group) => group.length >= MIN_CLUSTER_POINTS)
    .map((group, index) => {
      const centerLat = group.reduce((sum, p) => sum + p.lat, 0) / group.length;
      const centerLon = group.reduce((sum, p) => sum + p.lon, 0) / group.length;
      const totalFrp = group.reduce((sum, p) => sum + p.frp, 0);
      const countsByDate: Record<string, number> = {};
      for (const p of group) {
        countsByDate[p.acqDate] = (countsByDate[p.acqDate] ?? 0) + 1;
      }
      const latestAcqDate = group.reduce((max, p) => (p.acqDate > max ? p.acqDate : max), group[0].acqDate);

      return {
        id: `karhutla-${centerLat.toFixed(3)}-${centerLon.toFixed(3)}-${index}`,
        centerLat,
        centerLon,
        pointCount: group.length,
        totalFrp,
        countsByDate,
        latestAcqDate,
        points: group,
      };
    });
}
