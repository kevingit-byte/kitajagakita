import { describe, expect, it } from "vitest";
import { classifyWildfireCluster, type WildfireCluster } from "./wildfire";
import type { FirmsHotspot } from "../sources/firms";

const NOW = new Date("2026-08-27T04:00:00Z");
const TODAY = "2026-08-27";
const YESTERDAY = "2026-08-26";
const DAY_BEFORE = "2026-08-25";

function makeHotspot(overrides: Partial<FirmsHotspot> = {}): FirmsHotspot {
  return {
    lat: -2,
    lon: 113,
    brightnessK: 330,
    confidencePercent: 80,
    acqDate: TODAY,
    acqTime: "0000",
    frp: 5,
    satellite: "N20",
    product: "VIIRS_NOAA20_NRT",
    daynight: "D",
    ...overrides,
  };
}

function makeCluster(countsByDate: Record<string, number>, overrides: Partial<WildfireCluster> = {}): WildfireCluster {
  const pointCount = Object.values(countsByDate).reduce((a, b) => a + b, 0);
  const points: FirmsHotspot[] = [];
  for (const [date, count] of Object.entries(countsByDate)) {
    for (let i = 0; i < count; i++) points.push(makeHotspot({ acqDate: date }));
  }
  return {
    id: "test-cluster",
    centerLat: -2,
    centerLon: 113,
    pointCount,
    totalFrp: pointCount * 5,
    countsByDate,
    latestAcqDate: TODAY,
    points,
    ...overrides,
  };
}

describe("classifyWildfireCluster - status", () => {
  it("aktif when today's detections exceed yesterday's (growing)", () => {
    const cluster = makeCluster({ [TODAY]: 20, [YESTERDAY]: 10 });
    const result = classifyWildfireCluster(cluster, NOW);
    expect(result.status).toBe("aktif");
    expect(result.statusReason).toContain("meluas");
  });

  it("aktif when today's detections are roughly equal to yesterday's (stable)", () => {
    const cluster = makeCluster({ [TODAY]: 10, [YESTERDAY]: 11 });
    const result = classifyWildfireCluster(cluster, NOW);
    expect(result.status).toBe("aktif");
    expect(result.statusReason).toContain("stabil");
  });

  it("mereda when today's detections are under half of yesterday's", () => {
    const cluster = makeCluster({ [TODAY]: 3, [YESTERDAY]: 10 });
    const result = classifyWildfireCluster(cluster, NOW);
    expect(result.status).toBe("mereda");
  });

  it("selesai when zero detections today despite detections in the prior 48h", () => {
    const cluster = makeCluster({ [YESTERDAY]: 8, [DAY_BEFORE]: 5 });
    const result = classifyWildfireCluster(cluster, NOW);
    expect(result.status).toBe("selesai");
  });

  it("selesai when zero today but detections only 2 days ago (still within 48h)", () => {
    const cluster = makeCluster({ [DAY_BEFORE]: 6 });
    const result = classifyWildfireCluster(cluster, NOW);
    expect(result.status).toBe("selesai");
  });

  it("tidak-diketahui when the cluster has no detections in the 3-day window at all", () => {
    const cluster = makeCluster({ "2026-08-01": 4 });
    const result = classifyWildfireCluster(cluster, NOW);
    expect(result.status).toBe("tidak-diketahui");
  });
});

// Point shape ({lat, lon}) and cluster shape ({centerLat, centerLon}) are
// deliberately kept as separate constants below, not one object spread
// into both - spreading a {centerLat, centerLon} object into a hotspot
// (which needs {lat, lon}) silently no-ops and leaves the point at
// makeHotspot's default coordinates instead. That exact mistake produced
// a bogus 831km "spread" in an earlier version of these tests: the
// cluster centroid said Jakarta, but every point silently defaulted to
// (-2, 113) instead.
const JAKARTA_POINT = { lat: -6.2, lon: 106.8 }; // not peat-prone
const JAKARTA_CLUSTER = { centerLat: -6.2, centerLon: 106.8 };

/** Maps tindakan to a comparable ordinal for "greater than" assertions below. */
const TINDAKAN_RANK: Record<string, number> = { normal: 0, waspada: 1, siaga: 2, awas: 3 };

