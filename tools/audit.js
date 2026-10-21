// audit.js — integrity gate (PLAN §5), tailored to diffusionworks-demo's shape.
//
// Ultimate Water 2D Web Demo (https://diffusionworks.com/web-demo) is
// capture-class: one route page of a closed product site wrapping a Unity
// WebGL build at /unity-demo/. The mirror captures the DEMO's closure only —
// the Nuxt shell bits needed to boot the demo page plus the Unity build.
//
// Derived pipeline this gate keeps honest:
//
//   capture *.js  (six Nuxt boot chunks + the Unity loader)
//        -> readable/<served path>.pretty.js   (pinned prettier 3.9.6, single pass;
//                                               served dirs mirrored, no __ flattening)
//   capture *.css (entry CSS + Unity template stylesheet)
//        -> readable/<served path>.pretty.css  (stylesheet rule)
//   unity-demo/Build/webBuild.framework.js.unityweb
//        -> readable/unity-demo/Build/…framework.js.pretty.js (gunzip IN MEMORY + prettier; vendor rule)
//   demo glue (the Unity loader body, /web-demo route component)
//        -> src/<served path>-NN.js            (statement-aligned slices; the loader's
//                                               slices descend into the single
//                                               createUnityInstance function body —
//                                               recorded as slicingContext)
//   site-shell machinery chunks -> split-spec wholeFile sections (never sliced)
//   payloads/binary assets      -> split-spec notRendered (bytes + sha256)
//   entry documents             -> inline-script scan (twins + index-inline-map.json;
//                                  typed data blocks recorded as notRendered)
//
// Checks:
//   1. split-spec.json parses, carries a note + renderOptions, and a defaultFile exists.
//   2. Every section resolves: ranged slices have a src/*.js file on disk, a readable
//      *.pretty.js|css sourceFile and in-bounds startLine/endLine; wholeFile sections
//      must NOT have a src file; `skipped` sections must NOT have a src file and are
//      re-verified textually against their recorded firstLine/lastLine.
//   3. The ranges of each sourceFile tile it exactly: first starts at line 1, each next
//      starts at previous end + 1, last ends at EOF — no gaps, no overlaps.
//   4. Byte-exact round-trip through the rename layer: every src slice minus its exact
//      2-line header (`// <tag> NN — <marker>` + `// Lines A-B of <pretty> (statement-aligned).`)
//      equals its recorded sourceFile range with the recorded rename map applied
//      (tools/engine/rename-layer.mjs applyRecordedMap). A slice that differs from its
//      readable range while rename-map.json records no map for it is an unrecorded
//      rename — a problem.
//   5. Every slice parses standalone with the exact gate command
//      `node --input-type=module --check -` (stdin), as does every readable *.pretty.js.
//   6. src/*.js on disk and the spec's ranged slices are the same set — no unlisted or
//      missing reversals; wholeFile/skipped names are not on disk.
//   7. Every readable pretty is referenced by the spec, its capture source exists, is
//      recorded in .upstream/manifest.json, and is NOT byte-identical to the pretty
//      (prettier did run). Every captured .js/.css file has a readable twin (layer
//      completeness) and the Unity framework's pretty exists. When the pinned prettier
//      3.9.6 is importable, each pretty is re-rendered under the recorded options and
//      byte-compared (the framework is gunzipped in memory first; best-effort: missing
//      prettier is a note, a mismatch is a problem).
//   8. The hard rule — src/ import resolution: relative specifiers (static from-imports,
//      side-effect imports, re-exports, dynamic import() incl. non-interpolated template
//      literals) resolve to files the CAPTURE carries, since src/ keeps the served chunk
//      names verbatim. Every named import must be exported by its target capture chunk.
//      `node:`/`vite/*` and root-served `/…` paths are whitelisted machinery; `#name`
//      specifiers are import-map aliases and must resolve to a captured file through
//      the importmap block of the captured HTML; other bare/URL specifiers are flagged.
//   9. Site-shell machinery rule: every wholeFile machinery section carries a content
//      guard; the Unity framework wholeFile section carries its gunzip-in-memory guard.
//  10. Payload rule: every notRendered record's file exists in the manifest and its
//      bytes/sha256 match; every *.unityweb record is a UnityWeb gzip stream (framing
//      comment present) stored exactly as served; inline-data records' byte ranges +
//      sha256 match the captured HTML.
//  11. Inline-block scan: every inline <script>/<style> content block in a captured HTML
//      document must have its readable twin + a readable/index-inline-map.json entry
//      whose byte range + sha256 match the capture bytes — except typed data blocks,
//      which must be recorded as notRendered (range + sha256) instead.
//  12. Derived layers never enter the capture sums: no readable/, src/, legacy/,
//      split-spec.json, rename-map.json, index-inline-map.json or _mirror-report.json
//      path may appear in .upstream/manifest.json.
//  13. Rename-map honesty (the PLAN §5 campaign gate): rename-map.json parses; every
//      recorded file is a ranged slice on disk; every scoped index addresses the
//      recorded identifier token in that slice's readable range and is never an
//      import/export specifier (foreign) position; every map target is a valid
//      identifier and not the name itself; split-spec.json carries a `rename` block
//      naming rename-map.json.
//
// usage: node tools/audit.js
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import { applyRecordedMap, foreignNameIndices, tokens } from "./engine/rename-layer.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const srcDir = path.join(proj, "src");
const readableDir = path.join(proj, "readable");
const PINNED = "3.9.6";
const ROOT = ""; // capture files sit at the repo root
const FRAMEWORK_CAPTURE = "unity-demo/Build/webBuild.framework.js.unityweb";
const FRAMEWORK_PRETTY = "readable/unity-demo/Build/webBuild.framework.js.pretty.js";

const problems = [];
const problem = (msg) => problems.push(msg);

// ── helpers ─────────────────────────────────────────────────────────────
const readLines = (abs) => {
  const t = fs.readFileSync(abs, "utf8");
  const l = t.split("\n");
  if (l.length && l[l.length - 1] === "") l.pop();
  return l;
};
const linesCache = new Map();
const getLines = (abs) => {
  if (!linesCache.has(abs)) linesCache.set(abs, readLines(abs));
  return linesCache.get(abs);
};
const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

