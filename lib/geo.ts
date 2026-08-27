const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Groups points into connected components where an edge exists between any
 * two points within `epsilonKm` of each other (graph/chain reachability,
 * not distance-to-a-single-anchor). This matters: two points can end up in
 * the same cluster by chaining through an intermediate point even if they
 * are individually more than epsilonKm apart from each other.
 */
export function clusterByDistance<T>(
  points: T[],
  epsilonKm: number,
  getCoords: (item: T) => { lat: number; lon: number },
): T[][] {
  const n = points.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(i: number): number {
    while (parent[i] !== i) {
      parent[i] = parent[parent[i]];
      i = parent[i];
    }
    return i;
  }

  function union(a: number, b: number) {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent[rootA] = rootB;
  }

  const coords = points.map(getCoords);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = haversineDistanceKm(coords[i].lat, coords[i].lon, coords[j].lat, coords[j].lon);
      if (dist <= epsilonKm) union(i, j);
    }
  }

  const groups = new Map<number, T[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const group = groups.get(root) ?? [];
    group.push(points[i]);
    groups.set(root, group);
  }

  return Array.from(groups.values());
}
