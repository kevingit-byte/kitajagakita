import { describe, expect, it } from "vitest";
import { buildQuakeSequences, type QuakeInput } from "./earthquake";

/**
 * Real data from docs/samples/bmkg-gempaterkini.json + bmkg-autogempa.json,
 * converted to the USGS-shaped QuakeInput. This is the exact sequence a
 * user flagged from a live BMKG pull: 9 of 15 gempaterkini events plus the
 * latest autogempa event cluster around Ruteng/Mbay-Nagekeo (19-27 Aug),
 * with Sangihe (295km deep), 2x Maluku, Sulawesi Tengah, Banten, and a
 * Sulut/Philippines-border event as genuinely isolated singles.
 */
const RUTENG_SEQUENCE_QUAKES: QuakeInput[] = [
  { id: "q1", magnitude: 5.0, timeMs: Date.parse("2026-08-26T14:15:32Z"), lat: -8.38, lon: 121.54, depthKm: 10, place: "Mbay-Nagekeo" },
  { id: "q2", magnitude: 5.1, timeMs: Date.parse("2026-08-25T06:48:21Z"), lat: 3.44, lon: 124.53, depthKm: 295, place: "Sangihe" },
  { id: "q3", magnitude: 6.2, timeMs: Date.parse("2026-08-24T14:10:18Z"), lat: -6.67, lon: 127.45, depthKm: 10, place: "Maluku Barat Daya" },
  { id: "q4", magnitude: 5.6, timeMs: Date.parse("2026-08-24T10:03:00Z"), lat: -5.01, lon: 129.68, depthKm: 10, place: "Maluku Tengah" },
  { id: "q5", magnitude: 5.2, timeMs: Date.parse("2026-08-23T21:20:18Z"), lat: -8.30, lon: 120.62, depthKm: 10, place: "Ruteng-Manggarai" },
  { id: "q6", magnitude: 5.4, timeMs: Date.parse("2026-08-22T19:54:08Z"), lat: -0.30, lon: 123.06, depthKm: 86, place: "Sulawesi Tengah" },
  { id: "q7", magnitude: 5.2, timeMs: Date.parse("2026-08-22T01:31:00Z"), lat: -8.03, lon: 120.68, depthKm: 10, place: "Ruteng-Manggarai" },
  { id: "q8", magnitude: 5.8, timeMs: Date.parse("2026-08-21T17:41:43Z"), lat: -7.72, lon: 104.47, depthKm: 10, place: "Sumur-Banten" },
  { id: "q9", magnitude: 5.3, timeMs: Date.parse("2026-08-20T18:12:53Z"), lat: -8.21, lon: 121.38, depthKm: 10, place: "Mbay-Nagekeo" },
  { id: "q10", magnitude: 5.4, timeMs: Date.parse("2026-08-20T09:30:54Z"), lat: -8.30, lon: 120.57, depthKm: 10, place: "Ruteng-Manggarai" },
  { id: "q11", magnitude: 5.2, timeMs: Date.parse("2026-08-20T08:01:32Z"), lat: -8.24, lon: 120.62, depthKm: 10, place: "Ruteng-Manggarai" },
  { id: "q12", magnitude: 5.7, timeMs: Date.parse("2026-08-20T02:47:00Z"), lat: -8.28, lon: 120.60, depthKm: 10, place: "Ruteng-Manggarai (mainshock)" },
  { id: "q13", magnitude: 5.6, timeMs: Date.parse("2026-08-19T22:45:19Z"), lat: -8.30, lon: 120.59, depthKm: 10, place: "Ruteng-Manggarai" },
  { id: "q14", magnitude: 5.7, timeMs: Date.parse("2026-08-19T16:17:40Z"), lat: -8.23, lon: 120.53, depthKm: 10, place: "Ruteng-Manggarai" },
  { id: "q15", magnitude: 5.2, timeMs: Date.parse("2026-08-19T11:01:30Z"), lat: 5.62, lon: 125.24, depthKm: 10, place: "Sulut/Philippines border" },
  { id: "autogempa", magnitude: 4.6, timeMs: Date.parse("2026-08-26T18:34:58Z"), lat: -8.19, lon: 120.64, depthKm: 10, place: "Ruteng-Manggarai (autogempa)" },
];

