import { useEffect, useState } from "react";
import records from "./drillMedia.json";
export type DrillMedia = (typeof records)[number];
export const drillMedia = records;
export function mediaFor(id: string): DrillMedia {
  const media = records.find((x) => x.id === id);
  if (!media) throw Error(`Missing drill demo: ${id}`);
  return media;
}
export const moveSources: Record<
  string,
  { url: string; title: string; label: string }
> = {
  crossover: {
    url: "https://www.instagram.com/reel/DfXl-WPxtbo/",
    title: "Crossover example",
    label: "Watch crossover video",
  },
  "double-crossover": {
    url: "https://www.instagram.com/reel/DXDm3MgDchR/",
    title: "How to Master the Double Cross 🎒😎",
    label: "Watch double-crossover example ↗",
  },
  "in-and-out": {
    url: "https://www.instagram.com/reel/DffZtFzRdxu/",
    title: "In-and-out example",
    label: "Watch in-and-out video",
  },
};
export const doubleCrossoverSource = moveSources["double-crossover"];
export function assetFor(id: string) {
  const media = mediaFor(id);
  if (media.motion === "crossover")
    return {
      id: "crossover-real",
      width: 480,
      height: 270,
      real: true,
      alt: "Real person making a right-to-left crossover and driving away. No layup or pull-up finish is shown. Original BallerBootCamp.com and makeagif.com marks remain visible.",
    };
  return { id: media.id, width: 480, height: 360, real: false, alt: media.alt };
}
export default function DrillDemo({ id }: { id: string }) {
  const m = mediaFor(id);
  const asset = assetFor(id);
  const source = moveSources[m.motion];
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
          {asset.real ? "Crossover move demonstration" : m.title}
          {!asset.real && m.side ? ` · ${m.side} side` : ""}
        </strong>
        <span>
          {asset.real
            ? "Real-person clip · original framing and marks retained"
            : "Animated drill diagram · original illustration"}
        </span>
        {asset.real && (
          <p className="clip-scope">
            Crossover move only (right to left); practice the layup/pull-up
            separately. Practice both directions.
          </p>
        )}
      </figcaption>
      <img
        src={`${import.meta.env.BASE_URL}demos/${asset.id}.${playing ? "gif" : "png"}`}
        width={asset.width}
        height={asset.height}
        style={{ aspectRatio: `${asset.width} / ${asset.height}` }}
        alt={asset.alt}
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
        {playing
          ? asset.real
            ? "Pause clip"
            : "Pause diagram"
          : asset.real
            ? "Play clip"
            : "Play diagram"}
      </button>
      {asset.real && (
        <p className="source-credit">
          Source shown in your clip:{" "}
          <a
            href="https://www.ballerbootcamp.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            BallerBootCamp.com
          </a>{" "}
          · makeagif.com. No mirroring or watermark removal.
        </p>
      )}
      <ul className="tips">
        {m.tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
      {source && (
        <div className="external-example">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {source.label}
          </a>
          <small>
            Your linked example: “{source.title}”. Opens Instagram; needs
            internet and may require login. External example, not an inline
            video or a verified layup/pull-up finish.
          </small>
        </div>
      )}
    </figure>
  );
}
