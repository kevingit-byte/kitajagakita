"use client";

import type { DisasterType, EventStatus, Severity } from "@/lib/types";
import type { EventFilters, TimeRange } from "@/lib/filters";
import { DISASTER_TYPE_LABEL, STATUS_LABEL } from "@/lib/labels";

const ALL_TYPES: DisasterType[] = ["gempa", "karhutla", "gunungapi", "banjir", "longsor", "cuaca", "lainnya"];
const ALL_STATUSES: EventStatus[] = ["aktif", "mereda", "selesai", "tidak-diketahui"];
const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: "24h", label: "24 Jam" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

type FilterBarProps = {
  filters: EventFilters;
  onChange: (filters: EventFilters) => void;
};

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3 p-3 bg-neutral-900 border-b border-neutral-800 text-sm">
      <div>
        <div className="text-neutral-400 text-xs mb-1.5">Jenis Bencana</div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_TYPES.map((type) => {
            const active = filters.types.length === 0 || filters.types.includes(type);
            return (
              <button
                key={type}
                onClick={() => onChange({ ...filters, types: toggle(filters.types, type) })}
                className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                  active
                    ? "bg-neutral-100 text-neutral-900 border-neutral-100"
                    : "bg-transparent text-neutral-500 border-neutral-700"
                }`}
              >
                {DISASTER_TYPE_LABEL[type]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-neutral-400 text-xs mb-1.5">Status</div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_STATUSES.map((status) => {
            const active = filters.statuses.length === 0 || filters.statuses.includes(status);
            return (
              <button
                key={status}
                onClick={() => onChange({ ...filters, statuses: toggle(filters.statuses, status) })}
                className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                  active
                    ? "bg-neutral-100 text-neutral-900 border-neutral-100"
                    : "bg-transparent text-neutral-500 border-neutral-700"
                }`}
              >
                {STATUS_LABEL[status]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <div className="text-neutral-400 text-xs mb-1.5">Rentang Waktu</div>
          <div className="flex gap-1.5">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.value}
                onClick={() => onChange({ ...filters, timeRange: tr.value })}
                className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                  filters.timeRange === tr.value
                    ? "bg-neutral-100 text-neutral-900 border-neutral-100"
                    : "bg-transparent text-neutral-500 border-neutral-700"
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="min-severity" className="text-neutral-400 text-xs mb-1.5 block">
            Tingkat Keparahan Minimum: {filters.minSeverity}
          </label>
          <input
            id="min-severity"
            type="range"
            min={1}
            max={5}
            value={filters.minSeverity}
            onChange={(e) => onChange({ ...filters, minSeverity: Number(e.target.value) as Severity })}
            className="w-32 accent-orange-500"
          />
        </div>
      </div>
    </div>
  );
}
