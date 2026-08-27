import { describe, expect, it } from "vitest";
import { isNearStaticSource, STATIC_EXCLUSION_SOURCES } from "./staticSources";

describe("isNearStaticSource", () => {
  it("flags a point at the exact coordinate of a known source", () => {
    const bantarGebang = STATIC_EXCLUSION_SOURCES.find((s) => s.name === "TPST Bantar Gebang")!;
    const result = isNearStaticSource(bantarGebang.lat, bantarGebang.lon);
    expect(result?.name).toBe("TPST Bantar Gebang");
  });

  it("does not flag a point far from every known source", () => {
    // Middle of the Java Sea, nowhere near any listed source.
    expect(isNearStaticSource(-5.5, 110.0)) .toBeNull();
  });

  it("does not flag a point just outside a source's radius", () => {
    const suralaya = STATIC_EXCLUSION_SOURCES.find((s) => s.name === "PLTU Suralaya")!;
    // ~3km north, outside the 2km radius.
    const result = isNearStaticSource(suralaya.lat - 0.027, suralaya.lon);
    expect(result).toBeNull();
  });
});
