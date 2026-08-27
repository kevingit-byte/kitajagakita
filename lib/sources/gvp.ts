import { XMLParser } from "fast-xml-parser";
import type { DisasterEvent } from "../types";

const GVP_RSS_URL = "https://volcano.si.edu/news/WeeklyVolcanoRSS.xml";

export type GvpReport = {
  volcanoName: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  lat: number | null;
  lon: number | null;
};

/**
 * Fallback source when MAGMA ESDM is unreliable. Only covers volcanoes with
 * an active weekly report (a handful per week), not the full ~69-volcano
 * MAGMA list - but its georss:point field is a genuine coordinate source
 * (confirmed in Phase 0 samples), unlike MAGMA's table which has none.
 */
export async function fetchGvpWeeklyReports(): Promise<GvpReport[]> {
  const res = await fetch(GVP_RSS_URL, { next: { revalidate: 1800 } });
  if (!res.ok) {
    throw new Error(`GVP RSS returned HTTP ${res.status}`);
  }

  // GVP's feed is ISO-8859-1, not UTF-8 - decode explicitly or non-ASCII
  // characters (accented names, curly quotes) come through corrupted.
  const buffer = await res.arrayBuffer();
  const xml = new TextDecoder("iso-8859-1").decode(buffer);

  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;
  const itemList = Array.isArray(items) ? items : items ? [items] : [];

  return itemList
    .filter((item: Record<string, unknown>) => typeof item.title === "string" && item.title.includes("Indonesia"))
    .map((item: Record<string, unknown>) => {
      const title = String(item.title);
      const volcanoName = title.split(" (Indonesia)")[0].trim();
      const point = typeof item["georss:point"] === "string" ? item["georss:point"].trim() : null;
      const [lat, lon] = point ? point.split(/\s+/).map(Number) : [null, null];

      return {
        volcanoName,
        title,
        description: String(item.description ?? ""),
        link: String(item.link ?? GVP_RSS_URL),
        pubDate: String(item.pubDate ?? ""),
        lat: lat ?? null,
        lon: lon ?? null,
      };
    });
}

export function gvpReportToEvent(report: GvpReport): DisasterEvent | null {
  if (report.lat === null || report.lon === null) return null;

  return {
    id: `gvp-${report.volcanoName.toLowerCase().replace(/\s+/g, "-")}`,
    type: "gunungapi",
    title: report.title,
    lat: report.lat,
    lon: report.lon,
    province: null,
    occurredAt: report.pubDate,
    lastUpdatedAt: report.pubDate,
    // GVP doesn't carry PVMBG's I-IV terminology, so there is no official
    // reading to show - intensitas/tindakan stay provisional here, this is
    // a fallback source only (MAGMA is primary).
    intensitas: null,
    tindakan: "waspada",
    status: "tidak-diketahui",
    statusReason: "Sumber cadangan (MAGMA ESDM tidak tersedia) - status penuh belum diimplementasikan.",
    raw: report,
    sourceName: "Smithsonian GVP (cadangan)",
    sourceUrl: report.link,
  };
}
