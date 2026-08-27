import { haversineDistanceKm } from "../geo";

/**
 * Second-layer filter: known non-fire heat sources (landfills, industrial
 * flares/furnaces, large power plants) that reliably trigger satellite
 * thermal-anomaly detections year-round, unrelated to vegetation fire.
 *
 * This exists because FIRMS' `type` field (0=vegetation fire, 1=volcano,
 * 2=other static land source, 3=offshore) - which would filter most of
 * this automatically - is not present in the NRT area/csv API this app
 * uses (confirmed against both saved samples and a live fetch: the CSV
 * header has no `type` column at all for VIIRS_NOAA20_NRT, VIIRS_SNPP_NRT,
 * or MODIS_NRT). A `type`-carrying product exists (VIIRS_NOAA20_SP,
 * "Standard Processing") but returned zero detections for all of Indonesia
 * over a full day when tested - far too much latency for this app's
 * 15-minute refresh cycle. So this list is deliberately not exhaustive;
 * it is a manual, sourced compensating control for the specific locations
 * most likely to produce a visible false "titik panas" near a major city.
 *
 * Coordinates geocoded via OpenStreetMap Nominatim against the actual
 * named facility/locality, not guessed. Radius is intentionally generous
 * (2km) since these are large sites, not point sources.
 */
export type StaticSource = {
  name: string;
  lat: number;
  lon: number;
  radiusKm: number;
  note: string;
};

export const STATIC_EXCLUSION_SOURCES: StaticSource[] = [
  {
    name: "TPST Bantar Gebang",
    lat: -6.3464849,
    lon: 106.9772759,
    radiusKm: 2,
    note: "TPA/landfill terbesar di Indonesia, dikenal menghasilkan panas dari gas metana dan kebakaran sampah kronis, bukan karhutla vegetasi.",
  },
  {
    name: "Pelabuhan Tanjung Priok",
    lat: -6.1045642,
    lon: 106.8805674,
    radiusKm: 2,
    note: "Kawasan pelabuhan dan industri padat di Jakarta Utara.",
  },
  {
    name: "PLTU Suralaya",
    lat: -5.8892932,
    lon: 106.0334009,
    radiusKm: 2,
    note: "Kompleks PLTU batubara terbesar di Indonesia (Cilegon, Banten).",
  },
  {
    name: "PLTU Tanjung Jati B",
    lat: -6.4470502,
    lon: 110.7421988,
    radiusKm: 2,
    note: "PLTU batubara besar di Jepara, Jawa Tengah.",
  },
];

export function isNearStaticSource(lat: number, lon: number): StaticSource | null {
  for (const source of STATIC_EXCLUSION_SOURCES) {
    if (haversineDistanceKm(lat, lon, source.lat, source.lon) <= source.radiusKm) {
      return source;
    }
  }
  return null;
}
