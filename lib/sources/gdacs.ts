import type { DisasterEvent, DisasterType } from "../types";
import { classifyGdacsEvent } from "../status/other";

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
    const { status, statusReason, severity, severityLabel } = classifyGdacsEvent(
      p.alertlevel,
      p.iscurrent,
      p.todate,
    );

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
      severityLabel,
      status,
      statusReason,
      raw: p as unknown as Record<string, unknown>,
      sourceName: "GDACS",
      sourceUrl: p.url.report,
    } satisfies DisasterEvent;
  });
}