describe("classifyWildfireCluster - tindakan", () => {
  it("does not scale tindakan from point count alone when FRP/spread/trend/peat are held flat", () => {
    // Many low-FRP points clustered tightly vs a handful of the same
    // low-FRP points, both outside any peat province, no growth trend -
    // point count must not be the thing driving tindakan apart.
    const fewPoints = makeCluster(
      { [TODAY]: 2 },
      {
        ...JAKARTA_CLUSTER,
        totalFrp: 4,
        points: [makeHotspot({ ...JAKARTA_POINT, frp: 2 }), makeHotspot({ ...JAKARTA_POINT, frp: 2 })],
      },
    );
    const manyPoints = makeCluster(
      { [TODAY]: 40 },
      {
        ...JAKARTA_CLUSTER,
        totalFrp: 4,
        points: Array.from({ length: 40 }, () => makeHotspot({ ...JAKARTA_POINT, frp: 0.1 })),
      },
    );
    expect(classifyWildfireCluster(manyPoints, NOW).tindakan).toBe(classifyWildfireCluster(fewPoints, NOW).tindakan);
  });

  it("scales tindakan up with total FRP", () => {
    const low = makeCluster(
      { [TODAY]: 1 },
      { ...JAKARTA_CLUSTER, totalFrp: 3, points: [makeHotspot({ ...JAKARTA_POINT, frp: 3 })] },
    );
    const high = makeCluster(
      { [TODAY]: 1 },
      { ...JAKARTA_CLUSTER, totalFrp: 600, points: [makeHotspot({ ...JAKARTA_POINT, frp: 600 })] },
    );
    expect(TINDAKAN_RANK[classifyWildfireCluster(high, NOW).tindakan]).toBeGreaterThan(
      TINDAKAN_RANK[classifyWildfireCluster(low, NOW).tindakan],
    );
  });

  it("scales tindakan up with cluster spread", () => {
    const tight = makeCluster(
      { [TODAY]: 2 },
      {
        ...JAKARTA_CLUSTER,
        totalFrp: 10,
        points: [makeHotspot({ lat: -6.2, lon: 106.8 }), makeHotspot({ lat: -6.201, lon: 106.801 })],
      },
    );
    const wide = makeCluster(
      { [TODAY]: 2 },
      {
        ...JAKARTA_CLUSTER,
        totalFrp: 10,
        points: [makeHotspot({ lat: -6.2, lon: 106.8 }), makeHotspot({ lat: -6.3, lon: 106.9 })], // ~15km away
      },
    );
    expect(TINDAKAN_RANK[classifyWildfireCluster(wide, NOW).tindakan]).toBeGreaterThan(
      TINDAKAN_RANK[classifyWildfireCluster(tight, NOW).tindakan],
    );
  });

  it("scales tindakan up when FRP is escalating over the 3-day window", () => {
    const declining = makeCluster(
      {},
      {
        ...JAKARTA_CLUSTER,
        totalFrp: 60,
        points: [
          makeHotspot({ ...JAKARTA_POINT, acqDate: DAY_BEFORE, frp: 50 }),
          makeHotspot({ ...JAKARTA_POINT, acqDate: TODAY, frp: 10 }),
        ],
      },
    );
    const escalating = makeCluster(
      {},
      {
        ...JAKARTA_CLUSTER,
        totalFrp: 60,
        points: [
          makeHotspot({ ...JAKARTA_POINT, acqDate: DAY_BEFORE, frp: 10 }),
          makeHotspot({ ...JAKARTA_POINT, acqDate: TODAY, frp: 50 }),
        ],
      },
    );
    expect(TINDAKAN_RANK[classifyWildfireCluster(escalating, NOW).tindakan]).toBeGreaterThan(
      TINDAKAN_RANK[classifyWildfireCluster(declining, NOW).tindakan],
    );
  });

  it("scales tindakan up for a cluster in a peat-prone province vs an identical one that isn't", () => {
    const nonPeat = makeCluster(
      { [TODAY]: 1 },
      { ...JAKARTA_CLUSTER, totalFrp: 20, points: [makeHotspot({ ...JAKARTA_POINT, frp: 20 })] },
    );
    // -2, 113 falls inside multiple adjacent Kalimantan provinces' bounding
    // boxes (they overlap - a known, documented limitation of the bbox
    // fallback) - so this only asserts *a* peat province was matched, not
    // which specific one.
    const peat = makeCluster(
      { [TODAY]: 1 },
      { centerLat: -2, centerLon: 113, totalFrp: 20, points: [makeHotspot({ lat: -2, lon: 113, frp: 20 })] },
    );
    expect(TINDAKAN_RANK[classifyWildfireCluster(peat, NOW).tindakan]).toBeGreaterThan(
      TINDAKAN_RANK[classifyWildfireCluster(nonPeat, NOW).tindakan],
    );
    expect(classifyWildfireCluster(peat, NOW).tindakanReason).toContain("gambut");
  });
});

describe("classifyWildfireCluster - intensitas", () => {
  it("is null when no nearby AQI reading is available - never estimated", () => {
    const cluster = makeCluster({ [TODAY]: 1 });
    expect(classifyWildfireCluster(cluster, NOW, null).intensitas).toBeNull();
  });

  it("names its scale honestly as AQI, not ISPU, since ISPU's breakpoints could not be verified", () => {
    const cluster = makeCluster({ [TODAY]: 1 });
    const result = classifyWildfireCluster(cluster, NOW, 187);
    expect(result.intensitas).toContain("AQI 187");
    expect(result.intensitas).not.toContain("ISPU 187");
    expect(result.intensitas).toContain("proksi");
  });
});
