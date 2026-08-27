"use client";

import type { DisasterEvent } from "@/lib/types";
import { buildProvinceSummaries, buildTypeCounts } from "@/lib/status/national-overview";
import { DISASTER_TYPE_LABEL, DISASTER_TYPE_COLOR } from "@/lib/labels";

const SEVERITY_COLOR: Record<number, string> = {
  1: "bg-emerald-900 text-emerald-200",
  2: "bg-yellow-900 text-yellow-200",
  3: "bg-orange-900 text-orange-200",
  4: "bg-red-900 text-red-200",
  5: "bg-red-950 text-red-300 border border-red-700",
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
    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-neutral-300 mb-2">Ringkasan Nasional per Jenis</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(typeCounts).map(([type, count]) => (
            <div
              key={type}
              className="px-2.5 py-1 rounded-full text-xs bg-neutral-900 border border-neutral-800 flex items-center gap-1.5"
            >
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: DISASTER_TYPE_COLOR[type as keyof typeof DISASTER_TYPE_COLOR] }}
              />
              {DISASTER_TYPE_LABEL[type as keyof typeof DISASTER_TYPE_LABEL]}: {count}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-neutral-300 mb-2">
          Provinsi Terdampak, diurutkan berdasarkan keparahan kejadian aktif tertinggi
        </h2>
        <p className="text-xs text-neutral-500 mb-3">
          Provinsi ditentukan dari jarak terdekat ke titik kejadian (perkiraan, bukan batas wilayah resmi).
        </p>
        <div className="flex flex-col gap-2">
          {provinces.map((p) => (
            <div key={p.province} className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{p.province}</span>
                {p.highestActiveSeverity !== null ? (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${SEVERITY_COLOR[p.highestActiveSeverity]}`}>
                    Tingkat {p.highestActiveSeverity} (aktif)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-800 text-neutral-500">
                    Tidak ada yang aktif
                  </span>
                )}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {p.totalEvents} kejadian total, {p.activeEvents} aktif
              </div>
            </div>
          ))}
          {provinces.length === 0 && (
            <p className="text-neutral-500 text-sm">Tidak ada kejadian pada filter saat ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}
