"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MapView from "@/components/MapView";
import FilterBar from "@/components/FilterBar";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import SourceStatusNotice from "@/components/SourceStatusNotice";
import DetailPanel from "@/components/DetailPanel";
import NationalOverview from "@/components/NationalOverview";
import LocationCheck from "@/components/LocationCheck";
import { useDisasterEvents } from "@/lib/hooks/useDisasterEvents";
import { DEFAULT_FILTERS, filterEvents } from "@/lib/filters";
import type { DisasterEvent } from "@/lib/types";

type View = "peta" | "nasional" | "lokasi";

const TABS: { value: View; label: string; icon: string }[] = [
  { value: "peta", label: "Peta", icon: "🗺️" },
  { value: "nasional", label: "Nasional", icon: "📊" },
  { value: "lokasi", label: "Cek Lokasi", icon: "📍" },
];

export default function Home() {
  const { events, isLoading, sourceStatuses } = useDisasterEvents();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);
  const [view, setView] = useState<View>("peta");

  const visibleEvents = useMemo(() => filterEvents(events, filters), [events, filters]);

  return (
    <main className="flex flex-col h-dvh bg-neutral-950 text-neutral-100">
      <header className="px-3 py-2.5 border-b border-neutral-800 flex items-center justify-between relative overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            🇮🇩
          </span>
          <h1 className="text-base font-semibold tracking-tight">Kita Jaga Kita</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 tabular-nums">
            {isLoading ? "Memuat..." : `${visibleEvents.length} kejadian`}
          </span>
          <Link
            href="/sumber-data"
            className="text-xs text-neutral-500 hover:text-neutral-300 flex items-center gap-1"
            title="Sumber Data"
          >
            <span aria-hidden>ℹ️</span>
            <span className="hidden sm:inline">Sumber Data</span>
          </Link>
        </div>
        {isLoading && (
          <span className="absolute bottom-0 left-0 h-0.5 bg-orange-500 animate-pulse w-full" aria-hidden />
        )}
      </header>

      <DisclaimerBanner />
      <SourceStatusNotice sourceStatuses={sourceStatuses} />

      <div className="flex border-b border-neutral-800 bg-neutral-950">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setView(tab.value)}
            className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              view === tab.value
                ? "border-orange-500 text-neutral-100"
                : "border-transparent text-neutral-500"
            }`}
          >
            <span aria-hidden>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {view === "peta" && (
        <>
          <FilterBar filters={filters} onChange={setFilters} />
          <div className="flex-1 min-h-0 relative">
            <MapView events={visibleEvents} onSelectEvent={setSelectedEvent} />
          </div>
          {selectedEvent && <DetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
        </>
      )}

      {/* National overview and location check use the full unfiltered event
          list, not visibleEvents - a filter toggled off on the map (e.g.
          hiding "selesai" events) shouldn't hide real risk from a safety
          assessment. */}
      {view === "nasional" && <NationalOverview events={events} />}
      {view === "lokasi" && <LocationCheck events={events} />}
    </main>
  );
}
