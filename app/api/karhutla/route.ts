import { NextResponse } from "next/server";
import { fetchAllFirmsHotspots, clusterHotspots } from "@/lib/sources/firms";
import { wildfireClusterToEvent } from "@/lib/status/wildfire";
import { fetchAirQuality } from "@/lib/sources/openmeteo";

export const revalidate = 900;

export async function GET() {
  const mapKey = process.env.FIRMS_MAP_KEY;
  if (!mapKey) {
    return NextResponse.json(
      { events: [], error: "FIRMS_MAP_KEY belum diset di environment." },
      { status: 500 },
    );
  }

  try {
    const hotspots = await fetchAllFirmsHotspots(mapKey);
    const clusters = clusterHotspots(hotspots);

    // One AQI lookup per cluster centroid (Open-Meteo takes any lat/lon,
    // not just fixed cities) - failures fall back to null rather than
    // failing the whole response, since intensitas is allowed to be null.
    const aqiResults = await Promise.allSettled(
      clusters.map((cluster) => fetchAirQuality(cluster.centerLat, cluster.centerLon)),
    );
    const nearestUsAqiByCluster = aqiResults.map((r) => (r.status === "fulfilled" ? r.value.usAqi : null));

    return NextResponse.json({
      // NOT clusters.map(wildfireClusterToEvent) - Array.map passes
      // (element, index, array), and index would land in the `now: Date`
      // param, crashing on now.getTime(). Wrap explicitly.
      events: clusters.map((cluster, i) => wildfireClusterToEvent(cluster, new Date(), nearestUsAqiByCluster[i])),
      rawHotspotCount: hotspots.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        events: [],
        error: "Data NASA FIRMS tidak tersedia saat ini.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
