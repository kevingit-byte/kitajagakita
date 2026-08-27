"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { DisasterEvent } from "@/lib/types";
import { DISASTER_TYPE_COLOR, DISASTER_TYPE_LABEL, STATUS_LABEL } from "@/lib/labels";

// CARTO Dark Matter - free, no API key. The spec's stack section names
// "CARTO light tiles" as the default, but the UI section separately
// requires a dark map with high-contrast markers; CARTO's dark_all variant
// satisfies both (same free, no-key CARTO family) rather than picking one
// requirement over the other.
const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const INDONESIA_CENTER: [number, number] = [-2.5, 118];
const INDONESIA_ZOOM = 5;

function radiusForSeverity(severity: number): number {
  return 5 + severity * 2.5;
}

type DisasterMapProps = {
  events: DisasterEvent[];
  onSelectEvent?: (event: DisasterEvent) => void;
};

export default function DisasterMap({ events, onSelectEvent }: DisasterMapProps) {
  return (
    <MapContainer
      center={INDONESIA_CENTER}
      zoom={INDONESIA_ZOOM}
      style={{ height: "100%", width: "100%", background: "#1a1a1a" }}
      preferCanvas
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      {events.map((event) => (
        <CircleMarker
          key={event.id}
          center={[event.lat, event.lon]}
          radius={radiusForSeverity(event.severity)}
          pathOptions={{
            color: DISASTER_TYPE_COLOR[event.type],
            fillColor: DISASTER_TYPE_COLOR[event.type],
            fillOpacity: event.status === "selesai" ? 0.25 : 0.75,
            opacity: event.status === "selesai" ? 0.4 : 1,
            weight: 1.5,
          }}
          eventHandlers={{ click: () => onSelectEvent?.(event) }}
        >
          <Popup>
            <strong>{event.title}</strong>
            <br />
            {DISASTER_TYPE_LABEL[event.type]} - {STATUS_LABEL[event.status]}
            <br />
            Tingkat keparahan: {event.severityLabel}
            <br />
            <span style={{ fontSize: "0.85em", color: "#555" }}>
              Sumber: {event.sourceName}
            </span>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
