import type { DisasterEvent, DisasterType } from "../types";
import { classifyReliefWebDisaster } from "../status/other";

// v1 is decommissioned (confirmed HTTP 410 in Phase 0). v2 requires a
// pre-approved appname as of Nov 2025 - a new ReliefWeb policy that
// postdates the original spec, not something that can be self-served with
// an arbitrary string (confirmed HTTP 403 "not using an approved appname").
//
// UNVERIFIED: no appname has been available to actually test this endpoint,
// so the response shape below is built from ReliefWeb's public API docs,
// not a real sample - unlike every other source in this codebase. Re-check
// field names against a live response as soon as an appname exists.
const BASE_URL = "https://api.reliefweb.int/v2/disasters";

type ReliefWebDisaster = {
  id: string;
  fields: {
    name: string;
    date: { created: string; changed?: string };
    status: string;
    country: { name: string; iso3: string }[];
    type: { name: string }[];
    url: string;
    primary_country?: { name: string; iso3: string };
  };
};

type ReliefWebResponse = { data: ReliefWebDisaster[] };

const TYPE_NAME_TO_DISASTER_TYPE: Record<string, DisasterType> = {
  Earthquake: "gempa",
  "Volcanic Eruption": "gunungapi",
  Flood: "banjir",
  "Flash Flood": "banjir",
  "Land Slide": "longsor",
  "Tropical Cyclone": "cuaca",
  Drought: "lainnya",
  "Forest Fire": "karhutla",
  Wildfire: "karhutla",
};

export function isReliefWebConfigured(): boolean {
  return Boolean(process.env.RELIEFWEB_APPNAME);
}

export async function fetchReliefWebIndonesiaDisasters(): Promise<DisasterEvent[]> {
  const appname = process.env.RELIEFWEB_APPNAME;
  if (!appname) {
    throw new Error(
      "RELIEFWEB_APPNAME belum diset - daftar di https://apidoc.reliefweb.int/parameters#appname",
    );
  }

  const params = new URLSearchParams({
    appname,
    "filter[field]": "country",
    "filter[value]": "Indonesia",
    limit: "20",
  });
  params.append("sort[]", "date:desc");

  const res = await fetch(`${BASE_URL}?${params.toString()}`, { next: { revalidate: 1800 } });
  if (!res.ok) {
    throw new Error(`ReliefWeb returned HTTP ${res.status}`);
  }

  const data = (await res.json()) as ReliefWebResponse;

  return data.data.map((disaster) => {
    const typeName = disaster.fields.type?.[0]?.name ?? "";
    const type = TYPE_NAME_TO_DISASTER_TYPE[typeName] ?? "lainnya";
    const { status, statusReason, severity, severityLabel } = classifyReliefWebDisaster(disaster.fields.status);

    return {
      id: `reliefweb-${disaster.id}`,
      type,
      title: disaster.fields.name,
      lat: 0,
      lon: 0,
      province: disaster.fields.primary_country?.name ?? null,
      occurredAt: disaster.fields.date.created,
      lastUpdatedAt: disaster.fields.date.changed ?? disaster.fields.date.created,
      severity,
      severityLabel,
      status,
      statusReason,
      raw: disaster.fields as unknown as Record<string, unknown>,
      sourceName: "ReliefWeb",
      sourceUrl: disaster.fields.url,
    } satisfies DisasterEvent;
  });
}
