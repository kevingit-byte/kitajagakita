import { describe, expect, it } from "vitest";
import { classifyWildfireCluster, type WildfireCluster } from "./wildfire";

const NOW = new Date("2026-08-27T04:00:00Z");
const TODAY = "2026-08-27";
const YESTERDAY = "2026-08-26";
const DAY_BEFORE = "2026-08-25";

function makeCluster(countsByDate: Record<string, number>, overrides: Partial<WildfireCluster> = {}): WildfireCluster {
  const pointCount = Object.values(countsByDate).reduce((a, b) => a + b, 0);
  return {
    id: "test-cluster",
    centerLat: -2,
    centerLon: 113,
    pointCount,
    totalFrp: pointCount * 5,
    countsByDate,
    latestAcqDate: TODAY,
    points: [],
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

describe("classifyWildfireCluster - severity", () => {
  it("scales severity up with point count and total FRP", () => {
    const small = classifyWildfireCluster(makeCluster({ [TODAY]: 3 }, { totalFrp: 15 }), NOW);
    const large = classifyWildfireCluster(makeCluster({ [TODAY]: 60 }, { totalFrp: 900 }), NOW);
    expect(large.severity).toBeGreaterThan(small.severity);
  });
});
