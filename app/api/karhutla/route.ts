import { NextResponse } from "next/server";
import { fetchAllFirmsHotspots, clusterHotspots } from "@/lib/sources/firms";
import { wildfireClusterToEvent } from "@/lib/status/wildfire";

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
    return NextResponse.json({
      // NOT clusters.map(wildfireClusterToEvent) - Array.map passes
      // (element, index, array), and index would land in the `now: Date`
      // param, crashing on now.getTime(). Wrap explicitly.
      events: clusters.map((cluster) => wildfireClusterToEvent(cluster)),
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
