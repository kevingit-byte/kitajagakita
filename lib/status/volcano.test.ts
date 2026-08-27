import { describe, expect, it } from "vitest";
import { classifyVolcanoStatus } from "./volcano";

describe("classifyVolcanoStatus", () => {
  it("Level IV is aktif with tindakan awas", () => {
    const result = classifyVolcanoStatus("IV");
    expect(result.status).toBe("aktif");
    expect(result.tindakan).toBe("awas");
    expect(result.intensitas).toBe("Level IV (Awas) (PVMBG)");
  });

  it("Level III is aktif with tindakan siaga", () => {
    const result = classifyVolcanoStatus("III");
    expect(result.status).toBe("aktif");
    expect(result.tindakan).toBe("siaga");
  });

  it("Level I is selesai with tindakan normal", () => {
    const result = classifyVolcanoStatus("I");
    expect(result.status).toBe("selesai");
    expect(result.tindakan).toBe("normal");
  });

  it("Level II is honestly tidak-diketahui - no history means mereda can't be determined", () => {
    const result = classifyVolcanoStatus("II");
    expect(result.status).toBe("tidak-diketahui");
    expect(result.statusReason).toContain("riwayat");
    expect(result.tindakan).toBe("waspada");
  });
});
