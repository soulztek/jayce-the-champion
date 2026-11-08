import { describe, it, expect } from "vitest";
import {
  freshStore,
  adjust,
  total,
  countKeys,
  parseStore,
  rollover,
  archiveAndStart,
  completeStep,
  allComplete,
  cue,
  dayKey,
} from "../src/model";
describe("private session model", () => {
  it("starts with isolated zero counters and editable five-make goals", () => {
    const s = freshStore();
    expect(s.goals).toEqual({ ladder: 5, drills: 5 });
    expect(countKeys).toHaveLength(19);
    expect(total(s.current)).toBe(0);
    expect(s.current.warmup).toEqual(Array(5).fill(false));
  });
  it("increments, undoes, bounds and rejects unknown counters", () => {
    let s = freshStore().current;
    s = adjust(s, "s0", 1);
    expect(s.counts.s0).toBe(1);
    s = adjust(s, "s0", -2);
    expect(s.counts.s0).toBe(0);
    expect(adjust(s, "s0", 10000).counts.s0).toBe(999);
    expect(adjust(s, "bad", 1)).toBe(s);
  });
  it("does not change saved session counters", () => {
    const s = { ...freshStore().current, finished: true };
    expect(adjust(s, "s0", 1)).toBe(s);
  });
  it("requires both sides of every move, never conflates finishing hands", () => {
    const s = freshStore().current;
    for (let step = 2; step < 8; step++) {
      const key = `${step < 5 ? "layup" : "pullup"}-${(step - 2) % 3}`;
      s.counts[key + "-right"] = 5;
      expect(completeStep(s, step)).toBe(false);
      s.counts[key + "-left"] = 5;
      expect(completeStep(s, step)).toBe(true);
    }
    expect(allComplete(s)).toBe(false);
  });
  it("recognizes full targets and changed goals", () => {
    const s = freshStore().current;
    s.warmup.fill(true);
    countKeys.forEach((k) => (s.counts[k] = 5));
    expect(allComplete(s)).toBe(true);
    s.goals.ladder = 6;
    expect(allComplete(s)).toBe(false);
  });
  it("archives active work on local date change, once, then preserves same-day identity", () => {
    const store = freshStore("2026-11-08");
    store.current = adjust(store.current, "s0", 3);
    const next = rollover(store, "2026-11-09");
    expect(next.current.date).toBe("2026-11-09");
    expect(total(next.current)).toBe(0);
    expect(total(next.history[0])).toBe(3);
    expect(next.history[0].finished).toBe(false);
    expect(rollover(next, "2026-11-09")).toBe(next);
  });
  it("does not fill history with empty days", () => {
    expect(rollover(freshStore("2026-11-01"), "2026-11-09").history).toEqual(
      [],
    );
  });
  it("keeps goal snapshots and bounds history to 365 sessions", () => {
    const s = freshStore();
    s.current.finished = true;
    s.history = Array(365).fill(s.current);
    s.goals.drills = 3;
    const n = archiveAndStart(s);
    expect(n.history).toHaveLength(365);
    expect(n.history[0].goals.drills).toBe(5);
    expect(n.current.goals.drills).toBe(3);
  });
  it("roundtrips all counters through JSON backup", () => {
    const s = freshStore();
    s.current = adjust(s.current, "pullup-2-left", 4);
    expect(parseStore(JSON.stringify(s))).toEqual(s);
  });
  it.each(["{", "null", "[]", "{}", '{"version":2}'])(
    "rejects malformed or unrelated backup %s",
    (raw) => {
      expect(() => parseStore(raw)).toThrow();
    },
  );
  it("rejects negative, missing, huge, NaN, wrong date and wrong goals", () => {
    const mutations = [
      (s: any) => (s.current.counts.s0 = -1),
      (s: any) => delete s.current.counts.s0,
      (s: any) => (s.goals.ladder = 26),
      (s: any) => (s.current.date = "2026-02-31"),
      (s: any) => (s.current.warmup = [1]),
      (s: any) => (s.current.step = 8),
      (s: any) => (s.current.counts.s0 = null),
    ];
    for (const mutate of mutations) {
      const s = freshStore();
      mutate(s);
      expect(() => parseStore(JSON.stringify(s))).toThrow();
    }
    expect(() => parseStore("x".repeat(2_000_001))).toThrow(/large/);
  });
  it("discards imported unknown fields, including prototype-like keys", () => {
    const s = JSON.parse(JSON.stringify(freshStore()));
    s.evil = "ignore";
    s.current.evil = "ignore";
    s.goals.evil = "ignore";
    const clean = parseStore(JSON.stringify(s));
    expect(clean).not.toHaveProperty("evil");
    expect(clean.current).not.toHaveProperty("evil");
    expect(clean.goals).not.toHaveProperty("evil");
  });
  it("uses locally formatted dates rather than UTC slicing", () => {
    const d = new Date(2026, 10, 8, 23, 30);
    expect(dayKey(d)).toBe("2026-11-08");
  });
  it("describes double crossover returning to original hand and normal pull-up form", () => {
    expect(cue(1, "right")).toContain(
      "Start right hand → cross to left → cross back to right",
    );
    expect(cue(1, "left")).toContain("finish with your left hand");
    expect(cue(0, "right", true)).toContain(
      "usual shooting hand and guide hand",
    );
    expect(cue(2, "left")).toContain("same hand (no carry)");
  });
});
