/**
 * Fallback for the wildfire severity engine's peatland factor.
 *
 * Global Forest Watch has a free (CC BY 4.0), Indonesia-covering peatland
 * layer (`gfw_peatlands`, using Miettinen et al. 2016 for Indonesia/
 * Malaysia) - but it is only published as raster map tiles (PNG), with no
 * point-query API. Determining "is this coordinate peatland" from it would
 * mean fetching a tile and decoding pixel values per wildfire cluster on
 * every request - a real engineering cost for one severity sub-factor, not
 * "free and easy to access". BRGM (badan restorasi gambut, Indonesia's own
 * peat agency) was unreachable from this environment to even evaluate.
 *
 * So, per instruction, falling back to province-level bounding boxes for
 * the provinces most associated with peat fires and haze - a coarse but
 * honest approximation, not a real peatland boundary. Bounding boxes are
 * real Nominatim province extents (not hand-drawn), so a cluster outside a
 * province's actual borders but inside its bounding box could still get a
 * false positive (e.g. the box corners reaching into neighboring water or
 * provinces) - documented here, not hidden.
 */
export type ProvinceBoundingBox = {
  name: string;
  south: number;
  north: number;
  west: number;
  east: number;
};

export const PEAT_PRONE_PROVINCES: ProvinceBoundingBox[] = [
  { name: "Riau", south: -1.1281595, north: 3.2269013, west: 100.0248488, east: 103.9519995 },
  { name: "Jambi", south: -2.7700765, north: -0.6436003, west: 101.1305567, east: 105.0122093 },
  { name: "Sumatera Selatan", south: -4.9241592, north: -1.5138437, west: 102.0638889, east: 106.6026347 },
  { name: "Kalimantan Barat", south: -4.7153056, north: 2.3148604, west: 108.1386521, east: 114.2053845 },
  { name: "Kalimantan Tengah", south: -5.1882715, north: 0.791009, west: 110.6795452, east: 115.8493588 },
  { name: "Kalimantan Selatan", south: -5.4138916, north: -1.3125795, west: 113.9911308, east: 117.6465697 },
];

export function isInPeatProneProvince(lat: number, lon: number): ProvinceBoundingBox | null {
  for (const box of PEAT_PRONE_PROVINCES) {
    if (lat >= box.south && lat <= box.north && lon >= box.west && lon <= box.east) {
      return box;
    }
  }
  return null;
}
