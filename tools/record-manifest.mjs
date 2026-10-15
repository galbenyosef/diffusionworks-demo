// record-manifest.mjs — re-cut .upstream/manifest.json for this mirror (Gen-A:
// { generated, origin, files: { rel: { bytes, sha256 } } }), the schema
// tools/verify.mjs and tools/update.mjs read.
//
// Copied + adapted from _standard/templates/record-manifest.mjs (fleet's evolved
// per-mirror record tools). The capture layer is everything the origin served
// (root-served paths: web-demo/, _nuxt/, unity-demo/, images/, …); everything
// derived or local is excluded by construction (the canonical set — the same
// rule tools/audit.js gates on, and the leak class that has recurred fleet-wide):
//   SKIP           readable/ src/ legacy/ docs/ tools/ .upstream/ node_modules/
//                  .git/ .work/ .scratch/
//   NOT_CAPTURED   README.md .gitattributes .gitignore split-spec.json
//                  rename-map.json index-inline-map.json _mirror-report.json
// A capture refresh re-cuts the record with this tool; a routine run must
// reproduce the committed manifest exactly — use --check for that (exits 1 on
// any drift, writes nothing).
//
// usage:
//   node tools/record-manifest.mjs           # write .upstream/manifest.json
//   node tools/record-manifest.mjs --check   # compare with the committed record
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const check = process.argv.includes("--check");

const SKIP = new Set([
  ".git", ".upstream", "node_modules", "readable", "src", "docs", "tools", "legacy", ".work", ".scratch",
]);
const NOT_CAPTURED = new Set([
  ".gitattributes",
  ".gitignore",
  "README.md",
  "split-spec.json",
  "rename-map.json",
  "index-inline-map.json",
  "_mirror-report.json",
]);
const ORIGIN = "https://diffusionworks.com";

const files = {};
let bytes = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(p);
      continue;
    }
    const rel = path.relative(proj, p).split(path.sep).join("/");
    if (NOT_CAPTURED.has(rel) || /\.log$/i.test(rel)) continue;
    const buf = fs.readFileSync(p);
    files[rel] = { sha256: crypto.createHash("sha256").update(buf).digest("hex"), bytes: buf.length };
    bytes += buf.length;
  }
})(proj);

const sorted = Object.fromEntries(Object.entries(files).sort((a, b) => (a[0] < b[0] ? -1 : 1)));
const manifestPath = path.join(proj, ".upstream", "manifest.json");

if (check) {
  const have = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const problems = [];
  if (have.origin !== ORIGIN) problems.push(`origin ${have.origin} != ${ORIGIN}`);
  const keys = Object.keys(have.files ?? {});
  if (keys.length !== Object.keys(sorted).length) problems.push(`${keys.length} recorded vs ${Object.keys(sorted).length} on disk`);
  for (const [rel, want] of Object.entries(sorted)) {
    const rec = have.files?.[rel];
    if (!rec) problems.push(`missing from the record: ${rel}`);
    else if (rec.sha256 !== want.sha256 || rec.bytes !== want.bytes) problems.push(`record differs: ${rel}`);
  }
  for (const rel of keys) if (!sorted[rel]) problems.push(`recorded but not on disk: ${rel}`);
  if (problems.length) {
    console.error(`record-manifest --check: ${problems.length} problem(s)`);
    for (const p of problems.slice(0, 20)) console.error("  " + p);
    process.exit(1);
  }
  console.log(`record-manifest --check: ${keys.length} files match the committed record`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
const manifest = {
  generated: new Date().toISOString(),
  origin: ORIGIN,
  files: sorted,
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(
  `recorded ${Object.keys(sorted).length} files, ${(bytes / 1048576).toFixed(1)} MB ` +
    `(generated ${manifest.generated})`,
);
