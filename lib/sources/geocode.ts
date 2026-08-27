const BASE_URL = "https://nominatim.openstreetmap.org/reverse";
const USER_AGENT = "Mozilla/5.0 (compatible; KitaJagaKita/0.1; +https://github.com/kevingit-byte/kitajagakita)";

type NominatimResponse = {
  address?: {
    county?: string;
    city?: string;
    regency?: string;
    state?: string;
    country?: string;
  };
};

/**
 * Free, no-key reverse geocoding (OpenStreetMap Nominatim) - used only for
 * wildfire clusters, which have coordinates but no place name (unlike BMKG
 * quakes, which carry a Wilayah description, or MAGMA volcanoes, which have
 * a name). Nominatim's usage policy requires a descriptive User-Agent and
 * no more than ~1 req/sec; this is called on-demand per detail-panel open,
 * not in bulk, so that's not a concern here.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
    zoom: "10", // county/regency level, not street-level detail
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 86400 }, // coordinates don't move; cache generously
  });
  if (!res.ok) return null;

  const data = (await res.json()) as NominatimResponse;
  const address = data.address;
  if (!address) return null;

  return address.county ?? address.regency ?? address.city ?? address.state ?? null;
}
