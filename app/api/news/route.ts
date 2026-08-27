import { NextResponse } from "next/server";
import { fetchNewsForQuery } from "@/lib/sources/news";
import { reverseGeocode } from "@/lib/sources/geocode";
import { buildNewsQuery } from "@/lib/status/news-query";
import type { DisasterType } from "@/lib/types";

export const revalidate = 1800;

const VALID_TYPES: DisasterType[] = ["gempa", "karhutla", "gunungapi", "banjir", "longsor", "cuaca", "lainnya"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") as DisasterType | null;
  if (!type || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ news: [], error: "Parameter 'type' tidak valid." }, { status: 400 });
  }

  const wilayah = searchParams.get("wilayah");
  const volcanoName = searchParams.get("volcanoName");
  const province = searchParams.get("province");
  const latParam = searchParams.get("lat");
  const lonParam = searchParams.get("lon");

  let query = buildNewsQuery({ type, wilayah, volcanoName, province });

  // Only reverse-geocode when nothing else could produce a place - this is
  // the on-demand path (one lookup per detail-panel open), not a bulk call,
  // so Nominatim's ~1 req/sec usage policy isn't a concern here.
  if (!query && latParam && lonParam) {
    const lat = Number.parseFloat(latParam);
    const lon = Number.parseFloat(lonParam);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const geocodedPlace = await reverseGeocode(lat, lon).catch(() => null);
      query = buildNewsQuery({ type, geocodedPlace });
    }
  }

  if (!query) {
    return NextResponse.json({
      news: [],
      query: null,
      note: "Tidak dapat menentukan lokasi untuk pencarian berita terkait kejadian ini.",
    });
  }

  try {
    const news = await fetchNewsForQuery(query);
    return NextResponse.json({ news, query });
  } catch (error) {
    return NextResponse.json(
      {
        news: [],
        query,
        error: "Berita terkait tidak tersedia saat ini.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
