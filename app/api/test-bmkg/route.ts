import { NextResponse } from "next/server";

const BMKG_AUTOGEMPA_URL = "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json";

export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch(BMKG_AUTOGEMPA_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KitaJagaKita/0.1)" },
      cache: "no-store",
    });
    const text = await res.text();

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      bodyPreview: text.slice(0, 500),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: null,
        bodyPreview: null,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
