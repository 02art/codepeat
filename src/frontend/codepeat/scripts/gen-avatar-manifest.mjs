/**
 * Generates `static/PB/manifest.json` from the images present in `static/PB/`.
 *
 * Runs automatically before `build:src` (npm `prebuild:src` hook), so the selectable
 * profile-picture pool always matches whatever files are in the folder — drop images in
 * or remove them, no code change needed.
 */
import {readdirSync, writeFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const pbDir = join(dirname(fileURLToPath(import.meta.url)), "..", "static", "PB");
const IMAGE_RE = /\.(jpe?g|png|webp|gif|avif)$/i;

const files = readdirSync(pbDir)
    .filter((name) => IMAGE_RE.test(name))
    .sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));

writeFileSync(join(pbDir, "manifest.json"), `${JSON.stringify(files, null, 2)}\n`);
console.log(`avatar manifest: ${files.length} image(s)`);
