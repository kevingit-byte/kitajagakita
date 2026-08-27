import { NextResponse } from "next/server";
import { fetchGempaEvents } from "@/lib/status/orchestrate-earthquakes";

export const revalidate = 120;

export async function GET() {
  const { events, bmkgOk, usgsOk, bmkgError, usgsError } = await fetchGempaEvents();

  if (!bmkgOk) {
    return NextResponse.json(
      {
        events: [],
        error: "Data BMKG tidak tersedia saat ini.",
        detail: bmkgError,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    events,
    warning: usgsOk
      ? undefined
      : "Data USGS tidak tersedia - status rangkaian gempa susulan mungkin tidak lengkap.",
  });
}