const NOW = new Date("2026-08-27T04:00:00Z");

describe("buildQuakeSequences - Ruteng aftershock sequence (real data)", () => {
  const sequences = buildQuakeSequences(RUTENG_SEQUENCE_QUAKES, NOW);

  it("groups exactly one 10-event Ruteng/Mbay-Nagekeo sequence via chain reachability", () => {
    const rutengSeq = sequences.find((s) => s.mainshock.place.includes("Ruteng"));
    expect(rutengSeq).toBeDefined();
    expect(rutengSeq!.aftershocks.length + 1).toBe(10);

    const ids = new Set([rutengSeq!.mainshock.id, ...rutengSeq!.aftershocks.map((a) => a.id)]);
    expect(ids).toEqual(new Set(["q1", "q5", "q7", "q9", "q10", "q11", "q12", "q13", "q14", "autogempa"]));
  });

  it("keeps Sangihe (295km deep), Maluku x2, Sulawesi Tengah, Banten, and Sulut as isolated singles", () => {
    const singleIds = sequences.filter((s) => s.aftershocks.length === 0).map((s) => s.mainshock.id);
    expect(new Set(singleIds)).toEqual(new Set(["q2", "q3", "q4", "q6", "q8", "q15"]));
  });

  it("picks the earliest of the tied M5.7 events as mainshock", () => {
    const rutengSeq = sequences.find((s) => s.mainshock.place.includes("Ruteng"))!;
    // q12 (20 Aug 02:47Z) and q14 (19 Aug 16:17Z) are both M5.7 - q14 is earlier.
    expect(rutengSeq.mainshock.id).toBe("q14");
  });

  it("marks the Ruteng sequence aktif (autogempa M4.6 was ~9.4h before NOW)", () => {
    const rutengSeq = sequences.find((s) => s.mainshock.place.includes("Ruteng"))!;
    expect(rutengSeq.status).toBe("aktif");
    expect(rutengSeq.statusReason).toContain("24 jam");
  });
});

describe("buildQuakeSequences - status transitions", () => {
  const mainshock: QuakeInput = { id: "m", magnitude: 6.0, timeMs: Date.parse("2026-08-01T00:00:00Z"), lat: 0, lon: 0, depthKm: 10, place: "test" };

  it("selesai when no aftershock ever reached M3.5", () => {
    const weakAftershock: QuakeInput = { id: "a", magnitude: 3.0, timeMs: Date.parse("2026-08-01T01:00:00Z"), lat: 0.1, lon: 0.1, depthKm: 10, place: "test" };
    const [seq] = buildQuakeSequences([mainshock, weakAftershock], new Date("2026-08-01T02:00:00Z"));
    expect(seq.status).toBe("selesai");
  });

  it("aktif when a >=M3.5 aftershock hit within the last 24h", () => {
    const recentAftershock: QuakeInput = { id: "a", magnitude: 4.0, timeMs: Date.parse("2026-08-01T10:00:00Z"), lat: 0.1, lon: 0.1, depthKm: 10, place: "test" };
    const [seq] = buildQuakeSequences([mainshock, recentAftershock], new Date("2026-08-01T20:00:00Z"));
    expect(seq.status).toBe("aktif");
  });

  it("mereda when the last qualifying aftershock was 24-72h ago", () => {
    const aftershock: QuakeInput = { id: "a", magnitude: 4.0, timeMs: Date.parse("2026-08-01T00:00:00Z"), lat: 0.1, lon: 0.1, depthKm: 10, place: "test" };
    const [seq] = buildQuakeSequences([mainshock, aftershock], new Date("2026-08-02T12:00:00Z")); // 36h later
    expect(seq.status).toBe("mereda");
  });

  it("selesai when the last qualifying aftershock was over 72h ago", () => {
    const aftershock: QuakeInput = { id: "a", magnitude: 4.0, timeMs: Date.parse("2026-08-01T00:00:00Z"), lat: 0.1, lon: 0.1, depthKm: 10, place: "test" };
    const [seq] = buildQuakeSequences([mainshock, aftershock], new Date("2026-08-05T00:00:00Z")); // 96h later
    expect(seq.status).toBe("selesai");
  });
});
