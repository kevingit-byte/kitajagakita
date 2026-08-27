import provinceCoordinates from "./province-coordinates.json";
import { MAJOR_CITIES } from "../sources/openmeteo";

export type LocationOption = { id: string; label: string; lat: number; lon: number };

const provinces: LocationOption[] = (provinceCoordinates as { name: string; lat: number; lon: number }[]).map(
  (p) => ({ id: `province-${p.name}`, label: p.name, lat: p.lat, lon: p.lon }),
);

// Some province capitals share their province's name (Jambi being both a
// city and a province name is the real case this caught: without a "(Kota)"
// suffix and a separate `id`, the two entries collided both as a React key
// and as the dropdown's selection value, so picking one would silently
// resolve to whichever appeared first in the sorted list).
const cities: LocationOption[] = MAJOR_CITIES.map((c) => ({
  id: `city-${c.name}`,
  label: `${c.name} (Kota)`,
  lat: c.lat,
  lon: c.lon,
}));

/** Combined province + major-city list for the location-check dropdown. */
export const LOCATION_OPTIONS: LocationOption[] = [...cities, ...provinces].sort((a, b) =>
  a.label.localeCompare(b.label, "id"),
);
