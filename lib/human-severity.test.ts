import { describe, expect, it } from "vitest";
import { levelFromEventSeverity, levelFromSafetyLevel } from "./human-severity";

describe("levelFromSafetyLevel", () => {
  it("maps each composite score level directly", () => {
    expect(levelFromSafetyLevel("AMAN").level).toBe("aman");
    expect(levelFromSafetyLevel("WASPADA").level).toBe("waspada");
    expect(levelFromSafetyLevel("SIAGA").level).toBe("siaga");
    expect(levelFromSafetyLevel("BAHAYA").level).toBe("bahaya");
  });
});

describe("levelFromEventSeverity", () => {
  it("scales severity 1-5 into the 4-level language", () => {
    expect(levelFromEventSeverity(1, "aktif").level).toBe("aman");
    expect(levelFromEventSeverity(2, "aktif").level).toBe("waspada");
    expect(levelFromEventSeverity(3, "aktif").level).toBe("siaga");
    expect(levelFromEventSeverity(4, "aktif").level).toBe("bahaya");
    expect(levelFromEventSeverity(5, "aktif").level).toBe("bahaya");
  });

  it("always reads as calm once an event is selesai, regardless of severity", () => {
    expect(levelFromEventSeverity(5, "selesai").level).toBe("aman");
  });
});
