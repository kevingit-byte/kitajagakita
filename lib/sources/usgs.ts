const BASE_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query";

type UsgsFeature = {
  type: "Feature";
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    title: string;
  };
  geometry: {
    type: "Point";
    coordinates: [number, number, number]; // [lon, lat, depthKm]
  };
  id: string;
};

type UsgsResponse = {
  type: "FeatureCollection";
  features: UsgsFeature[];
};

export type UsgsQuake = {
  id: string;
  magnitude: number;
  place: string;
  timeMs: number;
  lat: number;
  lon: number;
  depthKm: number;
  url: string;
};

function toUsgsQuake(feature: UsgsFeature): UsgsQuake {
  const [lon, lat, depthKm] = feature.geometry.coordinates;
  return {
    id: feature.id,
    magnitude: feature.properties.mag,
    place: feature.properties.place,
    timeMs: feature.properties.time,
    lat,
    lon,
    depthKm,
    url: feature.properties.url,
  };
}

/** Indonesia bounding box, matching the spec's bbox for aftershock-sequence detection. */
const INDONESIA_BBOX = { minLatitude: -11, maxLatitude: 6, minLongitude: 95, maxLongitude: 141 };

export async function fetchUsgsQuakes(days = 30, minMagnitude = 4): Promise<UsgsQuake[]> {
  const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const params = new URLSearchParams({
    format: "geojson",
    minlatitude: String(INDONESIA_BBOX.minLatitude),
    maxlatitude: String(INDONESIA_BBOX.maxLatitude),
    minlongitude: String(INDONESIA_BBOX.minLongitude),
    maxlongitude: String(INDONESIA_BBOX.maxLongitude),
    minmagnitude: String(minMagnitude),
    starttime: startTime,
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`, {
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    throw new Error(`USGS returned HTTP ${res.status}`);
  }

  const data = (await res.json()) as UsgsResponse;
  return data.features.map(toUsgsQuake);
}
