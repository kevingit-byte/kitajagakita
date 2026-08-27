"use client";

import dynamic from "next/dynamic";
import type { DisasterEvent } from "@/lib/types";

// Leaflet touches `window` at import time, so it must never be pulled into
// the server bundle - dynamic import with ssr:false is required, not
// optional, per the spec.
const DisasterMap = dynamic(() => import("./DisasterMap"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

function MapSkeleton() {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        background: "#1a1a1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#888",
        fontSize: 14,
      }}
    >
      Memuat peta...
    </div>
  );
}

type MapViewProps = {
  events: DisasterEvent[];
  onSelectEvent?: (event: DisasterEvent) => void;
};

export default function MapView({ events, onSelectEvent }: MapViewProps) {
  return <DisasterMap events={events} onSelectEvent={onSelectEvent} />;
}
