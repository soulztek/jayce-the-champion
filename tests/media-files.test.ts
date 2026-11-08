// @vitest-environment node
import { it, expect } from "vitest";
import { readFileSync, existsSync, statSync } from "node:fs";
import media from "../src/drillMedia.json";
it("every mapped exercise has a real animated GIF, static PNG, and validated distinct frames", () => {
  const report = JSON.parse(
    readFileSync("scripts/media-validation.json", "utf8"),
  );
  for (const m of media) {
    const path = `public/demos/${m.id}`;
    expect(existsSync(path + ".png")).toBe(true);
    const gif = readFileSync(path + ".gif");
    expect(gif.subarray(0, 6).toString()).toBe("GIF89a");
    expect(statSync(path + ".gif").size).toBeLessThan(1_000_000);
    const r = report.find((x: any) => x.id === m.id);
    expect(r.frames).toBeGreaterThanOrEqual(45);
    expect(r.frames).toBeLessThanOrEqual(60);
    expect(r.distinctFrames).toBeGreaterThanOrEqual(15);
    expect(r.durationMs).toBe(4800);
    expect(r.loop).toBe(0);
    expect(r.width).toBe(480);
    expect(r.height).toBe(360);
  }
});

it("validates the supplied-clip derivative without committing the private source", () => {
  const report = JSON.parse(
    readFileSync("scripts/real-crossover-validation.json", "utf8"),
  );
  expect(report.frames).toBe(45);
  expect(report.distinctFrames).toBe(45);
  expect(report.durationMs).toBe(3000);
  expect(report.loop).toBe(0);
  expect(report.width).toBe(480);
  expect(report.height).toBe(270);
  expect(report.bytes).toBeLessThan(1_000_000);
  expect(
    readFileSync("public/demos/crossover-real.gif").subarray(0, 6).toString(),
  ).toBe("GIF89a");
  expect(existsSync("public/demos/crossover-real.png")).toBe(true);
});
