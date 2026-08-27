import { NextResponse } from "next/server";
import { fetchAirQuality, MAJOR_CITIES, type AirQuality } from "@/lib/sources/openmeteo";

export const revalidate = 1800;

type CityAirQuality = AirQuality & { city: string };

export async function GET() {
  const results = await Promise.allSettled<CityAirQuality>(
    MAJOR_CITIES.map(async (city) => ({ city: city.name, ...(await fetchAirQuality(city.lat, city.lon)) })),
  );

  const cities = results
    .filter((r): r is PromiseFulfilledResult<CityAirQuality> => r.status === "fulfilled")
    .map((r) => r.value);

  return NextResponse.json({ cities });
}
