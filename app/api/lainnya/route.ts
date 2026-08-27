import { NextResponse } from "next/server";
import { fetchGdacsIndonesiaEvents } from "@/lib/sources/gdacs";
import { fetchReliefWebIndonesiaDisasters, isReliefWebConfigured } from "@/lib/sources/reliefweb";
import type { DisasterEvent } from "@/lib/types";

export const revalidate = 1800;

export async function GET() {
  const toDate = new Date().toISOString().slice(0, 10);
  const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [gdacsResult, reliefWebResult] = await Promise.allSettled([
    fetchGdacsIndonesiaEvents(fromDate, toDate),
    isReliefWebConfigured() ? fetchReliefWebIndonesiaDisasters() : Promise.resolve<DisasterEvent[]>([]),
  ]);

  const events: DisasterEvent[] = [];
  const errors: string[] = [];

  if (gdacsResult.status === "fulfilled") {
    events.push(...gdacsResult.value);
  } else {
    errors.push(`GDACS: ${gdacsResult.reason}`);
  }

  if (reliefWebResult.status === "fulfilled") {
    events.push(...reliefWebResult.value);
  } else {
    errors.push(`ReliefWeb: ${reliefWebResult.reason}`);
  }

  if (!isReliefWebConfigured()) {
    errors.push("ReliefWeb: RELIEFWEB_APPNAME belum diset, sumber ini dilewati.");
  }

  return NextResponse.json({ events, errors: errors.length > 0 ? errors : undefined });
}
