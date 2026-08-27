import { NextResponse } from "next/server";
import { fetchAirQuality } from "@/lib/sources/openmeteo";

export const revalidate = 1800;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number.parseFloat(searchParams.get("lat") ?? "");
  const lon = Number.parseFloat(searchParams.get("lon") ?? "");

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: "Parameter lat/lon tidak valid." }, { status: 400 });
  }

  try {
    const aqi = await fetchAirQuality(lat, lon);
    return NextResponse.json({ aqi });
  } catch (error) {
    return NextResponse.json(
      {
        aqi: null,
        error: "Data kualitas udara tidak tersedia saat ini.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
