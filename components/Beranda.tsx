"use client";

import type { DisasterEvent, Tindakan } from "@/lib/types";
import type { LocationOption } from "@/lib/data/locations";
import { buildProvinceSummaries } from "@/lib/status/national-overview";
import { HUMAN_LEVEL } from "@/lib/human-severity";
import SekitarKamuPreview from "./SekitarKamuPreview";
import EventCard from "./EventCard";
import type { AppView } from "./BottomNav";

type BerandaProps = {
  events: DisasterEvent[];
  isLoading: boolean;
  location: LocationOption | null;
  onNavigate: (view: AppView) => void;
  onSelectEvent: (event: DisasterEvent) => void;
};

function bucketProvince(mostUrgentActiveTindakan: Tindakan | null): "perlu-perhatian" | "waspada" | "normal" {
  if (mostUrgentActiveTindakan === null || mostUrgentActiveTindakan === "normal") return "normal";
  if (mostUrgentActiveTindakan === "waspada") return "waspada";
  return "perlu-perhatian";
}

export default function Beranda({ events, isLoading, location, onNavigate, onSelectEvent }: BerandaProps) {
  const provinces = buildProvinceSummaries(events);
  const activeCount = events.filter((e) => e.status === "aktif").length;
  const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekCount = events.filter((e) => new Date(e.occurredAt).getTime() >= weekCutoff).length;
  const perluPerhatianCount = provinces.filter((p) => bucketProvince(p.mostUrgentActiveTindakan) === "perlu-perhatian").length;

  const recentEvents = [...events]
    .filter((e) => e.status === "aktif" || e.status === "mereda")
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    .slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto flex flex-col gap-6 p-4 pb-6">
      <section className="text-center pt-2 pb-1">
        <h1 className="text-2xl font-bold flex items-center justify-center gap-2">
          <span aria-hidden>🇮🇩</span> Kita Jaga Kita
        </h1>
        <p className="text-sm text-neutral-400 mt-2 leading-relaxed">
          Pantau kondisi bencana di sekitar kamu.
          <br />
          Data terbuka dari berbagai sumber untuk membantu kamu tetap waspada.
        </p>

        <button
          onClick={() => onNavigate("sekitar")}
          className="w-full mt-4 py-3 rounded-xl bg-neutral-100 text-neutral-900 text-sm font-semibold"
        >
          📍 Cek kondisi lokasi saya
        </button>
        <button onClick={() => onNavigate("sekitar")} className="w-full mt-2 py-2 text-xs text-neutral-400 underline">
          🔎 Cari kota / kabupaten
        </button>
      </section>

      <section>
        {location ? (
          <SekitarKamuPreview location={location} events={events} onViewDetail={() => onNavigate("sekitar")} />
        ) : (
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4">
            <p className="text-sm text-neutral-400">
              📍 Kami belum tahu lokasi kamu. Ketuk tombol di atas untuk mengecek kondisi wilayahmu.
            </p>
          </div>
        )}
      </section>

      <section>
        <button
          onClick={() => onNavigate("indonesia")}
          className="w-full text-left rounded-xl bg-neutral-900 border border-neutral-800 p-4"
        >
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
            <span aria-hidden>🇮🇩</span> Kondisi Indonesia
          </h2>
          {isLoading ? (
            <div className="h-12 bg-neutral-800 rounded animate-pulse" />
          ) : (
            <>
              <p className="text-sm text-neutral-300">
                <span className="font-semibold">{activeCount}</span> kejadian aktif ·{" "}
                <span className="font-semibold">{perluPerhatianCount}</span> wilayah perlu perhatian ·{" "}
                <span className="font-semibold">{weekCount}</span> kejadian / 7 hari
              </p>
              <div className="flex gap-2 mt-2 text-xs">
                <span className={`px-2 py-0.5 rounded-full border ${HUMAN_LEVEL.bahaya.badgeClass}`}>
                  {HUMAN_LEVEL.bahaya.icon} {perluPerhatianCount} perlu perhatian
                </span>
              </div>
            </>
          )}
          <p className="text-xs text-blue-400 mt-2 underline">Lihat peta Indonesia →</p>
        </button>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold flex items-center gap-1.5">
            <span aria-hidden>⚠️</span> Kejadian Terkini
          </h2>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-neutral-900 border border-neutral-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && recentEvents.length === 0 && (
          <p className="text-sm text-neutral-500">🟢 Tidak ada kejadian aktif yang tercatat saat ini.</p>
        )}

        <div className="flex flex-col gap-2">
          {recentEvents.map((event) => (
            <EventCard key={event.id} event={event} onSelect={onSelectEvent} />
          ))}
        </div>

        {recentEvents.length > 0 && (
          <button onClick={() => onNavigate("peta")} className="text-xs text-blue-400 underline mt-2">
            Lihat semua kejadian →
          </button>
        )}
      </section>
    </div>
  );
}
