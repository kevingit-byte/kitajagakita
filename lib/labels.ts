import type { DisasterType, EventStatus } from "./types";

export const DISASTER_TYPE_LABEL: Record<DisasterType, string> = {
  gempa: "Gempa Bumi",
  karhutla: "Karhutla",
  gunungapi: "Gunung Api",
  banjir: "Banjir",
  longsor: "Tanah Longsor",
  cuaca: "Cuaca Ekstrem",
  lainnya: "Lainnya",
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
