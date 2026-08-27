"use client";

import { useMemo, useRef, useState } from "react";
// Aliased: the default export is the map component, and it would otherwise
// shadow the built-in `Map` constructor used below for the event lookup.
import MapGL, {
  Source,
  Layer,
  type MapLayerMouseEvent,
  type MapRef,
  type ErrorEvent,
} from "react-map-gl/maplibre";
import type { CircleLayerSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { DisasterEvent } from "@/lib/types";
import { DISASTER_TYPE_COLOR } from "@/lib/labels";

// CARTO's free vector basemap style (MapLibre GL, no API key) - replaces the
// old raster-tile approach. CARTO themselves recommend vector basemaps over
// raster now: sharper at any zoom, no legacy watermark constraints, and
// this dark-matter style is the same free CARTO family the raster tiles
// were, just the modern delivery format. Confirmed HTTP 200 with no auth
// before switching, same verification discipline as every data source here.
const CARTO_DARK_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const INDONESIA_VIEW = { longitude: 118, latitude: -2.5, zoom: 4.2 };

const EVENTS_LAYER_ID = "disaster-events";

function toFeatureCollection(events: DisasterEvent[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: events.map((event) => ({
      type: "Feature",
      id: event.id,
      geometry: { type: "Point", coordinates: [event.lon, event.lat] },
      properties: {
        id: event.id,
        type: event.type,
        severity: event.severity,
        faded: event.status === "selesai" ? 1 : 0,
      },
    })),
  };
}

// Rendered as a single GPU-composited circle layer rather than one DOM
// marker per event: this app's karhutla layer alone can carry 1000+
// clustered points (real event volume, confirmed in production), and
// per-marker DOM elements would make the map unusably slow at that count.
const circleLayer: CircleLayerSpecification = {
  id: EVENTS_LAYER_ID,
  type: "circle",
  source: "events",
  paint: {
    "circle-color": [
      "match",
      ["get", "type"],
      "gempa",
      DISASTER_TYPE_COLOR.gempa,
      "karhutla",
      DISASTER_TYPE_COLOR.karhutla,
      "gunungapi",
      DISASTER_TYPE_COLOR.gunungapi,
      "banjir",
      DISASTER_TYPE_COLOR.banjir,
      "longsor",
      DISASTER_TYPE_COLOR.longsor,
      "cuaca",
      DISASTER_TYPE_COLOR.cuaca,
      DISASTER_TYPE_COLOR.lainnya,
    ],
    "circle-radius": ["+", 5, ["*", ["get", "severity"], 2.2]],
    "circle-opacity": ["case", ["==", ["get", "faded"], 1], 0.25, 0.8],
    "circle-stroke-width": 1.2,
    "circle-stroke-color": "#0b0f14",
    "circle-stroke-opacity": ["case", ["==", ["get", "faded"], 1], 0.3, 0.9],
  },
};

type DisasterMapProps = {
  events: DisasterEvent[];
  onSelectEvent?: (event: DisasterEvent) => void;
};

export default function DisasterMap({ events, onSelectEvent }: DisasterMapProps) {
  const mapRef = useRef<MapRef>(null);
  const eventsById = useMemo(() => new Map(events.map((e) => [e.id, e])), [events]);
  const geojson = useMemo(() => toFeatureCollection(events), [events]);
  const [loadError, setLoadError] = useState<string | null>(null);

  function handleClick(e: MapLayerMouseEvent) {
    const feature = e.features?.[0];
    const id = feature?.properties?.id as string | undefined;
    if (id) {
      const event = eventsById.get(id);
      if (event) onSelectEvent?.(event);
    }
  }

  // MapLibre reports failed style/source/tile loads as a non-throwing
  // `error` event, not a JS exception - a React error boundary around this
  // component can't catch that. Surfacing it explicitly is the only way a
  // basemap or vector-tile failure doesn't look identical to "loaded fine,
  // just rendering nothing".
  function handleError(e: ErrorEvent) {
    console.error("MapLibre error:", e.error);
    setLoadError(e.error?.message ?? "Terjadi kesalahan saat memuat peta.");
  }

  return (
    <div className="relative h-full w-full">
      {loadError && (
        <div className="absolute top-2 left-2 right-2 z-10 bg-red-950/90 border border-red-800 rounded-lg px-3 py-2 text-xs text-red-200">
          ⚠️ Sebagian data peta gagal dimuat: {loadError}
        </div>
      )}
      <MapGL
        ref={mapRef}
        initialViewState={INDONESIA_VIEW}
        mapStyle={CARTO_DARK_STYLE}
        style={{ width: "100%", height: "100%" }}
        interactiveLayerIds={[EVENTS_LAYER_ID]}
        onClick={handleClick}
        onError={handleError}
        cursor="default"
      >
        <Source id="events" type="geojson" data={geojson}>
          <Layer {...circleLayer} />
        </Source>
      </MapGL>
    </div>
  );
}
