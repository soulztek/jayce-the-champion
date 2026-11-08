# Jayce The Champion

A simple, standalone basketball practice website/PWA. Light background, rounded cards, quiet green accents inspired by Golf Speed Plan; original basketball/JTC artwork. No golf photos, logos, or private data copied.

## One page, five makes, checkboxes

- Gentle 4½-minute warm-up, with one completion checkbox.
- Form ladder: **5 total makes** (not consecutive) at 2, 4, 6, 8, 10, and 12 feet, then the court’s marked free throw line. One checkbox per spot.
- Crossover, double crossover, and in-and-out into layups: **5 each side**, right-hand/right-side and left-hand/left-side defaults.
- The same three moves into pull-ups: **5 each direction**, with the normal shooting and guide hand.
- **20 checkboxes total.** No counters, tabs, timers, goals form, accounts, or settings maze.
- Comfortable range, rest and water whenever needed. You can stop without completing the checklist.

Checks are saved only on this device/browser. They reset for a new local calendar day (on reload, focus, or a ten-second check). “Clear today’s checks” needs confirmation. No cloud storage, accounts, emails, DOB, locations, analytics, or third-party embeds. Normal website requests still reach the static hosting provider. Clearing site data removes saved checks. Shared-device users can see them.

Storage key: `jayce-champion-checklist-v1`. One-time migration reads the previous local app’s `jayce-champion-v1` only if its session date is today: old counters ≥5 become checked; all five warm-up movements must have been completed. Old storage is left intact. Corrupt checklist storage is left untouched and a warning is shown; confirmed clearing can recover a fresh checklist.

## Original animated demonstrations

**18 GIFs and 18 static posters**: five warm-up movements, one form shot, and six move/ending combinations with separate right/left versions. The diagrams are original programmatic stick-figure/court illustrations, not filmed coaching footage. Every file is 480×360, loops for 4.8 seconds, and includes three phase labels. Identical consecutive frames are coalesced; the source is sampled at 12.5 fps. Labels explain attack side, starting hand, the ball-hand path, and the finish.

Each “Show demo & tips” section is collapsed initially. Images use static PNG posters and lazy loading. Animation starts only after **Play diagram** and **Pause diagram** restores the poster. Nothing autoplays, including when reduced motion is requested. Switching the OS to reduced motion pauses an already playing diagram; explicit play remains available.

Crossover changes hands once; double crossover changes twice and returns to the starting hand; in-and-out fakes inward and returns in the same hand. Layups use opposite-foot lift and approach-side finishing hand. Pull-ups show a balanced two-hand gather and usual shooting form. Short tips emphasize a low stable stance, controlled low bounce, pushing/accelerating into the open lane, no carrying, and comfortable shooting form. Diagrams are simplified, not exact biomechanical instruction or skill-gain guarantees. A coach/adult can help check footwork.

### Rebuild media

```sh
python3 -m pip install Pillow
npm run media
```

The deterministic generator is `scripts/generate-drill-gifs.py`; it uses the bundled content map `src/drillMedia.json` and system DejaVu Sans fonts at `/usr/share/fonts/truetype/dejavu/`. Run with the same Pillow/fonts for byte-identical results. `scripts/media-validation.json` records actual GIF dimensions, encoded/distinct frame counts, loop flags, duration, and byte sizes. On this bot’s box, generation also writes a contact sheet to `/workspace/screens/jayce/drill-gif-contact-sheet.png`.

## Run and check

Node 22.12+ (24 recommended):

```sh
npm ci
npm test
npm run build
npm run preview
```

Preview URL: **http://localhost:4176/jayce-the-champion/**. If a preview is already running there, reuse it; do not kill unrelated processes. `npm run dev -- --port 4176 --strictPort` is another option.

Build runs strict TypeScript, Vite, then generates the scoped service worker. Tests cover the single-page checklist, fixed five-make wording, left/right coverage, keyboard operation, persistence, safe reset/migration/date rollover/corruption, every GIF/poster/tip mapping, play/pause and reduced motion, media metadata, and service-worker cache/path isolation. Retained legacy-model tests protect the older data model used by migration. `npm audit` checks dependency advisories.

## Hosting and offline

The Vite base and manifest scope are `/jayce-the-champion/`. Production files are generated in `dist/`. For GitHub Pages branch hosting, copy the complete dist contents to `docs/`, add `docs/.nojekyll`, and set Pages to the main branch’s `/docs` directory. Rebuild/copy again after changing the app or media. Do not publish node_modules, credentials, or private files.

The build precaches its local HTML, JS, CSS, icons, manifest, all GIFs and posters. Its service worker only handles GET requests within its own origin/path and only deletes caches beginning `jayce-champion-`. No other apps’ storage or caches are reset. After one successful online load and worker activation, the app can load offline. Install through Chrome → Install app/Add to Home screen, or Safari → Share → Add to Home Screen. A phone cannot use another computer’s localhost; it needs a published HTTPS URL.

Manual real-device/browser QA remains necessary: 320/360/390px layout and zoom, all checkboxes reachable, demonstration readability and playback, reduced motion, install icon/standalone mode, offline reload and update. Automated checks and contact sheets are not browser/device QA.
