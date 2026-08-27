import type { DisasterEvent, DisasterType, Severity, SeverityLabel } from "../types";

const BASE_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH";

type GdacsFeature = {
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    eventtype: string;
    eventid: number;
    episodeid: number;
    name: string;
    htmldescription: string;
    alertlevel: "Green" | "Orange" | "Red";
    alertscore: number;
    country: string;
    fromdate: string;
    todate: string;
    datemodified: string;
    // GDACS reports these as the strings "true"/"false", not booleans -
    // confirmed against the real sample in docs/samples/gdacs.json.
    iscurrent: "true" | "false";
    url: { report: string };
    severitydata: { severity: number; severitytext: string; severityunit: string };
  };
};

type GdacsResponse = { type: "FeatureCollection"; features: GdacsFeature[] };

const EVENTTYPE_TO_DISASTER_TYPE: Record<string, DisasterType> = {
  EQ: "gempa",
  FL: "banjir",
  TC: "cuaca", // tropical cyclone
  DR: "lainnya", // drought
  WF: "karhutla",
  VO: "gunungapi",
};

const ALERT_LEVEL_TO_SEVERITY: Record<string, Severity> = {
  Green: 2,
  Orange: 3,
  Red: 5,
};

const SEVERITY_LABEL_BY_LEVEL: Record<Severity, SeverityLabel> = {
  1: "Ringan",
  2: "Sedang",
  3: "Berat",
  4: "Sangat Berat",
  5: "Kritis",
};

export async function fetchGdacsIndonesiaEvents(fromDate: string, toDate: string): Promise<DisasterEvent[]> {
  const params = new URLSearchParams({ country: "Indonesia", fromDate, toDate });
  const res = await fetch(`${BASE_URL}?${params.toString()}`, { next: { revalidate: 1800 } });
  if (!res.ok) {
    throw new Error(`GDACS returned HTTP ${res.status}`);
  }

  const data = (await res.json()) as GdacsResponse;

  return data.features.map((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    const p = feature.properties;
    const type = EVENTTYPE_TO_DISASTER_TYPE[p.eventtype] ?? "lainnya";
    const severity = ALERT_LEVEL_TO_SEVERITY[p.alertlevel] ?? 2;
    const isClosed = p.iscurrent === "false" || new Date(p.todate).getTime() < Date.now() - 24 * 60 * 60 * 1000;

    return {
      id: `gdacs-${p.eventid}-${p.episodeid}`,
      type,
      title: p.name || p.htmldescription,
      lat,
      lon,
      province: null,
      occurredAt: p.fromdate,
      lastUpdatedAt: p.datemodified,
      severity,
      severityLabel: SEVERITY_LABEL_BY_LEVEL[severity],
      status: isClosed ? "selesai" : "tidak-diketahui",
      statusReason: isClosed
        ? "GDACS menandai episode ini sudah berakhir (todate telah lewat)."
        : "Status penuh (aktif/mereda) memerlukan mesin status GDACS - belum diimplementasikan.",
      raw: p as unknown as Record<string, unknown>,
      sourceName: "GDACS",
      sourceUrl: p.url.report,
    } satisfies DisasterEvent;
  });
}
