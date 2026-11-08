import { useEffect, useState } from "react";
import { dayKey, stations, moves, cue, warmups } from "./model";
import {
  CHECKLIST_KEY,
  currentDay,
  freshChecklist,
  loadChecklist,
  taskIds,
} from "./checklist";
import DrillDemo from "./DrillDemo";
const moveIds = ["crossover", "double-crossover", "in-and-out"];
const warmupIds = ["march", "lateral", "ankle", "squat", "dribble"];
export default function App() {
  const [initial] = useState(loadChecklist);
  const [data, setData] = useState(initial.data);
  const [blocked, setBlocked] = useState(initial.blocked);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (blocked) return;
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(data));
    } catch {
      setBlocked(true);
    }
  }, [data, blocked]);
  useEffect(() => {
    const tick = () => setData((prev) => currentDay(prev));
    const id = window.setInterval(tick, 10000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
    };
  }, []);
  function toggle(id: string) {
    setData((prev) => {
      const today = currentDay(prev);
      return { ...today, checks: { ...today.checks, [id]: !today.checks[id] } };
    });
  }
  function task(id: string, title: string, hint?: string) {
    return (
      <label className={`task ${data.checks[id] ? "checked" : ""}`} key={id}>
        <input
          type="checkbox"
          checked={data.checks[id]}
          onChange={() => toggle(id)}
          aria-label={title}
        />
        <span>
          <strong>{title}</strong>
          {hint && <small>{hint}</small>}
        </span>
      </label>
    );
  }
  const checked = taskIds.filter((id) => data.checks[id]).length;
  return (
    <>
      <header>
        <img
          src={`${import.meta.env.BASE_URL}icons/ball.svg`}
          alt=""
          width="46"
          height="46"
        />
        <div>
          <h1>Jayce The Champion</h1>
          <p>Workout 1: Fundamentals</p>
        </div>
      </header>
      <main>
        <section className="intro">
          <div className="row">
            <span className="date">{data.date}</span>
            <span aria-live="polite" className="progress">
              {checked} / {taskIds.length} checked
            </span>
          </div>
          <h2>Make 5. Check it off.</h2>
          <p>
            Five total makes at each spot and on each side — not in a row. Take
            your time. Stop or stay closer whenever you need.
          </p>
          <p className="small">
            One page. Saved on this device. A fresh checklist each day.
          </p>
        </section>
        {blocked && (
          <div role="alert" className="notice">
            This device could not read or save the checklist. Existing data is
            left untouched. Your checks may not last after closing the app.
          </div>
        )}
        {notice && (
          <p role="status" className="notice">
            {notice}
          </p>
        )}
        <section className="card">
          <div className="section-head">
            <span className="step">1</span>
            <h2>Warm up</h2>
            <span className="tag">4½ min · easy</span>
          </div>
          <p className="muted">
            March or light jog 60 sec, lateral steps 45 sec, ankle rocks 45 sec,
            gentle squats 45 sec, easy dribble 75 sec. Comfortable movement
            only.
          </p>
          {task(
            "warmup",
            "Warm-up done",
            "Move gently. This is not a five-shot drill.",
          )}
          <details className="demos">
            <summary>Show warm-up demos & tips</summary>
            {warmups.map(([title], i) => (
              <details className="warmup-demo" key={title}>
                <summary>{title}</summary>
                <DrillDemo id={`warmup-${warmupIds[i]}`} />
              </details>
            ))}
          </details>
        </section>
        <section className="card">
          <div className="section-head">
            <span className="step">2</span>
            <h2>Form shooting ladder</h2>
          </div>
          <p className="muted">
            Start close and move back only while your form feels comfortable.
          </p>
          <div>
            {stations.map((spot, i) =>
              task(
                `s${i}`,
                `${spot} · Make 5`,
                i === 6
                  ? "Use the court’s marked free throw line."
                  : "From the rim · five total makes.",
              ),
            )}
          </div>
          <details className="demos">
            <summary>Show shooting demo & tips</summary>
            <DrillDemo id="form-shot" />
          </details>
        </section>
        {(["layup", "pullup"] as const).map((type, section) => (
          <section className="training-section" key={type}>
            <div className="section-head group-title">
              <span className="step">{section + 3}</span>
              <h2>
                {type === "layup" ? "Moves → layups" : "Same moves → pull-ups"}
              </h2>
            </div>
            {moves.map((move, i) => (
              <article className="card" key={move}>
                <h3>
                  {move} → {type === "layup" ? "layup" : "pull-up"}
                </h3>
                {(["right", "left"] as const).map((side) =>
                  task(
                    `${type}-${i}-${side}`,
                    `${side === "right" ? "Right" : "Left"} side · Make 5`,
                    type === "layup"
                      ? `Finish ${side} hand · push off ${side === "right" ? "left" : "right"} foot.`
                      : "Stop balanced · use your normal shooting and guide hand.",
                  ),
                )}
                <details className="demos">
                  <summary>Show {move.toLowerCase()} demos & tips</summary>
                  <div className="paired-demos">
                    {(["right", "left"] as const).map((side) => (
                      <div key={side}>
                        <p className="hand-cue">
                          {cue(i, side, type === "pullup")}
                        </p>
                        <DrillDemo id={`${moveIds[i]}-${type}-${side}`} />
                      </div>
                    ))}
                  </div>
                </details>
              </article>
            ))}
          </section>
        ))}
        <section className="closing">
          <p>
            Stay comfortably low, keep eyes up, and push into the open lane with
            the ball controlled. Rest and drink water whenever needed. Stop for
            pain or dizziness; an adult or coach can help with form.
          </p>
          <button
            type="button"
            className="reset"
            onClick={() => {
              if (
                window.confirm(
                  "Clear all of today’s checkboxes? This only resets Jayce The Champion on this device.",
                )
              ) {
                setData(freshChecklist(dayKey()));
                setBlocked(false);
                setNotice(
                  "Today’s checklist is clear. Start whenever you’re ready.",
                );
              }
            }}
          >
            Clear today’s checks
          </button>
          <small>No accounts. No tracking. Progress, not pressure.</small>
        </section>
      </main>
    </>
  );
}
