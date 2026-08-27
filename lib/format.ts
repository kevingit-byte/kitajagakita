import type { DisasterEvent } from "./types";
import { extractPlaceName } from "./status/news-query";

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
  return event.severityLabel;
}
