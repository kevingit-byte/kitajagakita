import { NextResponse } from "next/server";
import { fetchAllBmkgQuakes, bmkgQuakeToEvent } from "@/lib/sources/bmkg";

export const revalidate = 120;

export async function GET() {
  try {
    const quakes = await fetchAllBmkgQuakes();
    return NextResponse.json({ events: quakes.map(bmkgQuakeToEvent) });
  } catch (error) {
    return NextResponse.json(
      {
        events: [],
        error: "Data BMKG tidak tersedia saat ini.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
