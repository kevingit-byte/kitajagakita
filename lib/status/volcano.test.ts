import { describe, expect, it } from "vitest";
import { classifyVolcanoStatus } from "./volcano";

describe("classifyVolcanoStatus", () => {
  it("Level IV is aktif with the highest severity", () => {
    const result = classifyVolcanoStatus("IV");
    expect(result.status).toBe("aktif");
    expect(result.severity).toBe(5);
  });

  it("Level III is aktif", () => {
    const result = classifyVolcanoStatus("III");
    expect(result.status).toBe("aktif");
    expect(result.severity).toBe(4);
  });

  it("Level I is selesai with the lowest severity", () => {
    const result = classifyVolcanoStatus("I");
    expect(result.status).toBe("selesai");
    expect(result.severity).toBe(1);
  });

  it("Level II is honestly tidak-diketahui - no history means mereda can't be determined", () => {
    const result = classifyVolcanoStatus("II");
    expect(result.status).toBe("tidak-diketahui");
    expect(result.statusReason).toContain("riwayat");
  });
});
