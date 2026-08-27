import { NextResponse } from "next/server";

const MAGMA_TINGKAT_AKTIVITAS_URL = "https://magma.esdm.go.id/v1/gunung-api/tingkat-aktivitas";

export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch(MAGMA_TINGKAT_AKTIVITAS_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KitaJagaKita/0.1)" },
      cache: "no-store",
    });
    const text = await res.text();
    const hasTable = text.includes("<table");

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      hasTable,
      bodyPreview: text.slice(0, 500),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: null,
        hasTable: false,
        bodyPreview: null,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
