import { describe, expect, it } from "vitest";
import { isInPeatProneProvince } from "./peat-prone-provinces";

describe("isInPeatProneProvince", () => {
  it("flags a point inside Riau's bounding box", () => {
    expect(isInPeatProneProvince(0.5, 101.5)?.name).toBe("Riau");
  });

  it("flags a point inside Kalimantan Tengah's bounding box", () => {
    // 114.5°E is east of Kalimantan Barat's bbox (up to ~114.2°E) but still
    // inside Kalimantan Tengah's, so this lands unambiguously in one box -
    // unlike (-2, 113), several of these provinces' bounding boxes overlap.
    expect(isInPeatProneProvince(-2.2, 114.5)?.name).toBe("Kalimantan Tengah");
  });

  it("does not flag Jakarta", () => {
    expect(isInPeatProneProvince(-6.2, 106.8)).toBeNull();
  });

  it("does not flag Papua, which is not in the peat-prone list", () => {
    expect(isInPeatProneProvince(-4.5, 138.0)).toBeNull();
  });
});
