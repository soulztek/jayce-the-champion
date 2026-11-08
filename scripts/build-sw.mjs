import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else if (entry.name !== "sw.js") out.push(path);
  }
  return out;
}
const files = await walk("dist");
const hash = createHash("sha256");
for (const f of files) hash.update(await readFile(f));
const version = hash.digest("hex").slice(0, 12);
const assets = files.map((f) => f.replace("dist/", ""));
const source = await readFile("scripts/sw-template.js", "utf8");
await writeFile(
  "dist/sw.js",
  source
    .replace("__VERSION__", version)
    .replace("__ASSETS__", JSON.stringify(assets)),
);
console.log(`Offline shell: ${assets.length} local files · ${version}`);
