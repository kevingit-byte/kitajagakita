"use client";

import { useMemo, useState } from "react";
import MapView from "@/components/MapView";
import FilterBar from "@/components/FilterBar";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import SourceStatusNotice from "@/components/SourceStatusNotice";
import DetailPanel from "@/components/DetailPanel";
import NationalOverview from "@/components/NationalOverview";
import LocationCheck from "@/components/LocationCheck";
import Beranda from "@/components/Beranda";
import Tentang from "@/components/Tentang";
import BottomNav, { type AppView } from "@/components/BottomNav";
import { useDisasterEvents } from "@/lib/hooks/useDisasterEvents";
import { DEFAULT_FILTERS, filterEvents } from "@/lib/filters";
import type { DisasterEvent } from "@/lib/types";
import type { LocationOption } from "@/lib/data/locations";

export default function Home() {
  const { events, isLoading, sourceStatuses } = useDisasterEvents();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedEvent, setSelectedEvent] = useState<DisasterEvent | null>(null);
  const [view, setView] = useState<AppView>("beranda");
  const [location, setLocation] = useState<LocationOption | null>(null);

  const visibleEvents = useMemo(() => filterEvents(events, filters), [events, filters]);

  return (
    <main className="flex flex-col h-dvh bg-neutral-950 text-neutral-100">
      <DisclaimerBanner />
      <SourceStatusNotice sourceStatuses={sourceStatuses} />

      {/* Beranda, Sekitar Saya, and Indonesia use the full unfiltered event
          list, not visibleEvents - a filter toggled off on the map (e.g.
          hiding "selesai" events) shouldn't hide real risk from the
          homepage or a safety assessment. Only the Peta tab, where the
          filter bar itself lives, uses the filtered list. */}
      {view === "beranda" && (
        <Beranda
          events={events}
          isLoading={isLoading}
          location={location}
          onNavigate={setView}
          onSelectEvent={setSelectedEvent}
        />
      )}

      {view === "sekitar" && (
        <LocationCheck events={events} location={location} onLocationChange={setLocation} />
      )}

      {view === "peta" && (
        <>
          <FilterBar filters={filters} onChange={setFilters} />
          <div className="flex-1 min-h-0 relative">
            <MapView events={visibleEvents} onSelectEvent={setSelectedEvent} />
          </div>
        </>
      )}

      {view === "indonesia" && <NationalOverview events={events} />}
      {view === "tentang" && <Tentang />}

      {selectedEvent && <DetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

      <BottomNav active={view} onChange={setView} />
    </main>
  );
}
