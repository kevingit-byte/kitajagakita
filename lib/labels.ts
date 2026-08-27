import type { DisasterType, EventStatus } from "./types";

export const DISASTER_TYPE_LABEL: Record<DisasterType, string> = {
  gempa: "Gempa Bumi",
  karhutla: "Titik Panas",
  gunungapi: "Gunung Api",
  banjir: "Banjir",
  longsor: "Tanah Longsor",
  cuaca: "Cuaca Ekstrem",
  lainnya: "Lainnya",
};

export const DISASTER_TYPE_ICON: Record<DisasterType, string> = {
  gempa: "🌐",
  karhutla: "🔥",
  gunungapi: "🌋",
  banjir: "🌊",
  longsor: "⛰️",
  cuaca: "🌪️",
  lainnya: "⚠️",
};

export const STATUS_LABEL: Record<EventStatus, string> = {
  aktif: "Aktif",
  mereda: "Mereda",
  selesai: "Selesai",
  "tidak-diketahui": "Tidak Diketahui",
};

/** Hex colors by hazard type, used for map markers and filter chips. */
export const DISASTER_TYPE_COLOR: Record<DisasterType, string> = {
  gempa: "#f97316", // orange
  karhutla: "#ef4444", // red
  gunungapi: "#dc2626", // deep red
  banjir: "#3b82f6", // blue
  longsor: "#a16207", // brown
  cuaca: "#8b5cf6", // purple
  lainnya: "#6b7280", // gray
};

export type AqiCategory = { label: string; className: string };

/** US EPA AQI breakpoints, with Indonesian category labels. */
export function classifyAqi(usAqi: number): AqiCategory {
  if (usAqi > 300) return { label: "Berbahaya", className: "bg-red-950 text-red-200 border-red-800" };
  if (usAqi > 200) return { label: "Sangat Tidak Sehat", className: "bg-purple-950 text-purple-200 border-purple-800" };
  if (usAqi > 150) return { label: "Tidak Sehat", className: "bg-red-900 text-red-200 border-red-700" };
  if (usAqi > 100) return { label: "Tidak Sehat (Sensitif)", className: "bg-orange-900 text-orange-200 border-orange-700" };
  if (usAqi > 50) return { label: "Sedang", className: "bg-yellow-900 text-yellow-200 border-yellow-700" };
  return { label: "Baik", className: "bg-emerald-900 text-emerald-200 border-emerald-700" };
}
