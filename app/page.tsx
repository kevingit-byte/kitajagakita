"use client";

import { useMemo, useState } from "react";
import MapView from "@/components/MapView";
import FilterBar from "@/components/FilterBar";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import SourceStatusNotice from "@/components/SourceStatusNotice";
import { useDisasterEvents } from "@/lib/hooks/useDisasterEvents";
import { DEFAULT_FILTERS, filterEvents } from "@/lib/filters";
import type { DisasterEvent } from "@/lib/types";

export default function Home() {
  const { events, isLoading, sourceStatuses } = useDisasterEvents();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);

  const visibleEvents = useMemo(() => filterEvents(events, filters), [events, filters]);

  return (
    <main className="flex flex-col h-dvh bg-neutral-950 text-neutral-100">
      <header className="px-3 py-2 border-b border-neutral-800 flex items-baseline justify-between">
        <h1 className="text-base font-semibold">Kita Jaga Kita</h1>
        <span className="text-xs text-neutral-500">
          {isLoading ? "Memuat..." : `${visibleEvents.length} kejadian`}
        </span>
      </header>

      <DisclaimerBanner />
      <SourceStatusNotice sourceStatuses={sourceStatuses} />
      <FilterBar filters={filters} onChange={setFilters} />

      <div className="flex-1 min-h-0 relative">
        <MapView events={visibleEvents} onSelectEvent={setSelectedEvent} />
      </div>

      {selectedEvent && (
        <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-96 bg-neutral-900 border-t sm:border-t-0 sm:border-l border-neutral-800 p-4 max-h-[60vh] sm:max-h-none overflow-y-auto">
          <button
            onClick={() => setSelectedEvent(null)}
            className="text-neutral-500 text-sm float-right"
            aria-label="Tutup"
          >
            Tutup
          </button>
          <h2 className="font-semibold text-lg mb-2">{selectedEvent.title}</h2>
          <p className="text-sm text-neutral-400 mb-1">Status: {selectedEvent.status}</p>
          <p className="text-sm text-neutral-400 mb-1">Tingkat keparahan: {selectedEvent.severityLabel}</p>
          <p className="text-sm text-neutral-300 mb-3">{selectedEvent.statusReason}</p>
          <p className="text-xs text-neutral-500">
            Sumber: {selectedEvent.sourceName} -{" "}
            <a href={selectedEvent.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
              tautan
            </a>
          </p>
        </div>
      )}
    </main>
  );
}
