export const DATA_KEY = "jayce-champion-v1";
export const UI_KEY = "jayce-champion-ui";
export const stations = [
  "2 feet",
  "4 feet",
  "6 feet",
  "8 feet",
  "10 feet",
  "12 feet",
  "Free throw line",
];
export const moves = ["Crossover", "Double crossover", "In-and-out"];
export const warmups = [
  ["March or light jog", "60 sec · Easy pace. Give yourself space."],
  ["Lateral steps", "45 sec · Step side to side; keep your feet apart."],
  ["Ankle rocks", "45 sec · Gently move knees forward over toes, heels down."],
  ["Gentle squats", "45 sec · Small, comfortable range. No weights."],
  [
    "Easy dribble",
    "75 sec · Alternate hands slowly; eyes up when comfortable.",
  ],
];
export type Goals = { ladder: number; drills: number };
export type Session = {
  id: string;
  date: string;
  goals: Goals;
  step: number;
  warmup: boolean[];
  counts: Record<string, number>;
  finished: boolean;
};
export type Store = {
  version: 1;
  goals: Goals;
  current: Session;
  history: Session[];
};
export const countKeys = [
  ...stations.map((_, i) => `s${i}`),
  ...["layup", "pullup"].flatMap((type) =>
    moves.flatMap((_, m) =>
      ["left", "right"].map((side) => `${type}-${m}-${side}`),
    ),
  ),
];
export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function newSession(goals: Goals, date = dayKey()): Session {
  return {
    id: crypto.randomUUID(),
    date,
    goals: { ...goals },
    step: 0,
    warmup: Array(5).fill(false),
    counts: Object.fromEntries(countKeys.map((k) => [k, 0])),
    finished: false,
  };
}
export function freshStore(date = dayKey()): Store {
  const goals = { ladder: 5, drills: 5 };
  return { version: 1, goals, current: newSession(goals, date), history: [] };
}
export function total(s: Session): number {
  return Object.values(s.counts).reduce((a, b) => a + b, 0);
}
export function hasActivity(s: Session): boolean {
  return total(s) > 0 || s.warmup.some(Boolean) || s.finished;
}
export function completeStep(s: Session, step: number): boolean {
  if (step === 0) return s.warmup.every(Boolean);
  if (step === 1)
    return stations.every((_, i) => s.counts[`s${i}`] >= s.goals.ladder);
  const type = step < 5 ? "layup" : "pullup";
  const move = (step - 2) % 3;
  return ["left", "right"].every(
    (side) => s.counts[`${type}-${move}-${side}`] >= s.goals.drills,
  );
}
export function allComplete(s: Session): boolean {
  return Array.from({ length: 8 }, (_, i) => i).every((i) =>
    completeStep(s, i),
  );
}
export function adjust(s: Session, key: string, delta: number): Session {
  if (s.finished || !countKeys.includes(key)) return s;
  return {
    ...s,
    counts: {
      ...s.counts,
      [key]: Math.max(0, Math.min(999, s.counts[key] + delta)),
    },
  };
}
export function archiveAndStart(store: Store, date = dayKey()): Store {
  return {
    ...store,
    current: newSession(store.goals, date),
    history: hasActivity(store.current)
      ? [store.current, ...store.history].slice(0, 365)
      : store.history,
  };
}
export function rollover(store: Store, date = dayKey()): Store {
  return store.current.date === date ? store : archiveAndStart(store, date);
}
function obj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function integer(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}
function validGoals(g: unknown): g is Goals {
  return obj(g) && integer(g.ladder, 1, 25) && integer(g.drills, 1, 25);
}
function validDate(d: unknown): d is string {
  if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const date = new Date(d + "T12:00:00");
  return !Number.isNaN(+date) && dayKey(date) === d;
}
function validSession(s: unknown): s is Session {
  return (
    obj(s) &&
    typeof s.id === "string" &&
    s.id.length > 0 &&
    s.id.length < 100 &&
    validDate(s.date) &&
    validGoals(s.goals) &&
    integer(s.step, 0, 7) &&
    typeof s.finished === "boolean" &&
    Array.isArray(s.warmup) &&
    s.warmup.length === 5 &&
    s.warmup.every((v) => typeof v === "boolean") &&
    obj(s.counts) &&
    Object.keys(s.counts).length === countKeys.length &&
    countKeys.every((k) =>
      integer((s.counts as Record<string, unknown>)[k], 0, 999),
    )
  );
}
export function parseStore(raw: string): Store {
  if (raw.length > 2_000_000) throw new Error("File too large (maximum 2 MB).");
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    throw new Error("This is not a valid JSON backup.");
  }
  if (
    !obj(v) ||
    v.version !== 1 ||
    !validGoals(v.goals) ||
    !validSession(v.current) ||
    !Array.isArray(v.history) ||
    v.history.length > 365 ||
    !v.history.every(validSession)
  )
    throw new Error(
      "This is not a valid Jayce The Champion backup. No data changed.",
    );
  // Copy only known fields; never merge imported objects into application settings.
  const clean = (s: Session): Session => ({
    id: s.id,
    date: s.date,
    goals: { ladder: s.goals.ladder, drills: s.goals.drills },
    step: s.step,
    warmup: [...s.warmup],
    counts: Object.fromEntries(countKeys.map((k) => [k, s.counts[k]])),
    finished: s.finished,
  });
  return {
    version: 1,
    goals: { ladder: v.goals.ladder, drills: v.goals.drills },
    current: clean(v.current),
    history: v.history.map(clean),
  };
}
export function cue(
  move: number,
  side: "left" | "right",
  pullup = false,
): string {
  const other = side === "left" ? "right" : "left";
  const pattern =
    move === 0
      ? `Start ${other} hand → cross to ${side} hand`
      : move === 1
        ? `Start ${side} hand → cross to ${other} → cross back to ${side}`
        : `Start ${side} hand → fake inward, bring it back out in the same hand (no carry)`;
  return `${pattern}. Drive toward the ${side} side. ${pullup ? "Gather with both hands, stop balanced, then shoot with your usual shooting hand and guide hand." : `Gather with both hands; finish with your ${side} hand on the ${side} side of the rim.`}`;
}
