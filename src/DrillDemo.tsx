import { useEffect, useState } from "react";
import records from "./drillMedia.json";
export type DrillMedia = (typeof records)[number];
export const drillMedia = records;
export function mediaFor(id: string): DrillMedia {
  const media = records.find((x) => x.id === id);
  if (!media) throw Error(`Missing drill demo: ${id}`);
  return media;
}
export default function DrillDemo({ id }: { id: string }) {
  const m = mediaFor(id);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!query) return;
    const change = () => {
      if (query.matches) setPlaying(false);
    };
    query.addEventListener?.("change", change);
    return () => query.removeEventListener?.("change", change);
  }, []);
  return (
    <figure className="demo">
      <figcaption>
        <strong>
          {m.title}
          {m.side ? ` · ${m.side} side` : ""}
        </strong>
        <span>Animated drill diagram · original illustration</span>
      </figcaption>
      <img
        src={`${import.meta.env.BASE_URL}demos/${m.id}.${playing ? "gif" : "png"}`}
        width="480"
        height="360"
        alt={m.alt}
        loading="lazy"
        decoding="async"
      />
      <button
        type="button"
        className="play-demo"
        aria-pressed={playing}
        aria-label={`${playing ? "Pause" : "Play"} demo: ${m.title}${m.side ? ` ${m.side} side` : ""}`}
        onClick={() => setPlaying((v) => !v)}
      >
        {playing ? "Pause diagram" : "Play diagram"}
      </button>
      <ul className="tips">
        {m.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </figure>
  );
}
