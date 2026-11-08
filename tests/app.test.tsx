import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";
import {
  CHECKLIST_KEY,
  freshChecklist,
  parseChecklist,
  currentDay,
  taskIds,
} from "../src/checklist";
import { DATA_KEY, freshStore, dayKey } from "../src/model";
it("is one simple page: 20 checkboxes, fixed Make 5, and no tabs, counters, goals or account forms", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Jayce The Champion" }),
  ).toBeVisible();
  expect(screen.getAllByRole("checkbox")).toHaveLength(20);
  expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
  expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  expect(screen.getAllByText(/Make 5$/)).toHaveLength(19);
  expect(screen.getByLabelText("Warm-up done")).toBeVisible();
});
it("retains checked tasks on reload", () => {
  const r = render(<App />);
  fireEvent.click(screen.getByLabelText("2 feet · Make 5"));
  fireEvent.click(screen.getByLabelText("Warm-up done"));
  expect(screen.getByText("2 / 20 checked")).toBeVisible();
  r.unmount();
  render(<App />);
  expect(screen.getByLabelText("2 feet · Make 5")).toBeChecked();
  expect(screen.getByLabelText("Warm-up done")).toBeChecked();
});
it("every layup and pull-up has left/right independent checks", () => {
  render(<App />);
  const checks = screen.getAllByRole("checkbox");
  checks.slice(8).forEach((el) => fireEvent.click(el));
  const saved = parseChecklist(localStorage.getItem(CHECKLIST_KEY)!);
  expect(taskIds.slice(8).every((id) => saved.checks[id])).toBe(true);
  expect(saved.checks.s0).toBe(false);
  expect(screen.getAllByLabelText("Right side · Make 5")).toHaveLength(6);
  expect(screen.getAllByLabelText("Left side · Make 5")).toHaveLength(6);
});
it("supports keyboard checkbox toggling", async () => {
  const u = userEvent.setup();
  render(<App />);
  const c = screen.getByLabelText("2 feet · Make 5");
  c.focus();
  await u.keyboard(" ");
  expect(c).toBeChecked();
  await u.keyboard(" ");
  expect(c).not.toBeChecked();
});
it("clear-today needs confirmation and never touches golf data or old saved counters", () => {
  localStorage.setItem("golf-speed-plan", "keep");
  localStorage.setItem(DATA_KEY, "old-data");
  render(<App />);
  fireEvent.click(screen.getByLabelText("Warm-up done"));
  vi.mocked(window.confirm).mockReturnValueOnce(false);
  fireEvent.click(screen.getByRole("button", { name: "Clear today’s checks" }));
  expect(screen.getByLabelText("Warm-up done")).toBeChecked();
  fireEvent.click(screen.getByRole("button", { name: "Clear today’s checks" }));
  expect(screen.getByLabelText("Warm-up done")).not.toBeChecked();
  expect(localStorage.getItem("golf-speed-plan")).toBe("keep");
  expect(localStorage.getItem(DATA_KEY)).toBe("old-data");
});
it("automatically gives a fresh local-date checklist after midnight", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 10, 8, 23, 59, 58));
  render(<App />);
  fireEvent.click(screen.getByLabelText("Warm-up done"));
  act(() => vi.advanceTimersByTime(10000));
  expect(screen.getByLabelText("Warm-up done")).not.toBeChecked();
  expect(parseChecklist(localStorage.getItem(CHECKLIST_KEY)!).date).toBe(
    "2026-11-09",
  );
});
it("resets past-day checks on reload and focus", () => {
  const data = freshChecklist("2026-01-01");
  data.checks.s0 = true;
  localStorage.setItem(CHECKLIST_KEY, JSON.stringify(data));
  render(<App />);
  expect(screen.getByLabelText("2 feet · Make 5")).not.toBeChecked();
  expect(parseChecklist(localStorage.getItem(CHECKLIST_KEY)!).date).toBe(
    dayKey(),
  );
});
it("preserves corrupt checklist storage rather than silently overwriting", () => {
  localStorage.setItem(CHECKLIST_KEY, "bad");
  render(<App />);
  expect(screen.getByRole("alert")).toHaveTextContent("could not read or save");
  expect(localStorage.getItem(CHECKLIST_KEY)).toBe("bad");
});
it("migrates only today's old counters at or over five and all-done warm-up", () => {
  const old = freshStore();
  old.current.counts.s0 = 5;
  old.current.counts.s1 = 4;
  old.current.counts["layup-0-left"] = 8;
  old.current.warmup.fill(true);
  localStorage.setItem(DATA_KEY, JSON.stringify(old));
  render(<App />);
  expect(screen.getByLabelText("2 feet · Make 5")).toBeChecked();
  expect(screen.getByLabelText("4 feet · Make 5")).not.toBeChecked();
  expect(screen.getByLabelText("Warm-up done")).toBeChecked();
  expect(
    parseChecklist(localStorage.getItem(CHECKLIST_KEY)!).checks["layup-0-left"],
  ).toBe(true);
  expect(JSON.parse(localStorage.getItem(DATA_KEY)!).current.counts.s1).toBe(4);
});
it("keeps demonstrations collapsed and static until explicitly played", () => {
  render(<App />);
  expect(screen.getByAltText(/Side-view shooting diagram/)).not.toBeVisible();
  const summary = screen.getByText("Show shooting demo & tips");
  fireEvent.click(summary);
  expect(screen.getByAltText(/Side-view shooting diagram/)).toBeVisible();
  expect(screen.getByAltText(/Side-view shooting diagram/)).toHaveAttribute(
    "src",
    expect.stringContaining("form-shot.png"),
  );
  expect(
    screen.queryByRole("button", { name: /Pause demo/ }),
  ).not.toBeInTheDocument();
});
it("rejects malformed checklist schema and drops unknown fields", () => {
  expect(() => parseChecklist("{}")).toThrow();
  expect(() => parseChecklist("bad")).toThrow();
  const data = freshChecklist();
  expect(currentDay(data, data.date)).toBe(data);
  expect(
    Object.keys(parseChecklist(JSON.stringify({ ...data, extra: "ignore" }))),
  ).not.toContain("extra");
});
