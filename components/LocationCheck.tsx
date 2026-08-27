"use client";

import { useState } from "react";
import useSWR from "swr";
import type { DisasterEvent } from "@/lib/types";
import { computeCompositeScore, type SafetyLevel } from "@/lib/status/composite-score";
import { LOCATION_OPTIONS, type LocationOption } from "@/lib/data/locations";

type AqiResponse = { aqi: { usAqi: number } | null };

async function fetchAqi(url: string): Promise<AqiResponse> {
  const res = await fetch(url);
  return res.json();
}

const LEVEL_STYLE: Record<SafetyLevel, string> = {
  AMAN: "bg-emerald-900 text-emerald-200 border-emerald-700",
  WASPADA: "bg-yellow-900 text-yellow-200 border-yellow-700",
  SIAGA: "bg-orange-900 text-orange-200 border-orange-700",
  BAHAYA: "bg-red-950 text-red-200 border-red-700",
};

export default function LocationCheck({ events }: { events: DisasterEvent[] }) {
  const [location, setLocation] = useState<LocationOption | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const { data: aqiData, isLoading: aqiLoading } = useSWR(
    location ? `/api/aqi?lat=${location.lat}&lon=${location.lon}` : null,
    fetchAqi,
  );

  // Explicit click only - the spec requires geolocation is never
  // auto-requested on page load, only on a direct user action.
  function handleUseMyLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Browser ini tidak mendukung geolokasi.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          id: "geolocation",
          label: "Lokasi Saya",
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setGeoLoading(false);
      },
      (error) => {
        setGeoError(
          error.code === error.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Silakan pilih lokasi secara manual."
            : "Gagal mendapatkan lokasi. Silakan pilih lokasi secara manual.",
        );
        setGeoLoading(false);
      },
      { timeout: 10000 },
    );
  }

  const result = location ? computeCompositeScore(location, events, aqiData?.aqi?.usAqi ?? null) : null;

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
      <div>
        <label htmlFor="location-select" className="text-sm text-neutral-300 block mb-1.5">
          Pilih provinsi atau kota
        </label>
        <select
          id="location-select"
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm"
          value={location?.id ?? ""}
          onChange={(e) => {
            const opt = LOCATION_OPTIONS.find((o) => o.id === e.target.value);
            if (opt) setLocation(opt);
          }}
        >
          <option value="" disabled>
            -- Pilih lokasi --
          </option>
          {LOCATION_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-neutral-800" />
        <span className="text-xs text-neutral-500">atau</span>
        <div className="flex-1 h-px bg-neutral-800" />
      </div>

      <button
        onClick={handleUseMyLocation}
        disabled={geoLoading}
        className="w-full py-2 rounded-lg bg-neutral-100 text-neutral-900 text-sm font-medium disabled:opacity-50"
      >
        {geoLoading ? "Mendapatkan lokasi..." : "📍 Gunakan lokasi saya"}
      </button>
      {geoError && <p className="text-red-400 text-xs">{geoError}</p>}

      {location && (
        <div className="border-t border-neutral-800 pt-4">
          <p className="text-sm text-neutral-400 mb-3">
            Menilai keselamatan untuk: <span className="text-neutral-200 font-medium">{location.label}</span>
          </p>

          {aqiLoading && <p className="text-neutral-500 text-sm">Menghitung...</p>}

          {result && !aqiLoading && (
            <>
              <div className={`inline-block px-4 py-2 rounded-lg border text-lg font-bold mb-3 ${LEVEL_STYLE[result.level]}`}>
                {result.level}
              </div>

              <div className="text-xs text-neutral-500 mb-3">
                Skor gabungan ({result.totalPoints} poin) dihitung dari faktor-faktor berikut - tidak pernah
                ditampilkan tanpa rincian:
              </div>

              <div className="flex flex-col gap-2">
                {result.factors.map((factor) => (
                  <div key={factor.label} className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-neutral-300 font-medium">{factor.label}</span>
                      <span className="text-neutral-500">{factor.points} poin</span>
                    </div>
                    <div className="text-neutral-500 mt-0.5">{factor.detail}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
