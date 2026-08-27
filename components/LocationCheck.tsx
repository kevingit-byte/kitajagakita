"use client";

import { useState } from "react";
import useSWR from "swr";
import type { DisasterEvent } from "@/lib/types";
import { computeCompositeScore, summarizeNearbyEvents } from "@/lib/status/composite-score";
import { LOCATION_OPTIONS, type LocationOption } from "@/lib/data/locations";
import { levelFromSafetyLevel } from "@/lib/human-severity";
import { DISASTER_TYPE_LABEL, DISASTER_TYPE_ICON } from "@/lib/labels";
import { formatRelativeTime, regionIntensityForLocation } from "@/lib/format";
import { GUIDANCE, OFFICIAL_SOURCES_URL } from "@/lib/guidance";

type AqiResponse = { aqi: { usAqi: number } | null };

async function fetchAqi(url: string): Promise<AqiResponse> {
  const res = await fetch(url);
  return res.json();
}

type LocationCheckProps = {
  events: DisasterEvent[];
  location: LocationOption | null;
  onLocationChange: (location: LocationOption) => void;
};

export default function LocationCheck({ events, location, onLocationChange }: LocationCheckProps) {
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { data: aqiData, isLoading: aqiLoading } = useSWR(
    location ? `/api/aqi?lat=${location.lat}&lon=${location.lon}` : null,
    fetchAqi,
  );

  // Explicit click only - geolocation is never auto-requested on load.
  function handleUseMyLocation() {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError("Browser ini tidak mendukung geolokasi.");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationChange({
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
  const nearbySummary = location ? summarizeNearbyEvents(location, events) : [];
  const isCalculating = location !== null && aqiLoading;

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold flex items-center gap-1.5">
          <span aria-hidden>📍</span> Sekitar Saya
        </h1>
        <p className="text-xs text-neutral-500 mt-0.5">Cek kondisi bencana di sekitar lokasi kamu.</p>
      </div>

      <div>
        <label htmlFor="location-select" className="text-sm text-neutral-300 block mb-1.5">
          Pilih provinsi atau kota
        </label>
        <select
          id="location-select"
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2.5 text-sm"
          value={location?.id ?? ""}
          onChange={(e) => {
            const opt = LOCATION_OPTIONS.find((o) => o.id === e.target.value);
            if (opt) onLocationChange(opt);
          }}
        >
          <option value="" disabled>
            🔎 Cari kota / kabupaten
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
        className="w-full py-3 rounded-xl bg-neutral-100 text-neutral-900 text-sm font-semibold disabled:opacity-50"
      >
        {geoLoading ? "Mendapatkan lokasi..." : "📍 Cek kondisi lokasi saya"}
      </button>
      {geoError && (
        <p className="text-red-400 text-xs">
          📍 {geoError}
        </p>
      )}

      {!location && !geoError && (
        <p className="text-neutral-600 text-xs text-center">
          Kami belum tahu lokasi kamu. Pilih dari daftar atau gunakan tombol di atas.
        </p>
      )}

      {isCalculating && (
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 animate-pulse flex flex-col gap-2">
          <div className="h-4 w-32 bg-neutral-800 rounded" />
          <div className="h-6 w-48 bg-neutral-800 rounded" />
          <div className="h-3 w-full bg-neutral-800 rounded" />
        </div>
      )}

      {result && !isCalculating && (
        <div className="flex flex-col gap-4">
          <div className={`rounded-xl border p-4 ${levelFromSafetyLevel(result.level).badgeClass}`}>
            <p className="text-xs opacity-80 mb-1">{location!.label}</p>
            <p className="text-2xl font-bold flex items-center gap-2">
              <span aria-hidden>{levelFromSafetyLevel(result.level).icon}</span>
              {levelFromSafetyLevel(result.level).label}
            </p>
            <p className="text-sm mt-2 opacity-90">
              {result.nearestActiveEvent ? (
                <>
                  {DISASTER_TYPE_ICON[result.nearestActiveEvent.type]}{" "}
                  {DISASTER_TYPE_LABEL[result.nearestActiveEvent.type]} terdeteksi{" "}
                  {result.nearestActiveDistanceKm!.toFixed(0)} km dari lokasimu ·{" "}
                  {formatRelativeTime(result.nearestActiveEvent.occurredAt)}.
                </>
              ) : (
                "Tidak ada kejadian aktif yang terdeteksi di sekitar lokasi kamu."
              )}
            </p>
          </div>

          {result.nearestActiveEvent?.type === "gempa" && (
            <div className="bg-neutral-800/50 border border-neutral-800 rounded-lg p-3">
              <div className="text-neutral-200 font-medium text-sm mb-1">Intensitas dirasakan di wilayahmu</div>
              {(() => {
                const regionMatch = regionIntensityForLocation(result.nearestActiveEvent!, location!.label);
                if (regionMatch) {
                  return (
                    <p className="text-neutral-300 text-sm">
                      {regionMatch.sigLabel} (BMKG) di {regionMatch.wilayah}.
                    </p>
                  );
                }
                return (
                  <p className="text-neutral-500 text-xs">
                    {result.nearestActiveEvent!.regionIntensities && result.nearestActiveEvent!.regionIntensities!.length > 0
                      ? `Tidak ditemukan laporan dirasakan yang cocok dengan "${location!.label}" - lihat detail kejadian untuk daftar lengkap per wilayah.`
                      : "Belum ada laporan dirasakan"}
                  </p>
                );
              })()}
            </div>
          )}

          {result.nearestActiveEvent && (
            <div className="bg-neutral-800/50 border border-neutral-800 rounded-lg p-3">
              <div className="text-neutral-200 font-medium text-sm mb-2 flex items-center gap-1.5">
                <span aria-hidden>✅</span>
                Yang sebaiknya dilakukan
              </div>
              <ul className="flex flex-col gap-1.5">
                {GUIDANCE[result.nearestActiveEvent.type].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-neutral-300">
                    <span aria-hidden className="shrink-0">
                      {step.icon}
                    </span>
                    {step.text}
                  </li>
                ))}
              </ul>
              <a href={OFFICIAL_SOURCES_URL} className="text-xs text-blue-400 underline inline-block mt-2">
                Sumber informasi resmi →
              </a>
            </div>
          )}

          <div>
            <h2 className="text-sm font-medium text-neutral-300 mb-2">Dalam 7 hari terakhir (radius 100 km)</h2>
            {nearbySummary.length === 0 ? (
              <p className="text-xs text-neutral-500">Tidak ada kejadian tercatat di sekitar lokasi ini.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {nearbySummary.map(({ type, count }) => (
                  <div
                    key={type}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs flex items-center gap-1.5"
                  >
                    <span aria-hidden>{DISASTER_TYPE_ICON[type]}</span>
                    {count} {DISASTER_TYPE_LABEL[type].toLowerCase()}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-neutral-800 pt-3">
            <button
              onClick={() => setShowBreakdown((v) => !v)}
              className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1"
            >
              {showBreakdown ? "▲" : "▼"} Lihat rincian penilaian ({result.totalPoints} poin)
            </button>
            {showBreakdown && (
              <div className="flex flex-col gap-2 mt-2">
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
