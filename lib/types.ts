export type DisasterType =
  | "gempa"
  | "karhutla"
  | "gunungapi"
  | "banjir"
  | "longsor"
  | "cuaca"
  | "lainnya";

export type Severity = 1 | 2 | 3 | 4 | 5;

export type SeverityLabel = "Ringan" | "Sedang" | "Berat" | "Sangat Berat" | "Kritis";

export type EventStatus = "aktif" | "mereda" | "selesai" | "tidak-diketahui";

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
  severity: Severity;
  severityLabel: SeverityLabel;
  status: EventStatus;
  statusReason: string;
  raw: Record<string, unknown>;
  sourceName: string;
  sourceUrl: string;
  news?: NewsLink[];
};

export const SEVERITY_LABELS: Record<Severity, SeverityLabel> = {
  1: "Ringan",
  2: "Sedang",
  3: "Berat",
  4: "Sangat Berat",
  5: "Kritis",
};

export type SourceHealth = {
  sourceName: string;
  ok: boolean;
  error?: string;
  fetchedAt: string;
};
