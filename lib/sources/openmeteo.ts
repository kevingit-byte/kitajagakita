const BASE_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";

export type AirQuality = {
  lat: number;
  lon: number;
  pm2_5: number;
  pm10: number;
  usAqi: number;
  observedAt: string;
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    pm2_5: number;
    pm10: number;
    us_aqi: number;
  };
};

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQuality> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: "pm2_5,pm10,us_aqi",
  });

  const res = await fetch(`${BASE_URL}?${params.toString()}`, { next: { revalidate: 1800 } });
  if (!res.ok) {
    throw new Error(`Open-Meteo air quality returned HTTP ${res.status}`);
  }

  const data = (await res.json()) as OpenMeteoResponse;
  return {
    lat: data.latitude,
    lon: data.longitude,
    pm2_5: data.current.pm2_5,
    pm10: data.current.pm10,
    usAqi: data.current.us_aqi,
    observedAt: data.current.time,
  };
}

/** Major cities used for the wildfire-layer AQI panel. */
export const MAJOR_CITIES = [
  { name: "Jakarta", lat: -6.2, lon: 106.8167 },
  { name: "Palangkaraya", lat: -2.2161, lon: 113.9111 },
  { name: "Pekanbaru", lat: 0.5333, lon: 101.45 },
  { name: "Pontianak", lat: -0.0263, lon: 109.3425 },
  { name: "Banjarmasin", lat: -3.3186, lon: 114.5944 },
  { name: "Palembang", lat: -2.9761, lon: 104.7754 },
  { name: "Jambi", lat: -1.6101, lon: 103.6131 },
] as const;
