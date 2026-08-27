"use client";

import useSWR from "swr";
import type { DisasterEvent } from "@/lib/types";
import { computeCompositeScore } from "@/lib/status/composite-score";
import type { LocationOption } from "@/lib/data/locations";
import { levelFromSafetyLevel } from "@/lib/human-severity";
import { DISASTER_TYPE_LABEL, DISASTER_TYPE_ICON } from "@/lib/labels";
import { formatRelativeTime } from "@/lib/format";

type AqiResponse = { aqi: { usAqi: number } | null };

async function fetchAqi(url: string): Promise<AqiResponse> {
  const res = await fetch(url);
  return res.json();
}

type SekitarKamuPreviewProps = {
  location: LocationOption;
  events: DisasterEvent[];
  onViewDetail: () => void;
};

/** Compact homepage preview of the full Sekitar Saya assessment. */
export default function SekitarKamuPreview({ location, events, onViewDetail }: SekitarKamuPreviewProps) {
  const { data: aqiData, isLoading } = useSWR(`/api/aqi?lat=${location.lat}&lon=${location.lon}`, fetchAqi);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 animate-pulse flex flex-col gap-2">
        <div className="h-3 w-24 bg-neutral-800 rounded" />
        <div className="h-6 w-40 bg-neutral-800 rounded" />
        <div className="h-3 w-full bg-neutral-800 rounded" />
      </div>
    );
  }

  const result = computeCompositeScore(location, events, aqiData?.aqi?.usAqi ?? null);
  const level = levelFromSafetyLevel(result.level);

  return (
    <button onClick={onViewDetail} className={`w-full text-left rounded-xl border p-4 ${level.badgeClass}`}>
      <p className="text-xs opacity-80 mb-1">📍 Sekitar Kamu · {location.label}</p>
      <p className="text-xl font-bold flex items-center gap-2">
        <span aria-hidden>{level.icon}</span>
        {level.label}
      </p>
      <p className="text-sm mt-1.5 opacity-90">
        {result.nearestActiveEvent ? (
          <>
            {DISASTER_TYPE_ICON[result.nearestActiveEvent.type]} {DISASTER_TYPE_LABEL[result.nearestActiveEvent.type]}{" "}
            terdeteksi {result.nearestActiveDistanceKm!.toFixed(0)} km dari lokasimu ·{" "}
            {formatRelativeTime(result.nearestActiveEvent.occurredAt)}.
          </>
        ) : (
          "Tidak ada peringatan bencana aktif di sekitar lokasi kamu."
        )}
      </p>
      <p className="text-xs mt-2 underline opacity-80">Lihat detail wilayah →</p>
    </button>
  );
}
