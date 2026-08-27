"use client";

import { useState } from "react";
import type { DisasterType, EventStatus } from "@/lib/types";
import type { EventFilters, TimeRange, UrgencyFilter } from "@/lib/filters";
import { DISASTER_TYPE_LABEL, DISASTER_TYPE_ICON, STATUS_LABEL } from "@/lib/labels";

const ALL_TYPES: DisasterType[] = ["gempa", "karhutla", "gunungapi", "banjir", "longsor", "cuaca", "lainnya"];
const ALL_STATUSES: EventStatus[] = ["aktif", "mereda", "selesai", "tidak-diketahui"];
const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "today", label: "Hari ini" },
  { value: "3d", label: "3 hari" },
  { value: "7d", label: "7 hari" },
  { value: "30d", label: "30 hari" },
];
const URGENCY_OPTIONS: { value: UrgencyFilter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "perlu-perhatian", label: "Perlu perhatian" },
  { value: "darurat", label: "Hanya darurat" },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function chipClass(active: boolean): string {
  return `px-2.5 py-1 rounded-full border text-xs transition-colors ${
    active
      ? "bg-neutral-100 text-neutral-900 border-neutral-100"
      : "bg-transparent text-neutral-500 border-neutral-700"
  }`;
}

type FilterBarProps = {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
};

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const activeFilterCount =
    filters.types.length + filters.statuses.length + (filters.urgency !== "semua" ? 1 : 0);

  return (
    <div className="bg-neutral-900 border-b border-neutral-800 text-sm">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-neutral-300"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2">
          <span aria-hidden>⚙️</span>
          Filter
          {activeFilterCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-900 text-[10px] font-semibold">
              {activeFilterCount}
            </span>
          )}
          <span className="text-neutral-500">
            · {TIME_RANGES.find((t) => t.value === filters.timeRange)?.label}
          </span>
        </span>
        <span aria-hidden>{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 px-3 pb-3">
          <div>
            <div className="text-neutral-400 text-xs mb-1.5">⚠️ Jenis kejadian</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onChange({ ...filters, types: [] })}
                className={chipClass(filters.types.length === 0)}
              >
                Semua
              </button>
              {ALL_TYPES.map((type) => {
                const active = filters.types.length === 0 || filters.types.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => onChange({ ...filters, types: toggle(filters.types, type) })}
                    className={chipClass(active)}
                    title={
                      type === "karhutla"
                        ? "Titik panas adalah deteksi suhu tinggi dari satelit, belum tentu kebakaran. Perlu verifikasi lapangan."
                        : undefined
                    }
                  >
                    <span aria-hidden className="mr-1">
                      {DISASTER_TYPE_ICON[type]}
                    </span>
                    {DISASTER_TYPE_LABEL[type]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-neutral-400 text-xs mb-1.5">Status</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => onChange({ ...filters, statuses: [] })}
                className={chipClass(filters.statuses.length === 0)}
              >
                Semua
              </button>
              {ALL_STATUSES.map((status) => {
                const active = filters.statuses.length === 0 || filters.statuses.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => onChange({ ...filters, statuses: toggle(filters.statuses, status) })}
                    className={chipClass(active)}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-neutral-400 text-xs mb-1.5">🗓️ Waktu</div>
            <div className="flex gap-1.5">
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.value}
                  onClick={() => onChange({ ...filters, timeRange: tr.value })}
                  className={chipClass(filters.timeRange === tr.value)}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-neutral-400 text-xs mb-1.5">Tingkat urgensi</div>
            <div className="flex flex-wrap gap-1.5">
              {URGENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ ...filters, urgency: opt.value })}
                  className={chipClass(filters.urgency === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
