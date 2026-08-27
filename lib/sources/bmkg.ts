const BASE_URL = "https://data.bmkg.go.id/DataMKG/TEWS";
const USER_AGENT = "Mozilla/5.0 (compatible; KitaJagaKita/0.1; +https://github.com/kevingit-byte/kitajagakita)";

// BMKG's three endpoints share most fields but not all: only autogempa and
// gempaterkini carry `Potensi` (tsunami potential text), only autogempa and
// gempadirasakan carry `Dirasakan` (felt-intensity MMI). Confirmed against
// real samples in docs/samples/, not assumed from the endpoint names.
type BmkgGempaRaw = {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string;
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi?: string;
  Dirasakan?: string;
  Shakemap?: string;
};

type BmkgSingleResponse = { Infogempa: { gempa: BmkgGempaRaw } };
type BmkgListResponse = { Infogempa: { gempa: BmkgGempaRaw[] } };

export type BmkgQuake = {
  id: string;
  dateTime: string;
  lat: number;
  lon: number;
  magnitude: number;
  depthKm: number;
  wilayah: string;
  potensi: string | null;
  dirasakan: string | null;
  shakemap: string | null;
};

function parseCoordinates(coordinates: string): { lat: number; lon: number } {
  const [latStr, lonStr] = coordinates.split(",");
  return { lat: Number.parseFloat(latStr), lon: Number.parseFloat(lonStr) };
}

function parseDepthKm(kedalaman: string): number {
  return Number.parseFloat(kedalaman.replace(/[^0-9.]/g, ""));
}

function toBmkgQuake(raw: BmkgGempaRaw): BmkgQuake {
  const { lat, lon } = parseCoordinates(raw.Coordinates);
  return {
    id: `bmkg-${raw.DateTime}-${raw.Coordinates}`,
    dateTime: raw.DateTime,
    lat,
    lon,
    magnitude: Number.parseFloat(raw.Magnitude),
    depthKm: parseDepthKm(raw.Kedalaman),
    wilayah: raw.Wilayah,
    potensi: raw.Potensi ?? null,
    dirasakan: raw.Dirasakan ?? null,
    shakemap: raw.Shakemap ?? null,
  };
}

async function fetchBmkg<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/${path}`, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    throw new Error(`BMKG ${path} returned HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchAutogempa(): Promise<BmkgQuake> {
  const data = await fetchBmkg<BmkgSingleResponse>("autogempa.json");
  return toBmkgQuake(data.Infogempa.gempa);
}

export async function fetchGempaterkini(): Promise<BmkgQuake[]> {
  const data = await fetchBmkg<BmkgListResponse>("gempaterkini.json");
  return data.Infogempa.gempa.map(toBmkgQuake);
}

export async function fetchGempadirasakan(): Promise<BmkgQuake[]> {
  const data = await fetchBmkg<BmkgListResponse>("gempadirasakan.json");
  return data.Infogempa.gempa.map(toBmkgQuake);
}

/** Merges all three BMKG endpoints into one deduplicated list, newest first. */
export async function fetchAllBmkgQuakes(): Promise<BmkgQuake[]> {
  const results = await Promise.allSettled([
    fetchAutogempa().then((q) => [q]),
    fetchGempaterkini(),
    fetchGempadirasakan(),
  ]);

  const merged = new Map<string, BmkgQuake>();
  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const quake of result.value) {
      const existing = merged.get(quake.id);
      // Prefer whichever record carries more fields (dirasakan/potensi vary by endpoint).
      if (!existing) {
        merged.set(quake.id, quake);
      } else {
        merged.set(quake.id, {
          ...existing,
          potensi: existing.potensi ?? quake.potensi,
          dirasakan: existing.dirasakan ?? quake.dirasakan,
          shakemap: existing.shakemap ?? quake.shakemap,
        });
      }
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
  );
}

