import type { DisasterEvent, RegionIntensity } from "./types";
import { extractPlaceName } from "./status/news-query";

/** Strips common administrative prefixes so "Kab. Manggarai" and "Manggarai" compare equal. */
function normalizeWilayahName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(kab\.|kabupaten|kota)\s+/, "")
    .replace(/\s+\(kota\)$/, "")
    .trim();
}

/**
 * Looks up the felt-intensity reading for the viewer's own region, per
 * instruction: "Sekitar Saya" must show the value for the user's region,
 * never the event-wide max. Matching is a best-effort substring compare
 * against BMKG's free-text region names (Kabupaten/Kecamatan level) - this
 * app has no Kabupaten<->province/city geocoding, so a province-level
 * location selection will often not match a Kabupaten-level Dirasakan
 * entry. When that happens this returns null and the caller must show
 * "no matching report", never silently fall back to the event's max.
 */
export function regionIntensityForLocation(
  event: DisasterEvent,
  locationLabel: string,
): RegionIntensity | null {
  if (!event.regionIntensities) return null;
  const target = normalizeWilayahName(locationLabel);
  return (
    event.regionIntensities.find((r) => {
      const wilayah = normalizeWilayahName(r.wilayah);
      return wilayah.includes(target) || target.includes(wilayah);
    }) ?? null
  );
}

/** "2 jam yang lalu" style relative time, Indonesian. */
export function formatRelativeTime(isoString: string, now: Date = new Date()): string {
  const then = new Date(isoString).getTime();
  const diffMs = now.getTime() - then;
  const diffMin = Math.round(diffMs / (60 * 1000));

  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam yang lalu`;

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari yang lalu`;

  return new Date(isoString).toLocaleDateString("id-ID");
}

/** Short place name for a card title, e.g. "Gempa — Ruteng-Manggarai". */
export function shortPlaceName(event: DisasterEvent): string {
  const raw = event.raw as Record<string, unknown>;

  if (event.type === "gempa" && typeof raw.wilayah === "string") {
    return extractPlaceName(raw.wilayah);
  }
  if (event.type === "gunungapi") {
    const name = (typeof raw.name === "string" && raw.name) || (typeof raw.volcanoName === "string" && raw.volcanoName);
    if (name) return name;
  }
  if (event.province) return event.province;

  return `${event.lat.toFixed(2)}, ${event.lon.toFixed(2)}`;
}

/**
 * Display lines for an event's official intensity reading(s). Gempa is
 * special-cased: intensity is per-region (see DisasterEvent.regionIntensities),
 * never a single event-wide value, and BMKG's Dirasakan field is often
 * simply empty - that must read as "no report", never an estimate.
 */
export function intensitasLines(event: DisasterEvent): string[] {
  if (event.type === "gempa") {
    if (!event.regionIntensities || event.regionIntensities.length === 0) {
      return ["Belum ada laporan dirasakan"];
    }
    return event.regionIntensities.map((r) => `${r.wilayah}: ${r.sigLabel} (BMKG)`);
  }
  return [event.intensitas ?? "Data belum tersedia"];
}

/** Short key-stat line for a card, e.g. "M 5,2" or "12 titik panas terdeteksi". */
export function keyStatLine(event: DisasterEvent): string {
  const raw = event.raw as Record<string, unknown>;

  if (event.type === "gempa" && typeof raw.magnitude === "number") {
    return `M ${raw.magnitude.toString().replace(".", ",")}`;
  }
  if (event.type === "karhutla" && typeof raw.pointCount === "number") {
    return `${raw.pointCount} titik panas terdeteksi`;
  }
  if (event.type === "gunungapi" && typeof raw.level === "string") {
    return `Level ${raw.level}`;
  }
  return event.intensitas ?? "Belum ada laporan";
}