// capture-relative name -> readable twin name (served path mirrored: the capture
// preserves the served URL structure, so the derived layers keep the served
// subdirectories and filenames — no __ flattening)
const prettyNameOf = (capRel) => {
  const rel = capRel.startsWith(ROOT) ? capRel.slice(ROOT.length) : capRel;
  const stem = rel.replace(/\.(js|css)$/i, "");
  return "readable/" + stem + (/\.css$/i.test(rel) ? ".pretty.css" : ".pretty.js");
};
const captureByPretty = new Map(); // readable/<x>.pretty.js|css -> capture rel

// parse check — the exact standalone gate: node --input-type=module --check - < file
function parseCheck(abs, rel) {
  const r = spawnSync(process.execPath, ["--input-type=module", "--check", "-"], {
    input: fs.readFileSync(abs),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0)
    problem(`standalone ESM parse failed: ${rel} — ${(r.stderr || "").trim().split("\n").slice(-2).join(" | ")}`);
  return r.status === 0;
}

// inline <script>/<style> scan (byte-exact, same shape as tools/derive.mjs)
function scanBlocks(buf) {
  const blocks = [];
  for (const [open, close, kind] of [
    ["<script", "</script", "script"],
    ["<style", "</style", "style"],
  ]) {
    let p = 0;
    let n = 0;
    while (true) {
      const i = buf.indexOf(open, p);
      if (i < 0) break;
      const after = buf[i + open.length];
      const boundary =
        after === 0x3e || after === 0x2f || after === 0x20 || after === 0x09 || after === 0x0a || after === 0x0d;
      if (!boundary) {
        p = i + open.length;
        continue;
      }
      const tagEnd = buf.indexOf(">", i);
      if (tagEnd < 0) break;
      const j = buf.indexOf(close, tagEnd + 1);
      if (j < 0) {
        problem(`unterminated <${kind}> opened at byte ${i}`);
        break;
      }
      const tag = buf.subarray(i, tagEnd + 1).toString("utf8");
      const external = /\bsrc\s*=\s*["']/i.test(tag);
      if (!external) {
        n++;
        const content = buf.subarray(tagEnd + 1, j);
        blocks.push({
          kind: /\btype\s*=\s*["']importmap["']/i.test(tag) ? "importmap" : kind,
          tag,
          block: n,
          contentStart: tagEnd + 1,
          contentEnd: j,
          bytes: content.length,
          sha256: sha256(content),
        });
      }
      p = j + close.length;
    }
  }
  return blocks.sort((a, b) => a.contentStart - b.contentStart);
}
const typeOfBlock = (b) => (/\btype\s*=\s*["']?([^"'\s>]+)/i.exec(b.tag)?.[1] ?? "").toLowerCase();
const DATA_TYPES = new Set(["application/ld+json", "application/json", "importmap", "speculationrules"]);
const isDataBlock = (b) => b.kind === "script" && DATA_TYPES.has(typeOfBlock(b));

// ── specifier extraction + export tables (the hard rule, dead-world's shape) ─
function extractSpecifiers(code) {
  const out = [];
  const push = (spec, kind, clause) => out.push({ spec, kind, clause: clause || "" });
  let m;
  const fromRe = /\bimport\s+([^;('"]*?)\s*from\s*(["'])([^"']+)\2/g;
  while ((m = fromRe.exec(code))) push(m[3], "from", m[1]);
  const sideRe = /\bimport\s*(["'])([^"']+)\1/g;
  while ((m = sideRe.exec(code))) push(m[2], "side-effect", "");
  const reExpRe = /\bexport\s+[^;()]*?\bfrom\s*(["'])([^"']+)\1/g;
  while ((m = reExpRe.exec(code))) push(m[2], "re-export", "");
  const dynRe = /\bimport\s*\(\s*(["'])([^"']+)\1\s*\)/g;
  while ((m = dynRe.exec(code))) push(m[2], "dynamic", "");
  const dynTplRe = /\bimport\s*\(\s*`([^`]*)`\s*\)/g;
  while ((m = dynTplRe.exec(code))) if (!m[1].includes("${")) push(m[1], "dynamic", "");
  const urlRe = /\bnew\s+URL\s*\(\s*(["'`])([^"'`]+)\1\s*,/g;
  while ((m = urlRe.exec(code))) push(m[2], "worker-url", "");
  // a bare require( call is CommonJS machinery; `this.require(…)` / `x.require(…)`
  // are ordinary method calls (the Unity loader's own inflate module registry)
  if (/(^|[^\w$.])require\s*\(/.test(code)) push("<require()>", "require", "");
  return out;
}
function namedImports(clause) {
  const names = [];
  const brace = /\{([^}]*)\}/s.exec(clause);
  if (brace) {
    for (let part of brace[1].split(",")) {
      part = part.trim();
      if (!part) continue;
      const as = /\s+as\s+([\w$]+)\s*$/.exec(part);
      names.push(as ? part.slice(0, as.index).trim() : part); // imported name precedes `as`
    }
  } else {
    const head = clause.split(",")[0].trim();
    if (head && !head.startsWith("*")) names.push(head); // default import
  }
  return names.filter(Boolean);
}
function exportsOf(code) {
  const names = new Set();
  for (const m of code.matchAll(/\bexport\s*\{([^}]*)\}/g)) {
    for (let part of m[1].split(",")) {
      part = part.trim();
      if (!part) continue;
      const as = /\s+as\s+([\w$]+)\s*$/.exec(part);
      names.add(as ? as[1] : part); // in an EXPORT clause the public name follows `as`
    }
  }
  for (const m of code.matchAll(/\bexport\s+(?:async\s+)?(?:function|class)\s+([\w$]+)/g)) names.add(m[1]);
  for (const m of code.matchAll(/\bexport\s+(?:const|let|var)\s+([\w$]+)/g)) names.add(m[1]);
  if (/\bexport\s+default\b/.test(code)) names.add("default");
  if (/\bexport\s+\*\s+from\b/.test(code)) names.add("*");
  return names;
}

// The PRISTINE a whole-file READING-COPY section names: the capture the
// reading copy was rendered from. The frozen public-export gate reads it in
// `capture`/`source`/`origin`/`from`, or in `wholeFile` when that field is a
// path. A `title`/`note`/`desc` in PROSE is NOT accepted: the gate's prose
// fallback is a last resort, and a provenance record a gate may only find by
// reading a sentence is not a provenance record.
const readingCopyCapture = (s) => {
  if (!s || s.wholeFile !== true) return null;
  if (typeof s.wholeFile === "string" && s.wholeFile) return s.wholeFile;
  for (const f of ["capture", "source", "origin", "from"]) {
    if (typeof s[f] === "string" && s[f]) return s[f];
  }
  return null;
};

// ── capture manifest ────────────────────────────────────────────────────
let manifest = null;
try {
  manifest = JSON.parse(fs.readFileSync(path.join(proj, ".upstream", "manifest.json"), "utf8"));
} catch (e) {
  problem(`.upstream/manifest.json does not parse: ${e.message}`);
}
const captured = manifest?.files ? Object.keys(manifest.files).sort() : [];
for (const rel of captured) {
  if (/\.(js|css)$/i.test(rel)) captureByPretty.set(prettyNameOf(rel), rel);
}
// the Unity framework pretty derives from a .unityweb capture (gunzip in memory)
if (manifest?.files?.[FRAMEWORK_CAPTURE]) captureByPretty.set(FRAMEWORK_PRETTY, FRAMEWORK_CAPTURE);

// inline twins derive from <script>/<style> blocks inside captured HTML — their
// provenance lives in readable/index-inline-map.json, not in captureByPretty
const inlineMapPath = path.join(readableDir, "index-inline-map.json");
let inlineMap = null;
if (fs.existsSync(inlineMapPath)) {
  try {
    inlineMap = JSON.parse(fs.readFileSync(inlineMapPath, "utf8"));
  } catch (e) {
    problem(`readable/index-inline-map.json does not parse: ${e.message}`);
  }
}
const inlineTwinByPretty = new Map();
for (const rec of inlineMap?.blocks ?? []) if (rec?.file) inlineTwinByPretty.set(rec.file, rec);
function inlineBlockText(rec) {
  const buf = fs.readFileSync(path.join(proj, rec.source));
  return buf.subarray(rec.byteStart, rec.byteEnd).toString("utf8");
}

// ── import-map aliases from the captured HTML (for `#name` specifiers) ──
const importMapAliases = new Map();
for (const rel of captured) {
  if (!/\.html$/i.test(rel)) continue;
  const buf = fs.readFileSync(path.join(proj, rel));
  for (const b of scanBlocks(buf)) {
    if (b.kind !== "importmap") continue;
    try {
      const im = JSON.parse(buf.subarray(b.contentStart, b.contentEnd).toString("utf8"));
      for (const [k, v] of Object.entries(im.imports ?? {}))
        importMapAliases.set(k, String(v).replace(/^\//, ""));
    } catch (e) {
      problem(`${rel}: importmap block #${b.block} does not parse: ${e.message}`);
    }
  }
}

// ── split-spec.json ─────────────────────────────────────────────────────
const specPath = path.join(proj, "split-spec.json");
if (!fs.existsSync(specPath)) problem("split-spec.json missing at repo root");
let spec = null;
try {
  spec = specPath && JSON.parse(fs.readFileSync(specPath, "utf8"));
} catch (e) {
  problem(`split-spec.json does not parse: ${e.message}`);
}
const sections = Array.isArray(spec?.sections) ? spec.sections : [];
if (spec && !Array.isArray(spec?.sections)) problem("split-spec.json has no sections array");
if (!String(spec?.note ?? "").trim()) problem("split-spec.json has no note (derivation record)");
if (!spec?.renderOptions || typeof spec.renderOptions !== "object")
  problem("split-spec.json records no renderOptions (prettier options for re-derivation)");
if (!Array.isArray(spec?.notRendered))
  problem("split-spec.json records no notRendered array (payload/binary records)");
if (spec?.defaultFile) {
  const df = path.join(proj, String(spec.defaultFile));
  if (!fs.existsSync(df)) problem(`split-spec defaultFile "${spec.defaultFile}" does not exist`);
}
if (spec?.slicingContext) {
  const need = ["-wrapper-head.js", "-tail-return.js"];
  for (const suffix of need)
    if (!sections.some((s) => s.skipped === true && String(s.file).endsWith(suffix)))
      problem(`slicingContext recorded but no skipped section ends in ${suffix}`);
}
if (!spec?.rename || typeof spec.rename !== "object") problem("split-spec.json records no rename block");
else if (spec.rename.map !== "rename-map.json") problem(`split-spec rename.map is "${spec.rename.map}", expected "rename-map.json"`);

// ── rename-map.json (the PLAN §5 campaign record this gate re-proves) ────
const renameMapPath = path.join(proj, "rename-map.json");
let renameMap = { files: {}, scoped: {} };
const renameSlices = new Set();
let flatRecorded = 0,
  scopedRecorded = 0;
if (fs.existsSync(renameMapPath)) {
  try {
    const rm = JSON.parse(fs.readFileSync(renameMapPath, "utf8"));
    renameMap = { files: rm.files || {}, scoped: rm.scoped || {}, note: rm.note || "" };
    if (!String(renameMap.note).trim()) problem("rename-map.json has no note (recovery record)");
    for (const [f, map] of Object.entries(renameMap.files)) {
      renameSlices.add(f);
      for (const [name, target] of Object.entries(map)) {
        flatRecorded++;
        if (target === name) problem(`rename-map.json ${f}: "${name}" maps to itself`);
        if (!/^[A-Za-z_$][\w$]*$/.test(target)) problem(`rename-map.json ${f}: "${name}" → "${target}" is not an identifier`);
      }
    }
    for (const [f, map] of Object.entries(renameMap.scoped)) {
      renameSlices.add(f);
      for (const [name, hits] of Object.entries(map))
        for (const [i, target] of hits) {
          scopedRecorded++;
          if (target === name) problem(`rename-map.json ${f}: "${name}" maps to itself at ${i}`);
          if (!/^[A-Za-z_$][\w$]*$/.test(target)) problem(`rename-map.json ${f}: "${name}" → "${target}" is not an identifier`);
        }
    }
  } catch (e) {
    problem(`rename-map.json does not parse: ${e.message}`);
  }
}
const recordFor = (file) => {
  const files = renameMap.files[file];
  const scoped = renameMap.scoped[file];
  return files || scoped ? { files, scoped } : null;
};

const seen = new Set();
const rangedFiles = new Set();
const indexOnlyFiles = new Set();
const readingCopySections = [];
for (const s of sections) {
  if (!s.file) {
    problem("split-spec section without a file");
    continue;
  }
  if (seen.has(s.file)) problem(`split-spec lists ${s.file} twice`);
  seen.add(s.file);
  const isWhole = s.wholeFile === true;
  const isSkipped = s.skipped === true;
  if (isWhole && isSkipped) problem(`section ${s.file}: both wholeFile and skipped`);
  if (typeof s.startLine !== "number" || typeof s.endLine !== "number")
    problem(`section ${s.file}: no startLine/endLine range recorded`);
  if (typeof s.sourceFile !== "string") {
    // A whole-file section in the READING-COPY shape: its `file` IS the
    // derived text (a readable pretty) and it names the PRISTINE it was
    // rendered from. There is no src slice to cut out of it, so it records no
    // `sourceFile` — this is the shape the frozen public-export gate reads.
    // It is accepted only when the shape is SOUND (verified below); a section
    // that is neither shape is rejected exactly as before.
    const cap = readingCopyCapture(s);
    if (!cap) problem(`section ${s.file}: no sourceFile provenance recorded`);
    else readingCopySections.push({ s, capture: cap });
  }
  if (isWhole || isSkipped) indexOnlyFiles.add(s.file);
  else rangedFiles.add(s.file);
}
if (!rangedFiles.size) problem("no ranged src slices in split-spec.json (no reversed layer)");

// The frozen public-export gate reaches a whole-file section in either of two
// ways:
//
//   { "file": "readable/foo.pretty.js", "wholeFile": "capture/foo.js" }
//   { "file": "readable/foo.pretty.js", "wholeFile": true, "origin": "capture/foo.js" }
//
// The PRISTINE is the capture; the DERIVED text is the reading copy. The two
// resolve to different files, so the comparison the gate makes between them is
// real — not a self-compare.
//
// Such a section records no `sourceFile`: the reading copy IS the derived
// text, and there is no slice to cut out of it. The rule above (every section
// names the pretty it was cut from) was written for a spec whose whole-file
// sections meant "the capture, indexed whole" — a different thing, and both
// are legitimate. This carve-out accepts the reading-copy shape only when the
// shape is SOUND, so nothing is let through that the old rule would have
// caught:
//
//   - the reading copy exists on disk, and it is the pretty of THAT capture
//     under the mirror's own served-path naming rule;
//   - the capture exists on disk, and it is a captured file: .upstream/
//     manifest.json records it, byte for byte;
//   - the two are DIFFERENT files — different paths, and not byte-identical
//     (a copy of the capture would make the comparison a self-compare, which
//     can only ever pass and proves nothing about the layer);
//   - both carry an export table, and the two tables are the SAME public
//     surface: no public export name of the capture is missing from the
//     reading copy, and the reading copy exports no name the capture does
//     not.
let readingCopyOK = 0;
for (const { s, capture } of readingCopySections) {
  const label = `section ${s.file}`;
  const copyRel = String(s.file);
  const copyAbs = path.join(proj, copyRel);
  if (!fs.existsSync(copyAbs) || !fs.statSync(copyAbs).isFile()) {
    problem(`${label}: the reading copy is missing on disk: ${copyRel}`);
    continue;
  }
  // the recorded range must fit the reading copy it describes
  const copyLines = getLines(copyAbs).length;
  if (
    !Number.isInteger(s.startLine) ||
    !Number.isInteger(s.endLine) ||
    s.startLine < 1 ||
    s.endLine < s.startLine ||
    s.endLine > copyLines
  ) {
    problem(`${label}: bad range ${s.startLine}-${s.endLine} vs ${copyRel} (${copyLines} lines)`);
    continue;
  }
  const capRel = String(capture);
  const capAbs = path.join(proj, capRel);
  if (!fs.existsSync(capAbs) || !fs.statSync(capAbs).isFile()) {
    problem(`${label}: the capture is missing on disk: ${capRel}`);
    continue;
  }
  if (!manifest?.files?.[capRel]) {
    problem(`${label}: the capture ${capRel} is not a captured file (.upstream/manifest.json)`);
    continue;
  }
  const capBuf = fs.readFileSync(capAbs);
  if (sha256(capBuf) !== manifest.files[capRel].sha256) {
    problem(`${label}: the capture ${capRel} does not match .upstream/manifest.json`);
    continue;
  }
  // the mirror's own naming rule ties the reading copy to THAT capture
  const want = prettyNameOf(capRel);
  if (want !== copyRel) {
    problem(`${label}: naming rule maps ${capRel} to ${want}`);
    continue;
  }
  // the two must be DIFFERENT files
  if (path.resolve(capAbs) === path.resolve(copyAbs) || capBuf.equals(fs.readFileSync(copyAbs))) {
    problem(`${label}: the reading copy IS its capture (${capRel}) — a self-compare proves nothing`);
    continue;
  }
  // the export tables must be comparable
  const capNames = exportsOf(capBuf.toString("utf8"));
  const copyNames = exportsOf(fs.readFileSync(copyAbs, "utf8"));
  if (!capNames.size) {
    problem(`${label}: the capture ${capRel} carries no export table — there is nothing to compare`);
    continue;
  }
  if (!copyNames.size) {
    problem(`${label}: the reading copy ${copyRel} carries no export table`);
    continue;
  }
  const lost = [...capNames].filter((n) => !copyNames.has(n));
  if (lost.length) {
    problem(`${label}: a public export name of ${capRel} is missing from the reading copy: ${lost.join(", ")}`);
    continue;
  }
  const gained = [...copyNames].filter((n) => !capNames.has(n));
  if (gained.length) {
    problem(`${label}: the reading copy exports a name ${capRel} does not: ${gained.join(", ")}`);
    continue;
  }
  readingCopyOK++;
}

// src/ mirrors the served tree, so the walk is recursive; names are repo-relative
const walkJs = (dir) => {
  const out = [];
  const rec = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) rec(p);
      else if (e.name.endsWith(".js")) out.push(path.relative(srcDir, p).split(path.sep).join("/"));
    }
  };
  rec(dir);
  return out.sort();
};
const onDisk = walkJs(srcDir);
if (!onDisk.length) problem("src/ missing or empty (no reversed layer)");
for (const f of onDisk) if (!rangedFiles.has(f)) problem(`src/${f} exists but is not a ranged slice in split-spec.json`);
for (const f of rangedFiles) if (!onDisk.includes(f)) problem(`split-spec lists ${f} but it is not on disk`);
for (const f of indexOnlyFiles)
  if (onDisk.includes(f)) problem(`index-only section ${f} must not have a src file on disk (wholeFile/skipped)`);
// every rename-map.json record must be a ranged slice, on disk
for (const f of renameSlices) {
  if (!rangedFiles.has(f)) problem(`rename-map.json records ${f} but it is not a ranged slice in split-spec.json`);
  else if (!onDisk.includes(f)) problem(`rename-map.json records ${f} but it is not on disk`);
}

// ── ranges: existence, bounds, tiling ───────────────────────────────────
const bySource = new Map();
for (const s of sections) {
  if (!s.file || typeof s.sourceFile !== "string") continue;
  const src = path.join(proj, s.sourceFile);
  if (!fs.existsSync(src)) {
    problem(`section ${s.file}: sourceFile missing: ${s.sourceFile}`);
    continue;
  }
  if (!/\.pretty\.(js|css|json)$/i.test(s.sourceFile)) {
    problem(`section ${s.file}: sourceFile is not a readable pretty: ${s.sourceFile}`);
    continue;
  }
  const srcLines = getLines(src);
  const A = s.startLine,
    B = s.endLine;
  if (!Number.isInteger(A) || !Number.isInteger(B) || A < 1 || B < A || B > srcLines.length) {
    problem(`section ${s.file}: bad range ${A}-${B} vs ${s.sourceFile} (${srcLines.length} lines)`);
    continue;
  }
  if (!bySource.has(s.sourceFile)) bySource.set(s.sourceFile, []);
  bySource.get(s.sourceFile).push({ s, A, B });
}
let tiledOK = 0;
for (const [sourceFile, list] of bySource) {
  let ok = true;
  list.sort((x, y) => x.A - y.A);
  const srcLines = getLines(path.join(proj, sourceFile));
  if (list[0].A !== 1) {
    problem(`${sourceFile}: first section starts at line ${list[0].A}, not 1`);
    ok = false;
  }
  for (let k = 1; k < list.length; k++) {
    if (list[k].A !== list[k - 1].B + 1) {
      problem(
        `${sourceFile}: ranges not contiguous at ${list[k].s.file} (starts ${list[k].A}, previous ends ${list[k - 1].B})`,
      );
      ok = false;
    }
  }
  if (list[list.length - 1].B !== srcLines.length) {
    problem(`${sourceFile}: last section ends at ${list[list.length - 1].B}, not ${srcLines.length}`);
    ok = false;
  }
  if (ok) tiledOK++;
}

// ── byte-exact round-trip through the rename layer + header provenance ──
let roundOK = 0,
  ranged = 0,
  renamedSlices = 0;
for (const [, list] of bySource) {
  for (const { s, A, B } of list) {
    if (s.wholeFile === true || s.skipped === true) continue;
    ranged++;
    const srcAbs = path.join(srcDir, String(s.file));
    if (!fs.existsSync(srcAbs)) continue; // already reported
    const text = fs.readFileSync(srcAbs, "utf8");
    const nl1 = text.indexOf("\n");
    const nl2 = nl1 >= 0 ? text.indexOf("\n", nl1 + 1) : -1;
    if (nl2 < 0) {
      problem(`src/${s.file}: missing 2-line header`);
      continue;
    }
    const header1 = text.slice(0, nl1);
    const header2 = text.slice(nl1 + 1, nl2);
    const nn = path.basename(String(s.file)).match(/-(\d+)\.js$/)?.[1];
    if (!nn) problem(`src/${s.file}: file name carries no -NN slice number`);
    else if (!new RegExp(`^// .+ ${nn} — .+$`).test(header1))
      problem(`src/${s.file}: header line 1 does not match "// <tag> ${nn} — <marker>": ${header1}`);
    const want2 = `// Lines ${A}-${B} of ${s.sourceFile} (statement-aligned).`;
    if (header2 !== want2) problem(`src/${s.file}: header line 2 is not the recorded range: ${header2}`);
    const body = text.slice(nl2 + 1);
    const srcLines = getLines(path.join(proj, s.sourceFile));
    const raw = srcLines.slice(A - 1, B).join("\n") + "\n";
    const record = recordFor(s.file);
    let expected = raw;
    if (record) {
      renamedSlices++;
      try {
        expected = applyRecordedMap(raw, record);
      } catch (e) {
        problem(`src/${s.file}: recorded rename map does not apply: ${e.message}`);
        continue;
      }
      if (body === raw) problem(`src/${s.file}: rename-map.json records a map but the body is unchanged (record not applied)`);
    } else if (body !== raw) {
      problem(`src/${s.file}: body differs from its readable range but rename-map.json records no map (unrecorded rename)`);
    }
    if (body !== expected)
      problem(`src/${s.file}: body is not a byte-exact round-trip of ${s.sourceFile} lines ${A}-${B} (through the recorded rename map)`);
    else roundOK++;
  }
}

// ── rename-map honesty: indices address the recorded identifier tokens ──
let scopedOK = 0;
for (const [file, scoped] of Object.entries(renameMap.scoped)) {
  const sec = sections.find((s) => s.file === file);
  if (!sec || typeof sec.startLine !== "number" || typeof sec.sourceFile !== "string") continue;
  const lines = getLines(path.join(proj, sec.sourceFile));
  const range = lines.slice(sec.startLine - 1, sec.endLine).join("\n") + "\n";
  const toks = tokens(range);
  const foreign = foreignNameIndices(toks);
  for (const [name, hits] of Object.entries(scoped)) {
    for (const [i, target] of hits) {
      const t = toks[i];
      if (!t || t.t !== "id" || t.v !== name) {
        problem(`rename-map.json ${file}: index ${i} is not the identifier "${name}" (${t ? t.t + "(" + JSON.stringify(t.v.slice(0, 20)) + ")" : "none"})`);
        continue;
      }
      if (foreign.has(i)) problem(`rename-map.json ${file}: index ${i} ("${name}") is an import/export specifier (foreign) position`);
      if (!/^[A-Za-z_$][\w$]*$/.test(target)) problem(`rename-map.json ${file}: "${name}" → "${target}" is not an identifier`);
    }
  }
  scopedOK++;
}
let flatOK = 0;
for (const [file, map] of Object.entries(renameMap.files)) {
  const sec = sections.find((s) => s.file === file);
  if (!sec || typeof sec.startLine !== "number" || typeof sec.sourceFile !== "string") continue;
  const lines = getLines(path.join(proj, sec.sourceFile));
  const range = lines.slice(sec.startLine - 1, sec.endLine).join("\n");
  const ids = new Set(tokens(range).filter((t) => t.t === "id").map((t) => t.v));
  for (const name of Object.keys(map)) if (!ids.has(name)) problem(`rename-map.json ${file}: word-boundary key "${name}" does not occur in the slice range`);
  flatOK++;
}

// ── skipped sections: textual re-verification ───────────────────────────
let skippedOK = 0,
  skippedTotal = 0;
for (const s of sections) {
  if (s.skipped !== true || typeof s.sourceFile !== "string") continue;
  skippedTotal++;
  const src = path.join(proj, s.sourceFile);
  if (!fs.existsSync(src)) {
    problem(`skipped section ${s.file}: sourceFile missing: ${s.sourceFile}`);
    continue;
  }
  const lines = getLines(src);
  if (!Number.isInteger(s.startLine) || !Number.isInteger(s.endLine) || s.startLine < 1 || s.endLine > lines.length)
    continue;
  const first = lines[s.startLine - 1],
    last = lines[s.endLine - 1];
  if (typeof s.firstLine !== "string" || typeof s.lastLine !== "string")
    problem(`skipped section ${s.file}: no firstLine/lastLine recorded`);
  else if (first !== s.firstLine || last !== s.lastLine)
    problem(`skipped section ${s.file}: range text does not match the recorded first/last lines`);
  else skippedOK++;
}

// ── every src + pretty parses standalone ────────────────────────────────
let checkOK = 0;
for (const f of onDisk) if (parseCheck(path.join(srcDir, f), `src/${f}`)) checkOK++;

const prettyFiles = [];
const walkPretty = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkPretty(p);
    else if (/\.pretty\.(js|css|json)$/i.test(e.name)) prettyFiles.push(p);
  }
};
walkPretty(readableDir);
if (!prettyFiles.length) problem("readable/ has no *.pretty.js|css (derived layer missing)");
let prettyOK = 0,
  prettyParsed = 0;
for (const abs of prettyFiles) {
  const rel = path.relative(proj, abs).split(path.sep).join("/");
  if (!/\.pretty\.js$/i.test(rel)) continue; // CSS pretties are indexed, not ESM-parsed
  prettyParsed++;
  if (parseCheck(abs, rel)) prettyOK++;
}

// ── every pretty referenced + provably derived + layer completeness ─────
const referenced = new Set();
for (const [sourceFile] of bySource) referenced.add(sourceFile.split(path.sep).join("/"));
let derivedOK = 0;
for (const abs of prettyFiles) {
  const rel = path.relative(proj, abs).split(path.sep).join("/");
  if (!referenced.has(rel))
    problem(`readable/${path.basename(rel)} exists but is not referenced by split-spec.json`);
  const inlineRec = inlineTwinByPretty.get(rel);
  if (inlineRec) {
    // inline twin: provenance is the recorded block inside a captured HTML doc
    const capRel = String(inlineRec.source);
    if (manifest && !manifest.files?.[capRel]) {
      problem(`${rel}: inline source ${capRel} is not recorded in .upstream/manifest.json`);
      continue;
    }
    const raw = inlineBlockText(inlineRec);
    if (Buffer.from(raw, "utf8").equals(fs.readFileSync(abs)))
      problem(`${rel}: byte-identical to its inline capture block (prettier did not run?)`);
    else derivedOK++;
    continue;
  }
  const capRel = captureByPretty.get(rel);
  const capAbs = capRel ? path.join(proj, capRel) : null;
  if (!capAbs || !fs.existsSync(capAbs)) {
    problem(`${rel}: capture source missing (no captured .js/.css/.unityweb maps to this pretty)`);
    continue;
  }
  if (manifest && !manifest.files?.[capRel])
    problem(`${rel}: capture source ${capRel} is not recorded in .upstream/manifest.json`);
  if (fs.readFileSync(capAbs).equals(fs.readFileSync(abs)))
    problem(`${rel}: byte-identical to its capture source (prettier did not run?)`);
  else derivedOK++;
}
if (manifest) {
  for (const capRel of Object.keys(manifest.files)) {
    if (!/\.(js|css)$/i.test(capRel)) continue;
    if (!prettyFiles.some((abs) => captureByPretty.get(path.relative(proj, abs).split(path.sep).join("/")) === capRel))
      problem(`captured ${capRel} has no readable twin referenced by the spec`);
  }
}

// ── machinery rule: wholeFile sections carry the recorded shape ─────────
// The machinery chunk's whole-file section is recorded TWICE (see tools/derive.mjs):
// the TILING section (its text is the CAPTURE) and the READING-COPY section
// (its text is the readable pretty, its pristine is the capture). The guards
// below are keyed by the CAPTURE path — the tiling section's `file` — and the
// reading-copy twin is required alongside it.
const MACHINERY_GUARDS = [
  ["_nuxt/l-4XETKm.js", /__vite__mapDeps/, /NUXT_E1009/],
  ["_nuxt/A3EUxX58.js", /captureStackTrace/, /extends Error/],
  ["_nuxt/Buq_OoVt.js", /MathMLElement/, /querySelector/],
  ["_nuxt/bBm2T0bl.js", /encodeURI/, /%5e/],
  ["_nuxt/c0TEtrJJ.js", /A3EUxX58\.js/, /bBm2T0bl\.js/],
];
for (const [file, reA, reB] of MACHINERY_GUARDS) {
  const sec = sections.find((s) => s.file === file);
  if (!sec) {
    problem(`machinery section ${file} missing from split-spec.json`);
    continue;
  }
  if (sec.wholeFile !== true) {
    problem(`machinery section ${file} is not wholeFile`);
    continue;
  }
  if (sec.capture !== file) {
    problem(`machinery section ${file}: does not name the capture it was cut from`);
    continue;
  }
  const text = getLines(path.join(proj, sec.sourceFile))
    .slice(sec.startLine - 1, sec.endLine)
    .join("\n");
  if (!reA.test(text) || !reB.test(text)) problem(`machinery section ${file}: content guard failed — readable changed shape`);
  // the READING-COPY twin: the pristine is the capture, the derived text is the
  // readable pretty. It is the shape the frozen export gate reads, and without
  // it the chunk's public export names are invisible to that gate.
  const twin = sections.find((s) => s.wholeFile === true && s.file === sec.sourceFile);
  if (!twin) {
    problem(`machinery section ${file}: no reading-copy section for ${sec.sourceFile}`);
    continue;
  }
  if (twin.origin !== file) {
    problem(`reading-copy section ${twin.file}: does not name the capture ${file} as its pristine`);
    continue;
  }
  if (typeof twin.sourceFile === "string") {
    problem(`reading-copy section ${twin.file}: must not name a sourceFile (its file IS the derived text)`);
  }
}

// ── Unity framework wholeFile guard + payload framing ──────────────────
{
  const fw = sections.find((s) => s.file === "unity-demo/Build/webBuild.framework.js.vendor.js");
  if (!fw) problem("Unity framework wholeFile section missing from split-spec.json");
  else if (fw.wholeFile !== true) problem("Unity framework section is not wholeFile");
  else {
    const text = getLines(path.join(proj, fw.sourceFile))
      .slice(fw.startLine - 1, fw.endLine)
      .join("\n");
    if (!/unityFramework/.test(text) || !/WebAssembly/.test(text))
      problem("Unity framework section: content guard failed — readable changed shape");
  }
}
for (const rec of spec?.notRendered ?? []) {
  if (!/\.unityweb$/i.test(String(rec.capture ?? ""))) continue;
  const abs = path.join(proj, rec.capture);
  if (!fs.existsSync(abs)) {
    problem(`payload ${rec.capture}: file missing`);
    continue;
  }
  const buf = fs.readFileSync(abs);
  if (!(buf[0] === 0x1f && buf[1] === 0x8b) || !buf.subarray(0, 96).includes(Buffer.from("UnityWeb Compressed Content")))
    problem(`payload ${rec.capture}: not a UnityWeb gzip stream as served`);
}

// ── notRendered records verified against the capture ────────────────────
let notRenderedOK = 0;
for (const rec of spec?.notRendered ?? []) {
  if (rec.kind === "inline-data") continue; // verified in the inline scan below
  const abs = path.join(proj, String(rec.capture));
  if (!fs.existsSync(abs)) {
    problem(`notRendered ${rec.capture}: file missing`);
    continue;
  }
  if (manifest && !manifest.files?.[String(rec.capture)])
    problem(`notRendered ${rec.capture}: not recorded in .upstream/manifest.json`);
  const buf = fs.readFileSync(abs);
  if (rec.bytes !== buf.length || rec.sha256 !== sha256(buf))
    problem(`notRendered ${rec.capture}: recorded bytes/sha256 do not match the capture`);
  else notRenderedOK++;
}

// ── inline block twins + map (deliverable rule) ─────────────────────────
let inlineTwins = 0;
let inlineData = 0;
for (const capRel of Object.keys(manifest?.files ?? {})) {
  if (!/\.html$/i.test(capRel)) continue;
  const buf = fs.readFileSync(path.join(proj, capRel));
  const blocks = scanBlocks(buf);
  const entryTag = capRel.replace(/\.html$/i, ""); // served path kept verbatim (dirs mirrored)
  for (const b of blocks) {
    if (isDataBlock(b)) {
      inlineData++;
      const rec = (spec?.notRendered ?? []).find(
        (x) => x.kind === "inline-data" && x.capture === capRel && x.byteStart === b.contentStart,
      );
      if (!rec) problem(`${capRel}: typed data block #${b.block} is not recorded as inline-data notRendered`);
      else if (rec.byteEnd !== b.contentEnd || rec.sha256 !== b.sha256 || rec.bytes !== b.bytes)
        problem(`${capRel}: inline-data record #${b.block} range/sha256 does not match the capture bytes`);
      continue;
    }
    inlineTwins++;
    const twinExt = b.kind === "style" ? "css" : b.kind === "importmap" ? "json" : "js";
    const twin = `readable/${entryTag}-inline-${b.block}.pretty.${twinExt}`;
    if (!fs.existsSync(path.join(proj, twin))) problem(`${capRel}: inline ${b.kind} #${b.block} has no twin ${twin}`);
    else if (!referenced.has(twin)) problem(`${twin}: inline twin is not referenced by split-spec.json`);
    const rec = inlineMap?.blocks?.find((x) => x.file === twin && x.source === capRel);
    if (!rec) {
      problem(`${capRel}: inline ${b.kind} #${b.block} is missing from readable/index-inline-map.json`);
      continue;
    }
    if (rec.byteStart !== b.contentStart || rec.byteEnd !== b.contentEnd || rec.sha256 !== b.sha256)
      problem(`${twin}: recorded inline byte range/sha256 does not match the capture bytes`);
  }
}
if (inlineMap && inlineTwins === 0) problem("readable/index-inline-map.json exists but the capture has no inline twin blocks");

// ── the hard rule: src/ import resolution against the capture ───────────
let checkedImports = 0,
  resolvedImports = 0,
  whitelisted = 0;
for (const s of sections) {
  if (s.wholeFile === true || s.skipped === true) continue;
  if (!s.file || typeof s.sourceFile !== "string") continue;
  const srcAbs = path.join(srcDir, String(s.file));
  if (!fs.existsSync(srcAbs)) continue;
  const capRel = captureByPretty.get(s.sourceFile);
  const baseDir = capRel ? path.posix.dirname(capRel) : null;
  const code = fs.readFileSync(srcAbs, "utf8");
  for (const { spec: specifier, kind, clause } of extractSpecifiers(code)) {
    checkedImports++;
    if (specifier.startsWith("./") || specifier.startsWith("../")) {
      if (!baseDir) {
        problem(`src/${s.file}: ${kind} import "${specifier}" but no capture provenance is known`);
        continue;
      }
      const target = path.posix.normalize(path.posix.join(baseDir, specifier));
      if (!fs.existsSync(path.join(proj, target))) {
        problem(`src/${s.file}: unresolvable ${kind} import "${specifier}" (capture carries no ${target})`);
        continue;
      }
      resolvedImports++;
      const targetCode = fs.readFileSync(path.join(proj, target), "utf8");
      const targetExports = exportsOf(targetCode);
      for (const n of namedImports(clause)) {
        if (n === "*" || targetExports.has(n)) continue;
        problem(`src/${s.file}: imports { ${n} } from "${specifier}" but ${target} does not export it`);
      }
      continue;
    }
    if (specifier.startsWith("#")) {
      // import-map alias — must resolve through the captured importmap block
      const target = importMapAliases.get(specifier);
      if (!target) {
        problem(`src/${s.file}: import-map alias "${specifier}" is not declared in any captured importmap`);
        continue;
      }
      if (!fs.existsSync(path.join(proj, target))) {
        problem(`src/${s.file}: import-map alias "${specifier}" -> ${target} is not in the capture`);
        continue;
      }
      resolvedImports++;
      continue;
    }
    if (specifier.startsWith("node:") || specifier.startsWith("vite/") || specifier.startsWith("/")) {
      whitelisted++;
      continue;
    }
    problem(`src/${s.file}: unresolvable ${kind} import "${specifier}" — bare/URL specifier not whitelisted`);
  }
}

// ── derived layers must never enter the capture sums ────────────────────
if (manifest) {
  for (const rel of Object.keys(manifest.files)) {
    const norm = rel.split(path.sep).join("/");
    if (/^(readable|src|legacy)\//.test(norm) || ["split-spec.json", "rename-map.json", "index-inline-map.json", "_mirror-report.json"].includes(norm))
      problem(`derived layer leaked into the capture manifest: ${rel}`);
  }
}

// ── best-effort: re-render every pretty with the pinned prettier 3.9.6 ─
const prettierCandidates = [
  process.env.PRETTIER_MJS,
  path.join(proj, "node_modules", "prettier", "index.mjs"),
  "D:/repos/mirrors/metropolygonia/node_modules/prettier/index.mjs",
].filter(Boolean);
function loadPinnedPrettier() {
  for (const c of prettierCandidates) {
    if (!fs.existsSync(c)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(c), "package.json"), "utf8"));
      if (pkg.version !== PINNED) continue;
      return c;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

(async () => {
  let renderNote = `prettier ${PINNED} not importable — renderOptions recorded, re-render check skipped`;
  const prettierPath = loadPinnedPrettier();
  if (prettierPath) {
    const prettier = (await import(pathToFileURL(prettierPath).href)).default;
    let renderOK = 0;
    for (const abs of prettyFiles) {
      const rel = path.relative(proj, abs).split(path.sep).join("/");
      const parser = /\.pretty\.css$/i.test(rel) ? "css" : /\.pretty\.json$/i.test(rel) ? "json" : "babel";
      let sourceText;
      const inlineRec = inlineTwinByPretty.get(rel);
      if (inlineRec) {
        sourceText = inlineBlockText(inlineRec); // inline twin: re-render from the raw block
      } else {
        const capRel = captureByPretty.get(rel);
        const capAbs = capRel ? path.join(proj, capRel) : null;
        if (!capAbs || !fs.existsSync(capAbs)) continue; // already reported
        if (capRel === FRAMEWORK_CAPTURE) {
          try {
            sourceText = zlib.gunzipSync(fs.readFileSync(capAbs)).toString("utf8");
          } catch (e) {
            problem(`${rel}: cannot gunzip its capture source ${capRel}: ${e.message}`);
            continue;
          }
        } else {
          sourceText = fs.readFileSync(capAbs, "utf8");
        }
      }
      const got = await prettier.format(sourceText, { parser });
      const want = fs.readFileSync(abs, "utf8");
      if (got === want) renderOK++;
      else problem(`${rel}: does not re-render byte-exact under pinned prettier ${PINNED} ({parser:${parser}})`);
    }
    renderNote = `${renderOK}/${prettyFiles.length} pretties re-render byte-exact under pinned prettier ${PINNED}`;
  }

  if (problems.length) {
    console.error(`AUDIT FAIL — ${problems.length} problem(s)`);
    for (const p of problems) console.error("  " + p);
    process.exit(1);
  }
  console.log(
    `AUDIT PASS — ${sections.length} spec sections (${roundOK}/${ranged} src↔pretty round-trips byte-exact through the recorded rename map, ` +
      `${renamedSlices} renamed slice(s), rename map ${flatRecorded} word-boundary + ${scopedRecorded} indexed record(s) over ${renameSlices.size} slice(s) token-validated, ` +
      `${tiledOK}/${bySource.size} pretty sources tiled contiguously, ` +
      `${skippedOK}/${skippedTotal} skipped sections re-verified textually, ` +
      `${checkOK}/${onDisk.length} src slices + ${prettyOK}/${prettyParsed} readable/*.pretty.js parse standalone (node --input-type=module --check -), ` +
      `${derivedOK}/${prettyFiles.length} pretties provably distinct from their capture source, ` +
      `${indexOnlyFiles.size} index-only wholeFile/skipped sections carry no src file, ` +
      `${readingCopyOK}/${readingCopySections.length} whole-file reading copies re-verified against their capture (different files, same export surface), ` +
      `${inlineTwins} inline twin block(s) + ${inlineData} inline-data block(s) verified, ` +
      `${notRenderedOK} notRendered record(s) byte-verified, ` +
      `${resolvedImports}/${checkedImports} imports resolve inside the capture (${whitelisted} whitelisted machinery), ` +
      `${renderNote}, capture manifest free of derived layers)`,
  );
})();
