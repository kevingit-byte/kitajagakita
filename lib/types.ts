export type DisasterType =
  | "gempa"
  | "karhutla"
  | "gunungapi"
  | "banjir"
  | "longsor"
  | "cuaca"
  | "lainnya";

export type EventStatus = "aktif" | "mereda" | "selesai" | "tidak-diketahui";

/**
 * Replaces the old 1-5 `severity` field, which forced an invalid comparison
 * between unrelated hazard scales (an M5 gempa vs. a Level III volcano vs.
 * an ISPU reading have no common numeric footing). `tindakan` is the one
 * thing that IS comparable across hazard types - the action level the
 * relevant official scale itself implies - while `intensitas` carries the
 * actual official reading, always as a display-ready string that names its
 * own scale and source.
 */
export type Tindakan = "normal" | "waspada" | "siaga" | "awas";

/** One region's felt-intensity reading, e.g. from BMKG's `Dirasakan` field. */
export type RegionIntensity = {
  wilayah: string;
  sig: 1 | 2 | 3 | 4 | 5;
  sigLabel: string;
};

export type NewsLink = {
  title: string;
  sourceName: string;
  url: string;
  publishedAt: string;
};

export type DisasterEvent = {
  id: string;
  type: DisasterType;
  title: string;
  lat: number;
  lon: number;
  province: string | null;
  occurredAt: string;
  lastUpdatedAt: string;
  /**
   * Official scale reading, ready to display as-is (must always name its
   * scale and source, e.g. "ISPU 187 - Tidak Sehat (KLHK)", "Level III
   * Siaga (PVMBG)") - never a bare number. Null when no reading is
   * available (e.g. an offshore gempa nobody reported feeling) - the UI
   * must show that as "no reading", never estimate one.
   *
   * For gempa specifically this is always null at the event level: felt
   * intensity is per-region, not per-event (one earthquake can be SIG IV
   * in one kabupaten and SIG II next door). Use `regionIntensities` instead
   * and look up the viewer's own region there - never its max.
   */
  intensitas: string | null;
  tindakan: Tindakan;
  /** Gempa only: per-region SIG-BMKG readings from BMKG's `Dirasakan` field. */
  regionIntensities?: RegionIntensity[] | null;
  status: EventStatus;
  statusReason: string;
  raw: Record<string, unknown>;
  sourceName: string;
  sourceUrl: string;
  news?: NewsLink[];
};

export type SourceHealth = {
  sourceName: string;
  ok: boolean;
  error?: string;
  fetchedAt: string;
};
