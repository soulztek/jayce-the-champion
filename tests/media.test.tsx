import { it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import DrillDemo, {
  drillMedia,
  mediaFor,
  assetFor,
  doubleCrossoverSource,
} from "../src/DrillDemo";
it("maps each warm-up and shooting drill, and all six move endings on BOTH sides", () => {
  expect(drillMedia).toHaveLength(18);
  expect(new Set(drillMedia.map((x) => x.id)).size).toBe(18);
  ["march", "lateral", "ankle", "squat", "dribble"].forEach((id) =>
    expect(mediaFor(`warmup-${id}`).kind).toBe("warmup"),
  );
  expect(mediaFor("form-shot").kind).toBe("form");
  for (const end of ["layup", "pullup"])
    for (const move of ["crossover", "double-crossover", "in-and-out"])
      for (const side of ["right", "left"]) {
        const m = mediaFor(`${move}-${end}-${side}`);
        expect(m.side).toBe(side);
        expect(m.kind).toBe(end);
        expect(m.tips.length).toBeLessThanOrEqual(3);
        expect(m.alt.length).toBeGreaterThan(40);
      }
});
it("uses correct starting hand, double-hand-switch sequence and same-hand fake", () => {
  expect(mediaFor("crossover-layup-right").startHand).toBe("left");
  expect(mediaFor("crossover-layup-left").startHand).toBe("right");
  expect(mediaFor("double-crossover-layup-right").handPath).toBe("R → L → R");
  expect(mediaFor("double-crossover-pullup-left").handPath).toBe("L → R → L");
  expect(mediaFor("in-and-out-layup-left").handPath).toBe("L → inward → L");
});
it("coaching cues cover staying low, low bounce, push/acceleration and balanced shooting", () => {
  const cross = mediaFor("crossover-layup-right").tips.join(" ");
  expect(cross).toMatch(/low, stable/);
  expect(cross).toMatch(/below the knees/);
  expect(cross).toMatch(/plant and push/);
  expect(mediaFor("in-and-out-layup-left").tips.join(" ")).toMatch(
    /no carrying/,
  );
  expect(mediaFor("double-crossover-pullup-left").tips.join(" ")).toMatch(
    /stop balanced/,
  );
  expect(mediaFor("crossover-layup-right").tips.join(" ")).toMatch(
    /right hand off the left foot/,
  );
});
it("starts with a lazy static poster, plays real GIF, and pauses back to poster", () => {
  render(<DrillDemo id="crossover-layup-right" />);
  const image = screen.getByRole("img");
  expect(image).toHaveAttribute("loading", "lazy");
  expect(image).toHaveAttribute(
    "src",
    expect.stringContaining("crossover-real.png"),
  );
  fireEvent.click(
    screen.getByRole("button", {
      name: "Play demo: Crossover → layup right side",
    }),
  );
  expect(image).toHaveAttribute(
    "src",
    expect.stringContaining("crossover-real.gif"),
  );
  expect(screen.getByRole("button", { name: /Pause demo/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: /Pause demo/ }));
  expect(image).toHaveAttribute("src", expect.stringContaining(".png"));
});
it("never autoplays for reduced motion and pauses if preference changes", () => {
  let listener: () => void = () => {};
  const query = {
    matches: true,
    addEventListener: vi.fn((_event, fn) => (listener = fn)),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => query),
  );
  render(<DrillDemo id="form-shot" />);
  expect(screen.getByRole("img")).toHaveAttribute(
    "src",
    expect.stringContaining(".png"),
  );
  fireEvent.click(screen.getByRole("button", { name: /Play demo/ }));
  expect(screen.getByRole("img")).toHaveAttribute(
    "src",
    expect.stringContaining(".gif"),
  );
  fireEvent(window, new Event("unused"));
  query.matches = true;
  act(() => listener());
  expect(screen.getByRole("img")).toHaveAttribute(
    "src",
    expect.stringContaining(".png"),
  );
  vi.unstubAllGlobals();
});
it("rejects unmapped drills rather than silently displaying a generic diagram", () => {
  expect(() => mediaFor("unknown")).toThrow(/Missing drill/);
});

it("uses the one approved real right-to-left crossover clip across crossover cards without claiming finishes", () => {
  for (const end of ["layup", "pullup"])
    for (const side of ["left", "right"]) {
      const a = assetFor(`crossover-${end}-${side}`);
      expect(a.id).toBe("crossover-real");
      expect(a.real).toBe(true);
      expect(a.height).toBe(270);
    }
  expect(assetFor("double-crossover-layup-right").real).toBe(false);
  expect(assetFor("in-and-out-pullup-left").real).toBe(false);
  render(<DrillDemo id="crossover-pullup-left" />);
  expect(screen.getByText("Crossover move demonstration")).toBeVisible();
  expect(
    screen.getByText(/Crossover move only \(right to left\)/),
  ).toBeVisible();
  expect(screen.getByRole("img")).toHaveAttribute("height", "270");
  expect(screen.getByRole("img")).toHaveAttribute(
    "alt",
    expect.stringContaining("No layup or pull-up finish"),
  );
  expect(
    screen.getByRole("link", { name: "BallerBootCamp.com" }),
  ).toHaveAttribute("rel", "noopener noreferrer");
});
it("links the user's actual double-crossover reel without an embedded player or fake video URL", () => {
  render(<DrillDemo id="double-crossover-layup-left" />);
  const a = screen.getByRole("link", {
    name: "Watch double-crossover example ↗",
  });
  expect(a).toHaveAttribute(
    "href",
    "https://www.instagram.com/reel/DXDm3MgDchR/",
  );
  expect(a).toHaveAttribute("rel", "noopener noreferrer");
  expect(a).toHaveAttribute("referrerpolicy", "no-referrer");
  expect(doubleCrossoverSource.title).toContain("Double Cross");
  expect(screen.getByText(/Opens Instagram/)).toBeVisible();
  expect(document.querySelector("iframe")).toBeNull();
  expect(screen.getByRole("img").getAttribute("src")).not.toContain(
    "instagram",
  );
});
