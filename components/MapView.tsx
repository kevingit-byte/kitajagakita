"use client";

import dynamic from "next/dynamic";
import type { DisasterEvent } from "@/lib/types";
import MapErrorBoundary from "./MapErrorBoundary";

// MapLibre GL JS touches `window`/WebGL at import time, so it must never be
// pulled into the server bundle - dynamic import with ssr:false is
// required, not optional.
const DisasterMap = dynamic(() => import("./DisasterMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

function MapSkeleton() {
  return (
    <div className="h-full w-full bg-neutral-900 animate-pulse flex items-center justify-center">
      <span className="text-neutral-600 text-sm">Menyiapkan peta...</span>
    </div>
  );
}

type MapViewProps = {
  events: DisasterEvent[];
  onSelectEvent?: (event: DisasterEvent) => void;
};

export default function MapView({ events, onSelectEvent }: MapViewProps) {
  return (
    <MapErrorBoundary>
      <DisasterMap events={events} onSelectEvent={onSelectEvent} />
    </MapErrorBoundary>
  );
}
