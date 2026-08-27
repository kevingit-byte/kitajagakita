import { describe, expect, it } from "vitest";
import { levelFromTindakan, levelFromSafetyLevel } from "./human-severity";

describe("levelFromSafetyLevel", () => {
  it("maps each composite score level directly", () => {
    expect(levelFromSafetyLevel("AMAN").level).toBe("aman");
    expect(levelFromSafetyLevel("WASPADA").level).toBe("waspada");
    expect(levelFromSafetyLevel("SIAGA").level).toBe("siaga");
    expect(levelFromSafetyLevel("BAHAYA").level).toBe("bahaya");
  });
});

describe("levelFromTindakan", () => {
  it("maps each tindakan value into the 4-level language", () => {
    expect(levelFromTindakan("normal", "aktif").level).toBe("aman");
    expect(levelFromTindakan("waspada", "aktif").level).toBe("waspada");
    expect(levelFromTindakan("siaga", "aktif").level).toBe("siaga");
    expect(levelFromTindakan("awas", "aktif").level).toBe("bahaya");
  });

  it("always reads as calm once an event is selesai, regardless of tindakan", () => {
    expect(levelFromTindakan("awas", "selesai").level).toBe("aman");
  });
});
