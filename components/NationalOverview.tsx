"use client";

import type { DisasterEvent, DisasterType } from "@/lib/types";
import { buildProvinceSummaries, buildTypeCounts } from "@/lib/status/national-overview";
import { DISASTER_TYPE_LABEL, DISASTER_TYPE_COLOR, DISASTER_TYPE_ICON } from "@/lib/labels";
import AqiPanel from "./AqiPanel";

const SEVERITY_COLOR: Record<number, string> = {
  1: "bg-emerald-900 text-emerald-200 border-emerald-800",
  2: "bg-yellow-900 text-yellow-200 border-yellow-800",
  3: "bg-orange-900 text-orange-200 border-orange-800",
  4: "bg-red-900 text-red-200 border-red-800",
  5: "bg-red-950 text-red-300 border-red-700",
};

export default function NationalOverview({ events }: { events: DisasterEvent[] }) {
  const typeCounts = buildTypeCounts(events);
  const provinces = buildProvinceSummaries(events).sort((a, b) => {
    const sevA = a.highestActiveSeverity ?? -1;
    const sevB = b.highestActiveSeverity ?? -1;
    if (sevA !== sevB) return sevB - sevA;
    return b.totalEvents - a.totalEvents;
  });

  return (
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-5">
      <section>
        <h2 className="text-sm font-semibold text-neutral-300 mb-2">Ringkasan per Jenis Bencana</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeCounts).map(([type, count]) => (
            <div
              key={type}
              className="px-3 py-1.5 rounded-full text-xs bg-neutral-900 border border-neutral-800 flex items-center gap-1.5"
            >
              <span aria-hidden>{DISASTER_TYPE_ICON[type as DisasterType]}</span>
              <span className="text-neutral-300">{DISASTER_TYPE_LABEL[type as DisasterType]}</span>
              <span
                className="font-semibold px-1.5 rounded-full text-neutral-950"
                style={{ backgroundColor: DISASTER_TYPE_COLOR[type as DisasterType] }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <AqiPanel />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-300 mb-1">
          Provinsi Terdampak
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          Diurutkan dari keparahan kejadian aktif tertinggi. Provinsi ditentukan dari jarak terdekat ke titik
          kejadian (perkiraan, bukan batas wilayah resmi).
        </p>
        <div className="flex flex-col gap-2">
          {provinces.map((p) => (
            <div key={p.province} className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{p.province}</span>
                {p.highestActiveSeverity !== null ? (
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-xs border ${SEVERITY_COLOR[p.highestActiveSeverity]}`}
                  >
                    Tingkat {p.highestActiveSeverity} · aktif
                  </span>
                ) : (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-xs bg-neutral-800 text-neutral-500">
                    Tidak ada yang aktif
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500 mt-1.5">
                {Object.entries(p.countsByType).map(([type, count]) => (
                  <span key={type} className="flex items-center gap-1">
                    <span aria-hidden>{DISASTER_TYPE_ICON[type as DisasterType]}</span>
                    {count} {DISASTER_TYPE_LABEL[type as DisasterType].toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {provinces.length === 0 && (
            <p className="text-neutral-500 text-sm">Tidak ada kejadian pada filter saat ini.</p>
          )}
        </div>
      </section>
    </div>
  );
}
