import { NextResponse } from "next/server";
import { fetchGempaEvents } from "@/lib/status/orchestrate-earthquakes";
import { fetchAllFirmsHotspots, clusterHotspots } from "@/lib/sources/firms";
import { wildfireClusterToEvent } from "@/lib/status/wildfire";
import { fetchMagmaVolcanoes, magmaVolcanoToEvent } from "@/lib/sources/magma";
import { fetchGvpWeeklyReports, gvpReportToEvent } from "@/lib/sources/gvp";
import { fetchGdacsIndonesiaEvents } from "@/lib/sources/gdacs";
import { fetchReliefWebIndonesiaDisasters, isReliefWebConfigured } from "@/lib/sources/reliefweb";
import type { DisasterEvent, SourceHealth } from "@/lib/types";

export const revalidate = 0;

async function tracked<T>(
  sourceName: string,
  health: SourceHealth[],
  fn: () => Promise<T>,
  fallback: T,
): Promise<T> {
  const fetchedAt = new Date().toISOString();
  try {
    const result = await fn();
    health.push({ sourceName, ok: true, fetchedAt });
    return result;
  } catch (error) {
    health.push({
      sourceName,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      fetchedAt,
    });
    return fallback;
  }
}

export async function GET() {
  const health: SourceHealth[] = [];
  const toDate = new Date().toISOString().slice(0, 10);
  const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const mapKey = process.env.FIRMS_MAP_KEY;

  const [gempaResult, firmsHotspots, magmaVolcanoes, gdacsEvents, reliefWebEvents] = await Promise.all([
    fetchGempaEvents(),
    mapKey
      ? tracked("NASA FIRMS", health, () => fetchAllFirmsHotspots(mapKey), [])
      : Promise.resolve([]).then((r) => {
          health.push({
            sourceName: "NASA FIRMS",
            ok: false,
            error: "FIRMS_MAP_KEY belum diset",
            fetchedAt: new Date().toISOString(),
          });
          return r;
        }),
    tracked("MAGMA ESDM", health, fetchMagmaVolcanoes, []),
    tracked("GDACS", health, () => fetchGdacsIndonesiaEvents(fromDate, toDate), []),
    isReliefWebConfigured()
      ? tracked("ReliefWeb", health, fetchReliefWebIndonesiaDisasters, [])
      : Promise.resolve([]).then((r) => {
          health.push({
            sourceName: "ReliefWeb",
            ok: false,
            error: "RELIEFWEB_APPNAME belum diset",
            fetchedAt: new Date().toISOString(),
          });
          return r;
        }),
  ]);

  // fetchGempaEvents never throws (BMKG/USGS failures are caught inside and
  // reflected in bmkgOk/usgsOk), so it can't go through tracked() the way
  // the other sources do - record its two constituent sources explicitly.
  const gempaFetchedAt = new Date().toISOString();
  health.push({ sourceName: "BMKG", ok: gempaResult.bmkgOk, error: gempaResult.bmkgError, fetchedAt: gempaFetchedAt });
  health.push({ sourceName: "USGS", ok: gempaResult.usgsOk, error: gempaResult.usgsError, fetchedAt: gempaFetchedAt });

  let magmaOrGvpEvents: DisasterEvent[] = magmaVolcanoes.map(magmaVolcanoToEvent).filter((e) => e !== null);
  if (magmaVolcanoes.length === 0) {
    const gvpReports = await tracked("Smithsonian GVP (cadangan)", health, fetchGvpWeeklyReports, []);
    magmaOrGvpEvents = gvpReports.map(gvpReportToEvent).filter((e) => e !== null);
  }

  const wildfireClusters = clusterHotspots(firmsHotspots);

  const events: DisasterEvent[] = [
    ...gempaResult.events,
    ...wildfireClusters.map((cluster) => wildfireClusterToEvent(cluster)),
    ...magmaOrGvpEvents,
    ...gdacsEvents,
    ...reliefWebEvents,
  ];

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    eventCount: events.length,
    events,
    sourceHealth: health,
    debug: {
      bmkgQuakeCount: gempaResult.events.length,
      firmsRawHotspotCount: firmsHotspots.length,
      firmsClusterCount: wildfireClusters.length,
      magmaVolcanoCount: magmaVolcanoes.length,
      gdacsEventCount: gdacsEvents.length,
      reliefWebEventCount: reliefWebEvents.length,
    },
  });
}
