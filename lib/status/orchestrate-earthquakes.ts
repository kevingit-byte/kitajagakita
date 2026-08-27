import { fetchAllBmkgQuakes, type BmkgQuake } from "../sources/bmkg";
import { fetchUsgsQuakes, type UsgsQuake } from "../sources/usgs";
import { buildQuakeSequences, type QuakeInput, type QuakeSequence } from "./earthquake";
import { parseRegionSig } from "./mmi";
import { haversineDistanceKm } from "../geo";
import type { DisasterEvent, RegionIntensity, Tindakan } from "../types";

const SAME_EVENT_DISTANCE_KM = 15;
const SAME_EVENT_TIME_MS = 5 * 60 * 1000;

function bmkgToQuakeInput(q: BmkgQuake): QuakeInput {
  return {
    id: q.id,
    magnitude: q.magnitude,
    timeMs: new Date(q.dateTime).getTime(),
    lat: q.lat,
    lon: q.lon,
    depthKm: q.depthKm,
    place: q.wilayah,
    dirasakan: q.dirasakan,
  };
}

/**
 * `tindakan` is this app's own cross-hazard urgency signal, not an official
 * reading - unlike `intensitas` (which must never be estimated), deriving
 * it from magnitude when nobody has reported feeling the quake yet is a
 * legitimate rules-based fallback, not a fabricated government figure.
 */
function tindakanFromMagnitude(magnitude: number): Tindakan {
  if (magnitude >= 6) return "siaga";
  if (magnitude >= 5) return "waspada";
  return "normal";
}

function tindakanFromMaxSig(regions: RegionIntensity[]): Tindakan {
  const maxSig = Math.max(...regions.map((r) => r.sig));
  if (maxSig >= 5) return "awas";
  if (maxSig >= 4) return "siaga";
  if (maxSig >= 3) return "waspada";
  return "normal";
}

function usgsToQuakeInput(q: UsgsQuake): QuakeInput {
  return {
    id: q.id,
    magnitude: q.magnitude,
    timeMs: q.timeMs,
    lat: q.lat,
    lon: q.lon,
    depthKm: q.depthKm,
    place: q.place,
  };
}

/**
 * BMKG only returns ~15-45 recent quakes (no history), so aftershock
 * sequence detection needs USGS's 30-day window too. The same physical
 * quake shows up in both feeds under different IDs - merge by proximity
 * (15km / 5min) rather than treating them as separate events, keeping
 * BMKG's copy when they match since it carries `Dirasakan` MMI that USGS
 * doesn't have.
 */
function mergeQuakeSources(bmkgQuakes: BmkgQuake[], usgsQuakes: UsgsQuake[]): QuakeInput[] {
  const bmkgInputs = bmkgQuakes.map(bmkgToQuakeInput);
  const usedUsgsIds = new Set<string>();

  for (const bmkg of bmkgInputs) {
    const match = usgsQuakes.find(
      (u) =>
        !usedUsgsIds.has(u.id) &&
        Math.abs(u.timeMs - bmkg.timeMs) <= SAME_EVENT_TIME_MS &&
        haversineDistanceKm(u.lat, u.lon, bmkg.lat, bmkg.lon) <= SAME_EVENT_DISTANCE_KM,
    );
    if (match) usedUsgsIds.add(match.id);
  }

  const unmatchedUsgs = usgsQuakes.filter((u) => !usedUsgsIds.has(u.id)).map(usgsToQuakeInput);
  return [...bmkgInputs, ...unmatchedUsgs];
}

function findSequenceFor(quakeId: string, sequences: QuakeSequence[]): QuakeSequence | null {
  return (
    sequences.find(
      (seq) => seq.mainshock.id === quakeId || seq.aftershocks.some((a) => a.id === quakeId),
    ) ?? null
  );
}

/**
 * BMKG stays the display source of truth (title, wilayah, source
 * attribution) per the spec; USGS's 30-day window only feeds sequence
 * detection so status reflects the whole aftershock sequence, not just a
 * single reading.
 */
export function bmkgQuakeToSequencedEvent(quake: BmkgQuake, sequences: QuakeSequence[]): DisasterEvent {
  const input = bmkgToQuakeInput(quake);
  const sequence = findSequenceFor(quake.id, sequences);

  const status = sequence?.status ?? "tidak-diketahui";
  const statusReason =
    sequence?.statusReason ??
    "Gempa ini tidak ditemukan dalam data USGS 30 hari untuk analisis rangkaian - status tidak dapat dipastikan.";
  const isMainshock = sequence?.mainshock.id === quake.id;
  const aftershockCount = sequence?.aftershocks.length ?? 0;

  const regionIntensities = parseRegionSig(quake.dirasakan);
  const tindakan = regionIntensities ? tindakanFromMaxSig(regionIntensities) : tindakanFromMagnitude(input.magnitude);

  return {
    id: quake.id,
    type: "gempa",
    title: `Gempa M${quake.magnitude} - ${quake.wilayah}`,
    lat: quake.lat,
    lon: quake.lon,
    province: null,
    occurredAt: quake.dateTime,
    lastUpdatedAt: quake.dateTime,
    // Felt intensity is per-region, not per-event - see regionIntensities.
    // Never a single number here, and never estimated from magnitude.
    intensitas: null,
    tindakan,
    regionIntensities,
    status,
    statusReason:
      aftershockCount > 0
        ? `${statusReason} (Bagian dari rangkaian ${aftershockCount + 1} gempa${isMainshock ? ", ini gempa utama" : ""}.)`
        : statusReason,
    raw: quake,
    sourceName: "BMKG",
    sourceUrl: "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
  };
}

export async function fetchGempaEvents(): Promise<{
  events: DisasterEvent[];
  bmkgOk: boolean;
  usgsOk: boolean;
  bmkgError?: string;
  usgsError?: string;
}> {
  const [bmkgResult, usgsResult] = await Promise.allSettled([
    fetchAllBmkgQuakes(),
    fetchUsgsQuakes(30, 4),
  ]);

  const bmkgQuakes = bmkgResult.status === "fulfilled" ? bmkgResult.value : [];
  const usgsQuakes = usgsResult.status === "fulfilled" ? usgsResult.value : [];

  const merged = mergeQuakeSources(bmkgQuakes, usgsQuakes);
  const sequences = buildQuakeSequences(merged);

  const events = bmkgQuakes.map((q) => bmkgQuakeToSequencedEvent(q, sequences));

  return {
    events,
    bmkgOk: bmkgResult.status === "fulfilled",
    usgsOk: usgsResult.status === "fulfilled",
    bmkgError: bmkgResult.status === "rejected" ? String(bmkgResult.reason) : undefined,
    usgsError: usgsResult.status === "rejected" ? String(usgsResult.reason) : undefined,
  };
}
