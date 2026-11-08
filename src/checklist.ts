import { dayKey, DATA_KEY, stations } from "./model";
export const CHECKLIST_KEY = "jayce-champion-checklist-v1";
export const taskIds = [
  "warmup",
  ...stations.map((_, i) => `s${i}`),
  ...["layup", "pullup"].flatMap((type) =>
    [0, 1, 2].flatMap((move) =>
      ["right", "left"].map((side) => `${type}-${move}-${side}`),
    ),
  ),
];
export type Checklist = {
  version: 1;
  date: string;
  checks: Record<string, boolean>;
};
export function freshChecklist(date = dayKey()): Checklist {
  return {
    version: 1,
    date,
    checks: Object.fromEntries(taskIds.map((id) => [id, false])),
  };
}
export function currentDay(data: Checklist, date = dayKey()): Checklist {
  return data.date === date ? data : freshChecklist(date);
}
export function parseChecklist(raw: string): Checklist {
  const v = JSON.parse(raw);
  if (
    !v ||
    v.version !== 1 ||
    typeof v.date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v.date) ||
    !v.checks ||
    taskIds.some((id) => typeof v.checks[id] !== "boolean")
  )
    throw Error("Unreadable checklist");
  return {
    version: 1,
    date: v.date,
    checks: Object.fromEntries(taskIds.map((id) => [id, v.checks[id]])),
  };
}
export function loadChecklist(): { data: Checklist; blocked: boolean } {
  try {
    const raw = localStorage.getItem(CHECKLIST_KEY);
    if (raw) return { data: currentDay(parseChecklist(raw)), blocked: false };
    const data = freshChecklist();
    // One-time migration only: leave old app data intact, and only mark five-make targets met today.
    try {
      const old = JSON.parse(localStorage.getItem(DATA_KEY) || "null");
      if (old?.current?.date === data.date) {
        for (const id of taskIds) {
          data.checks[id] =
            id === "warmup"
              ? old.current.warmup?.length === 5 &&
                old.current.warmup.every((x: unknown) => x === true)
              : typeof old.current.counts?.[id] === "number" &&
                old.current.counts[id] >= 5;
        }
      }
    } catch {
      /* A corrupt old format never blocks a fresh checklist. */
    }
    return { data, blocked: false };
  } catch {
    return { data: freshChecklist(), blocked: true };
  }
}
