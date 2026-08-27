"use client";

import type { DisasterEvent, DisasterType } from "@/lib/types";
import { buildProvinceSummaries, buildTypeCounts } from "@/lib/status/national-overview";
import { DISASTER_TYPE_LABEL, DISASTER_TYPE_COLOR, DISASTER_TYPE_ICON } from "@/lib/labels";
import { HUMAN_LEVEL, levelFromEventSeverity } from "@/lib/human-severity";
import AqiPanel from "./AqiPanel";

// Provinces bucket into 3 groups for the at-a-glance summary (matching the
// spec's example numbers exactly), even though individual province badges
// below use the full 4-level language - severity 3 (Siaga) folds into the
// "perlu perhatian" bucket alongside 4-5 (Bahaya) for a quick top-line read.
function bucketProvince(highestActiveSeverity: number | null): "perlu-perhatian" | "waspada" | "normal" {
  if (highestActiveSeverity === null || highestActiveSeverity <= 1) return "normal";
  if (highestActiveSeverity === 2) return "waspada";
  return "perlu-perhatian";
}

export default function NationalOverview({ events }: { events: DisasterEvent[] }) {
  const typeCounts = buildTypeCounts(events);
  const provinces = buildProvinceSummaries(events).sort((a, b) => {
    const sevA = a.highestActiveSeverity ?? -1;
    const sevB = b.highestActiveSeverity ?? -1;
    if (sevA !== sevB) return sevB - sevA;
    return b.totalEvents - a.totalEvents;
  });

  const activeCount = events.filter((e) => e.status === "aktif").length;
  const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekCount = events.filter((e) => new Date(e.occurredAt).getTime() >= weekCutoff).length;

  const buckets = { "perlu-perhatian": 0, waspada: 0, normal: 0 };
  for (const p of provinces) buckets[bucketProvince(p.highestActiveSeverity)] += 1;

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold flex items-center gap-1.5">
          <span aria-hidden>🇮🇩</span> Kondisi Indonesia
        </h1>
      </div>

      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
          <div className="text-xl font-bold tabular-nums">{activeCount}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">kejadian aktif</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
          <div className="text-xl font-bold tabular-nums text-red-400">{buckets["perlu-perhatian"]}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">wilayah perlu perhatian</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3">
          <div className="text-xl font-bold tabular-nums">{weekCount}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5">kejadian / 7 hari</div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2 text-xs">
        <span className={`px-2.5 py-1 rounded-full border ${HUMAN_LEVEL.bahaya.badgeClass}`}>
          {HUMAN_LEVEL.bahaya.icon} {buckets["perlu-perhatian"]} perlu perhatian
        </span>
        <span className={`px-2.5 py-1 rounded-full border ${HUMAN_LEVEL.waspada.badgeClass}`}>
          {HUMAN_LEVEL.waspada.icon} {buckets.waspada} waspada
        </span>
        <span className={`px-2.5 py-1 rounded-full border ${HUMAN_LEVEL.aman.badgeClass}`}>
          {HUMAN_LEVEL.aman.icon} {buckets.normal} normal
        </span>
      </section>

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
        <h2 className="text-sm font-semibold text-neutral-300 mb-1">Wilayah Terdampak</h2>
        <p className="text-xs text-neutral-500 mb-3">
          Diurutkan dari keparahan kejadian aktif tertinggi. Wilayah ditentukan dari jarak terdekat ke titik
          kejadian (perkiraan, bukan batas administratif resmi).
        </p>
        <div className="flex flex-col gap-2">
          {provinces.map((p) => {
            const level =
              p.highestActiveSeverity !== null
                ? levelFromEventSeverity(p.highestActiveSeverity, "aktif")
                : HUMAN_LEVEL.aman;
            return (
              <div key={p.province} className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{p.province}</span>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs border ${level.badgeClass}`}>
                    {level.icon} {p.highestActiveSeverity !== null ? level.shortLabel : "Tidak ada yang aktif"}
                  </span>
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
            );
          })}
          {provinces.length === 0 && (
            <p className="text-neutral-500 text-sm">Tidak ada kejadian pada filter saat ini.</p>
          )}
        </div>
      </section>
    </div>
  );
}
