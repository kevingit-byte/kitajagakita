import { describe, expect, it } from "vitest";
import { classifyGdacsEvent, classifyReliefWebDisaster } from "./other";

describe("classifyGdacsEvent", () => {
  it("treats the string 'false' as closed, not just boolean false", () => {
    const result = classifyGdacsEvent("Red", "false", "2026-08-14T21:58:21", new Date("2026-08-27T00:00:00Z"));
    expect(result.status).toBe("selesai");
  });

  it("is aktif when iscurrent is 'true' and todate is recent", () => {
    const result = classifyGdacsEvent("Orange", "true", "2026-08-26T12:00:00Z", new Date("2026-08-27T00:00:00Z"));
    expect(result.status).toBe("aktif");
  });

  it("is selesai when todate is more than 24h in the past even if iscurrent is 'true'", () => {
    const result = classifyGdacsEvent("Orange", "true", "2026-08-20T00:00:00Z", new Date("2026-08-27T00:00:00Z"));
    expect(result.status).toBe("selesai");
  });

  it("maps alert level to severity", () => {
    expect(classifyGdacsEvent("Green", "true", "2026-08-27T00:00:00Z", new Date("2026-08-27T00:00:00Z")).severity).toBe(2);
    expect(classifyGdacsEvent("Orange", "true", "2026-08-27T00:00:00Z", new Date("2026-08-27T00:00:00Z")).severity).toBe(3);
    expect(classifyGdacsEvent("Red", "true", "2026-08-27T00:00:00Z", new Date("2026-08-27T00:00:00Z")).severity).toBe(5);
  });
});

describe("classifyReliefWebDisaster", () => {
  it("is selesai when status is 'past'", () => {
    expect(classifyReliefWebDisaster("past").status).toBe("selesai");
  });

  it("is aktif otherwise", () => {
    expect(classifyReliefWebDisaster("current").status).toBe("aktif");
    expect(classifyReliefWebDisaster("alert").status).toBe("aktif");
  });
});
