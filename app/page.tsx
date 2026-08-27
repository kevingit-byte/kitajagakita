"use client";

import { useMemo, useState } from "react";
import MapView from "@/components/MapView";
import FilterBar from "@/components/FilterBar";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import SourceStatusNotice from "@/components/SourceStatusNotice";
import DetailPanel from "@/components/DetailPanel";
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

      {selectedEvent && <DetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </main>
  );
}
