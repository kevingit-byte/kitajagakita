"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
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

function MapUnsupportedNotice() {
  return (
    <div className="h-full w-full bg-neutral-900 flex flex-col items-center justify-center gap-2 p-6 text-center">
      <span className="text-2xl" aria-hidden>
        🗺️
      </span>
      <p className="text-sm text-neutral-300">Peta interaktif tidak didukung di browser ini.</p>
      <p className="text-xs text-neutral-500">
        Data kejadian tetap tersedia di tab Beranda, Sekitar Saya, dan Indonesia.
      </p>
    </div>
  );
}

/**
 * MapLibre GL JS >=6 requires WebGL2 and, per its own changelog, fails
 * silently when it's unavailable - no thrown error, no `error` event, just
 * a blank canvas with no way to tell the map failed from a map that's
 * still loading. Checking availability ourselves before mounting the map
 * turns that silent failure into a clear message instead.
 */
function checkWebGLSupport(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

type MapViewProps = {
  events: DisasterEvent[];
  onSelectEvent?: (event: DisasterEvent) => void;
};

export default function MapView({ events, onSelectEvent }: MapViewProps) {
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglSupported(checkWebGLSupport());
  }, []);

  if (webglSupported === null) return <MapSkeleton />;
  if (webglSupported === false) return <MapUnsupportedNotice />;

  return (
    <MapErrorBoundary>
      <DisasterMap events={events} onSelectEvent={onSelectEvent} />
    </MapErrorBoundary>
  );
}
