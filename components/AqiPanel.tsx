"use client";

import useSWR from "swr";
import { classifyAqi } from "@/lib/labels";

type CityAqi = { city: string; usAqi: number; pm2_5: number };
type CitiesResponse = { cities: CityAqi[] };

async function fetchCitiesAqi(url: string): Promise<CitiesResponse> {
  const res = await fetch(url);
  return res.json();
}

export default function AqiPanel() {
  const { data, isLoading } = useSWR("/api/aqi/cities", fetchCitiesAqi, { refreshInterval: 30 * 60 * 1000 });

  return (
    <div>
      <h2 className="text-sm font-semibold text-neutral-300 mb-1">Kualitas Udara di Kota Terdampak Karhutla</h2>
      <p className="text-xs text-neutral-500 mb-2">
        AQI (Indeks Kualitas Udara AS) langsung dari Open-Meteo - relevan saat musim karhutla memburuk.
      </p>

      {isLoading && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shrink-0 w-28 h-16 rounded-lg bg-neutral-900 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {data?.cities?.map((c) => {
            const category = classifyAqi(c.usAqi);
            return (
              <div
                key={c.city}
                className={`shrink-0 w-28 p-2 rounded-lg border text-xs ${category.className}`}
              >
                <div className="font-medium truncate">{c.city}</div>
                <div className="text-lg font-bold leading-tight">{Math.round(c.usAqi)}</div>
                <div className="truncate opacity-90">{category.label}</div>
              </div>
            );
          })}
          {(!data?.cities || data.cities.length === 0) && (
            <p className="text-neutral-500 text-xs">Data kualitas udara tidak tersedia saat ini.</p>
          )}
        </div>
      )}
    </div>
  );
}
