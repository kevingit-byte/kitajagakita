import { NextResponse } from "next/server";
import { fetchMagmaVolcanoes, magmaVolcanoToEvent } from "@/lib/sources/magma";
import { fetchGvpWeeklyReports, gvpReportToEvent } from "@/lib/sources/gvp";

export const revalidate = 1800;

export async function GET() {
  try {
    const volcanoes = await fetchMagmaVolcanoes();
    const events = volcanoes.map(magmaVolcanoToEvent).filter((e) => e !== null);
    const missingCoords = volcanoes.length - events.length;

    return NextResponse.json({
      events,
      source: "MAGMA ESDM",
      totalVolcanoes: volcanoes.length,
      missingCoordinates: missingCoords,
    });
  } catch (magmaError) {
    try {
      const reports = await fetchGvpWeeklyReports();
      const events = reports.map(gvpReportToEvent).filter((e) => e !== null);
      return NextResponse.json({
        events,
        source: "Smithsonian GVP (cadangan)",
        error: "MAGMA ESDM tidak tersedia, menggunakan sumber cadangan.",
        magmaDetail: magmaError instanceof Error ? magmaError.message : String(magmaError),
      });
    } catch (gvpError) {
      return NextResponse.json(
        {
          events: [],
          error: "Data gunung api tidak tersedia saat ini (MAGMA ESDM dan cadangan GVP sama-sama gagal).",
          magmaDetail: magmaError instanceof Error ? magmaError.message : String(magmaError),
          gvpDetail: gvpError instanceof Error ? gvpError.message : String(gvpError),
        },
        { status: 502 },
      );
    }
  }
}
