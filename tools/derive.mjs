// derive.mjs — rebuild the derived layers (readable/ + src/ + split-spec.json)
// from the diffusionworks-demo capture (PLAN §3/§5).
//
// SCOPE: https://diffusionworks.com/web-demo is one route of a closed product
// site; the mirror captures the DEMO's closure only — the Nuxt shell needed
// to boot the demo page plus the /unity-demo/ Unity WebGL build itself. Other
// site routes (docs/support/privacy/...) are deliberately out of scope.
//
// Pipeline:
//   captured *.js (six Nuxt boot chunks + the Unity loader)
//        -> pinned prettier 3.9.6 (module API — the CLI respects .gitignore
//           and can silently echo its input), single pass, verified idempotent
//        -> readable/<capture-root-relative name, dirs flattened with __>.pretty.js
//   captured *.css (entry CSS + Unity template stylesheet)
//        -> readable/<...>.pretty.css, wholeFile section (stylesheet rule)
//   unity-demo/Build/webBuild.framework.js.unityweb
//        -> gzip stream decompressed IN MEMORY (never stored decompressed)
//        -> readable/unity-demo__Build__webBuild.framework.js.pretty.js,
//           wholeFile vendor section (the Unity engine/emscripten framework)
//   site-shell app chunks (Nuxt runtime/machinery: entry boot, vendor bundle,
//   router/dom/encoding utils) -> wholeFile vendor sections, never sliced:
//   they are the product site's framework code, not demo code
//   demo glue -> statement-aligned slices src/<tag>-NN.js at top-level
//   declaration boundaries, ~250-350 line windows (oversized single
//   declarations stay whole), exact 2-line provenance header; every slice is
//   parse-checked with `node --input-type=module --check -` and round-trips
//   byte-exact to its readable line range:
//     - unity-demo/Build/webBuild.loader.js  (the Unity loader: download,
//       progress, in-JS gzip inflate of the .unityweb payloads)
//     - _nuxt/B9hgXP_e.js                    (the /web-demo route component)
//   payload/binary files (webBuild.data.unityweb, webBuild.wasm.unityweb, the
//   seven Inter woff2 subsets, every image/ico) -> split-spec notRendered with
//   bytes + sha256; the .unityweb payloads are UnityWeb gzip streams stored
//   exactly as served (Unity's loader inflates them in JS — no
//   Content-Encoding on the wire).
//   entry documents (web-demo/index.html, unity-demo/index.html) -> inline
//   <script>/<style> scan (byte ranges + sha256): the importmap and
//   __NUXT__ boot script get twins, the typed Nuxt data block is recorded as
//   inline-data notRendered, the Unity template's inline boot script gets a
//   twin.
//
// SERVED-PATH MIRRORING: the capture preserves the served URL structure
// (web-demo/, _nuxt/, unity-demo/Build/, …), so the derived layers MIRROR it —
// real subdirectories and the served filenames (hash included) are kept, with
// the -NN slice suffix for multi-part files (taipei-rush-tokyo precedent,
// PLAN §5). No __ flattening.
//
// Identifiers in src/ carry the semantic rename campaign (PLAN §5) where the
// app's own code is reachable: the Unity loader is Unity's generated loader
// machinery (its whole body sits inside one top-level function declaration, so
// the campaign's program-scope rule cannot reach it — the vendor rule leaves it
// unrenamed); the /web-demo Nuxt route component IS renamed. rename-map.json is
// the record, recovered by tools/recover-scoped-map.mjs and re-applied here.
// usage:
//   node tools/derive.mjs
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { applyRecordedMap, recordCounts } from "./engine/rename-layer.mjs";
// ── --check: prove the committed derived layer is current, writing NOTHING ─
// This tool used to ignore its command line entirely, so `node tools/derive.mjs
// --check` was a full in-place re-derivation: it rewrote readable/ + src/ +
// split-spec.json and (on a mirror whose derive does not re-apply the recorded
// rename map) stripped the rename layer off src/ -- damage that looks
// legitimate, because the files still parse. --check now runs the mirror's
// documented rebuild chain in a throwaway scratch copy OUTSIDE the mirror and
// compares the result with the committed tree; it writes nothing here.
if (process.argv.includes("--check")) {
  const { runDeriveCheck } = await import("./derive-check.mjs");
  process.exit(await runDeriveCheck());
}

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, "..");
const PINNED = "3.9.6";
const MIN_WINDOW = 250;
const MAX_WINDOW = 350;
const ROOT = ""; // capture files sit at the repo root (served-path == disk rel)
const FRAMEWORK_CAPTURE = "unity-demo/Build/webBuild.framework.js.unityweb";
const FRAMEWORK_PRETTY = "readable/unity-demo/Build/webBuild.framework.js.pretty.js";

// ── recorded semantic rename map (the PLAN §5 campaign record) ───────────
// rename-map.json is recovered from the committed slices by
// tools/recover-scoped-map.mjs (token alignment: a slice body equals its
// readable range with identifiers substituted, so every differing pair is a
// PROVEN rename). A re-cut re-applies it here, index-validated, so a drifted
// readable or a stale map fails loudly instead of silently mis-renaming.
function loadRenameMap() {
  const p = path.join(proj, "rename-map.json");
  if (!fs.existsSync(p)) return { files: {}, scoped: {}, present: false };
  const rm = JSON.parse(fs.readFileSync(p, "utf8"));
  return { files: rm.files || {}, scoped: rm.scoped || {}, present: true };
}
const recordsFor = (map, file) => {
  const files = map.files[file];
  const scoped = map.scoped[file];
  return files || scoped ? { files, scoped } : null;
};

// write a derived file at its served-path-mirroring relative name (mkdir -p)
const writeDerived = (rel, data) => {
  const abs = path.join(proj, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, data);
};
// every *.pretty.* file under readable/ and every *.js under src/, recursively,
// as repo-relative posix paths (for orphan pruning)
const walkRel = (dir) => {
  const out = [];
  const rec = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) rec(p);
      else out.push(path.relative(proj, p).split(path.sep).join("/"));
    }
  };
  rec(path.join(proj, dir));
  return out;
};

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const readLines = (abs) => {
  const t = fs.readFileSync(abs, "utf8");
  const l = t.split("\n");
  if (l.length && l[l.length - 1] === "") l.pop();
  return l;
};
const linesOf = (text) => text.replace(/\n$/, "").split("\n");
const lineOf = (text, offset) => text.slice(0, offset).split("\n").length;

// capture-relative name -> readable twin name (served path kept verbatim: the
// capture preserves the served URL structure, so the derived layers mirror it —
// nested directories, no __ flattening)
const tagOf = (capRel) => {
  const rel = capRel.startsWith(ROOT) ? capRel.slice(ROOT.length) : capRel;
  return rel.replace(/\.(js|css)$/i, "");
};
const prettyRelFor = (capRel) =>
  "readable/" + tagOf(capRel) + (/\.css$/i.test(capRel) ? ".pretty.css" : ".pretty.js");

// ── pinned prettier (module API, exactly 3.9.6) ─────────────────────────
async function loadPrettier() {
  const candidates = [
    process.env.PRETTIER_MJS,
    path.join(proj, "node_modules", "prettier", "index.mjs"),
    "D:/repos/mirrors/metropolygonia/node_modules/prettier/index.mjs",
  ].filter(Boolean);
  for (const c of candidates) {
    if (!fs.existsSync(c)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(c), "package.json"), "utf8"));
      if (pkg.version !== PINNED) continue;
      const mod = (await import(pathToFileURL(c).href)).default;
      if (mod.version === PINNED) return { mod, at: c };
    } catch {
      /* try next */
    }
  }
  throw new Error(`pinned prettier ${PINNED} not found (set PRETTIER_MJS to its index.mjs)`);
}

// single pass + idempotency proof: prettier output must be a fixed point of
// the same call, so audit's one-pass re-render is byte-exact by construction
async function formatOnce(prettier, text, parser) {
  const out = await prettier.format(text, { parser });
  const again = await prettier.format(out, { parser });
  if (again !== out) throw new Error(`prettier ${parser} is not idempotent on this input`);
  return out;
}

// ── parse check: the exact standalone gate (ESM stdin) ──────────────────
function parses(text) {
  const r = spawnSync(process.execPath, ["--input-type=module", "--check", "-"], {
    input: text,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: r.status === 0, why: (r.stderr || "").trim().split("\n").slice(-3).join(" | ") };
}

// ── the SERVED CAPTURE's own export statement ───────────────────────────
// An index-only tail records no `text`, so the frozen public-export gate has
// no derived text for that table and falls back to the PRISTINE's own lines —
// the file compared with itself, a comparison that can never fail, yet counted
// as CHECKED. Recording the capture's own export statement on the tail makes
// the two sides two DIFFERENT files.
//
// The statement is located by its PUBLIC-NAME SET (equal sets, not
// positional), so a fragment of a string that happens to contain `export {`
// is never mistaken for it, and the ORDER of the names does not matter.
// When the capture carries no statement with that name set, NOTHING is
// invented: the tail stays a plain index-only record and the gate keeps
// reporting that table unchecked.
function exportListNames(text) {
  const out = new Set();
  for (const m of String(text).matchAll(/\bexport\s*\{([^{}]*)\}/g)) {
    for (let part of m[1].split(",")) {
      part = part.trim();
      if (!part) continue;
      const as = part.split(/\s+as\s+/);
      const pub = (as.length === 2 ? as[1] : as[0]).trim();
      if (/^[A-Za-z_$][\w$]*$/.test(pub)) out.add(pub);
    }
  }
  return out;
}
function captureExportStatement(captureText, want) {
  if (!want || !want.size) return null;
  let found = null;
  for (const m of captureText.matchAll(/\bexport\s*\{([^{}]*)\}\s*;?/g)) {
    const names = exportListNames(m[0]);
    if (names.size !== want.size) continue;
    if (![...want].every((n) => names.has(n))) continue;
    found = m[0];
  }
  return found;
}

// ── markers for titles (top tokens, lowercase; fleet convention) ────────
const STOP = new Set(
  ("function return typeof undefined object string number boolean prototype length value default " +
    "exports import this that with from then else case break continue delete instanceof constructor " +
    "arguments void null true false call apply name type text target window document globalthis self " +
    "require module async await yield static class const let var new for while switch throw try catch " +
    "finally extends super using debugger of in do if has own hasown get set")
    .split(" ")
    .filter(Boolean),
);
function markers(text, n = 2) {
  // URLs/identifiers living inside string literals (import paths, asset names)
  // are not code tokens — strip quoted strings before counting
  const code = text.replace(/`[^`]*`|"[^"\n]*"|'[^'\n]*'/g, " ");
  const counts = new Map();
  for (const m of code.matchAll(/[A-Za-z][A-Za-z0-9_]{2,}/g)) {
    const w = m[0].toLowerCase();
    if (STOP.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n);
}
const markerText = (ms) => ms.map(([w, c]) => `${w}(${c})`).join(", ");

// ── windowize: cut only at statement starts; ≤350 lines, a single ───────
// ── oversized declaration is a window of its own ────────────────────────
function windowize(stmts) {
  const out = [];
  let cur = null;
  for (const s of stmts) {
    if (!cur) {
      cur = { first: s, last: s, count: 1, startLine: s.startLine, endLine: s.endLine };
      continue;
    }
    const projected = s.endLine - cur.startLine + 1;
    if (projected > MAX_WINDOW) {
      out.push(cur);
      cur = { first: s, last: s, count: 1, startLine: s.startLine, endLine: s.endLine };
    } else {
      cur.last = s;
      cur.count++;
      cur.endLine = s.endLine;
    }
  }
  if (cur) out.push(cur);
  return out;
}

// ── inline block scan (byte-exact, over the raw entry buffer) ───────────
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
      if (j < 0) throw new Error(`unterminated <${kind}> opened at byte ${i}`);
      const tag = buf.subarray(i, tagEnd + 1).toString("utf8");
      const external = /\bsrc\s*=\s*["']/i.test(tag);
      if (external) {
        blocks.push({ kind, external: true, tag, openStart: i, contentStart: tagEnd + 1, contentEnd: j });
      } else {
        n++;
        const content = buf.subarray(tagEnd + 1, j);
        blocks.push({
          kind: /\btype\s*=\s*["']importmap["']/i.test(tag) ? "importmap" : kind,
          external: false,
          block: n,
          tag,
          openStart: i,
          contentStart: tagEnd + 1,
          contentEnd: j,
          bytes: content.length,
          sha256: sha256(content),
          text: content.toString("utf8"),
        });
      }
      p = j + close.length;
    }
  }
  return blocks.sort((a, b) => a.openStart - b.openStart);
}

// ── curated classification (guards fail loudly) ─────────────────────────
// Site-shell machinery chunks: the Nuxt runtime the demo page boots through.
// They are the product site's framework code, not demo code, and identifiers
// are minified — indexed whole-file in readable/, never sliced.
const WHOLE_FILE = {
  "_nuxt/l-4XETKm": {
    title: "_nuxt/l-4XETKm.js — Nuxt entry chunk (site-shell machinery, whole-file, never sliced)",
    desc:
      "The Nuxt/Vite entry chunk that boots the site shell: the `__vite__mapDeps` route-chunk table, the " +
      "Nuxt app/plugin/router bootstrap and the exported `#entry` bindings the route components import. " +
      "Product-site framework machinery, not demo code — indexed whole-file in readable/, never sliced.",
    guard: (t) => t.includes("__vite__mapDeps") && t.includes("NUXT_E1009"),
    what: "Nuxt entry chunk (site-shell machinery)",
  },
  "_nuxt/A3EUxX58": {
    title: "_nuxt/A3EUxX58.js — Nuxt/Vue vendor bundle (site-shell machinery, whole-file, never sliced)",
    desc:
      "The shared vendor bundle of the Nuxt build (error classes with code/docs/fix metadata, reactivity and " +
      "DOM helpers, the modulepreload graph the route chunks import from). Product-site framework machinery, " +
      "not demo code — indexed whole-file in readable/, never sliced.",
    guard: (t) => t.includes("captureStackTrace") && t.includes("extends Error"),
    what: "Nuxt/Vue vendor bundle (site-shell machinery)",
  },
  "_nuxt/Buq_OoVt": {
    title: "_nuxt/Buq_OoVt.js — Nuxt DOM/router utilities (site-shell machinery, whole-file, never sliced)",
    desc:
      "Nuxt utility chunk: DOM query helpers (MathMLElement handling) used by the site shell's navigation and " +
      "route components. Product-site framework machinery, not demo code — indexed whole-file in readable/, " +
      "never sliced.",
    guard: (t) => t.includes("MathMLElement") && t.includes("querySelector"),
    what: "Nuxt DOM/router utilities (site-shell machinery)",
  },
  "_nuxt/bBm2T0bl": {
    title: "_nuxt/bBm2T0bl.js — Nuxt encoding utilities (site-shell machinery, whole-file, never sliced)",
    desc:
      "Nuxt encoding utility chunk (URI escape/unescape tables used by the router and fetch layers). " +
      "Product-site framework machinery, not demo code — indexed whole-file in readable/, never sliced.",
    guard: (t) => t.includes("encodeURI") && t.includes("%5e"),
    what: "Nuxt encoding utilities (site-shell machinery)",
  },
  "_nuxt/c0TEtrJJ": {
    title: "_nuxt/c0TEtrJJ.js — Nuxt runtime glue (site-shell machinery, whole-file, never sliced)",
    desc:
      "Nuxt runtime glue chunk (fetch/cookie/head helpers shared by the site shell and its route components). " +
      "Product-site framework machinery, not demo code — indexed whole-file in readable/, never sliced.",
    guard: (t) => t.includes("A3EUxX58.js") && t.includes("bBm2T0bl.js"),
    what: "Nuxt runtime glue (site-shell machinery)",
  },
};

async function main() {
  const { mod: prettier, at } = await loadPrettier();
  console.log(`pinned prettier ${PINNED} (${at})`);

  const manifest = JSON.parse(fs.readFileSync(path.join(proj, ".upstream", "manifest.json"), "utf8"));
  const captured = Object.keys(manifest.files).map((r) => r.split(path.sep).join("/")).sort();
  const captureBytes = (rel) => {
    const abs = path.join(proj, rel);
    if (!fs.existsSync(abs)) throw new Error(`capture file missing: ${rel}`);
    const buf = fs.readFileSync(abs);
    if (sha256(buf) !== manifest.files[rel].sha256)
      throw new Error(`${rel} on disk does not match .upstream/manifest.json — re-verify the capture first`);
    return buf;
  };

  const readableDir = path.join(proj, "readable");
  const srcDir = path.join(proj, "src");
  fs.mkdirSync(readableDir, { recursive: true });
  fs.mkdirSync(srcDir, { recursive: true });
  const written = { readable: new Set(), src: new Set() };

  const sources = [];
  const sections = [];
  const notRendered = [];
  const inlineFiles = [];
  let slicedTotal = 0;
  let skippedTotal = 0;

  // ── recorded semantic rename map (the PLAN §5 campaign record) ─────────
  const renameMap = loadRenameMap();
  console.log(
    renameMap.present
      ? `rename map: rename-map.json (${Object.keys(renameMap.files).length} word-boundary + ${Object.keys(renameMap.scoped).length} indexed slice record(s))`
      : "rename map: none (rename-map.json absent — src/ keeps the bundle's own names)",
  );
  const bindingsBySource = new Map(); // sourceFile -> { oldName: newName }
  let renamedSlices = 0;
  const renamedNameSet = new Set();
  let renamedSplices = 0;

  const jsRelsAll = captured.filter((r) => /\.js$/i.test(r));
  const cssRels = captured.filter((r) => /\.css$/i.test(r));
  const htmlRels = captured.filter((r) => /\.html$/i.test(r));
  // the Unity loader first (the demo's own glue), then the site shell chunks
  const rank = (rel) => (/webBuild\.loader\.js$/.test(rel) ? 0 : 1);
  const jsRels = jsRelsAll.slice().sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

  // ── 0) non-code capture records: payloads and binary assets ────────────
  const NOT_RENDERED_KINDS = [
    [/\.unityweb$/i, "payload", "UnityWeb-compressed (gzip) payload stored exactly as served — Unity's loader inflates it in JS at runtime; no render pass"],
    [/\.woff2$/i, "font", "Inter woff2 subset (vendor font), stored byte-exact — no render pass"],
    [/\.png$/i, "image", "raster image, stored byte-exact — no render pass"],
    [/\.ico$/i, "image", "icon, stored byte-exact — no render pass"],
    [/\.json$/i, "data", "JSON data recorded at boot (Nuxt build manifest), no render pass"],
  ];
  for (const rel of captured) {
    if (/\.(js|css|html)$/i.test(rel)) continue;
    const kind = NOT_RENDERED_KINDS.find(([re]) => re.test(rel));
    const buf = captureBytes(rel);
    notRendered.push({
      capture: rel,
      kind: kind ? kind[1] : "binary",
      bytes: buf.length,
      sha256: sha256(buf),
      rendered: false,
      reason: kind ? kind[2] : "binary asset, stored byte-exact — no render pass",
    });
  }

  // ── 1) JS: site-shell machinery -> wholeFile; demo glue -> slices ──────
  for (const rel of jsRels) {
    const buf = captureBytes(rel);
    const text = buf.toString("utf8");
    if (!Buffer.from(text, "utf8").equals(buf)) throw new Error(`${rel} does not round-trip through utf8`);
    const pretty = await formatOnce(prettier, text, "babel");
    if (pretty === text)
      throw new Error(`${rel}: prettier output is byte-identical to the capture — nothing to derive`);
    const sourceFile = prettyRelFor(rel);
    writeDerived(sourceFile, pretty);
    written.readable.add(sourceFile);
    const lines = linesOf(pretty);
    const tag = tagOf(rel);
    const cls = WHOLE_FILE[tag];

    if (cls) {
      const region = pretty;
      if (cls.guard && !cls.guard(region))
        throw new Error(`${rel}: whole-file guard failed — readable changed shape`);
      // The site-shell machinery chunk is never sliced, so its whole-file
      // section is the ONLY record of it — and the frozen public-export gate
      // reads that record in two shapes. It is recorded TWICE:
      //
      //   1. the TILING section — the source is the readable pretty and its
      //      TEXT is the CAPTURE: the capture is the only other file that
      //      carries this chunk's export table, so it is what the gate
      //      compares the pretty's public names against (a self-compare
      //      proves nothing);
      //   2. the READING-COPY section — the PRISTINE is the captured chunk and
      //      the derived text is the readable pretty, so the gate reads the
      //      capture's export table and checks it against the layer.
      //
      // With one section the chunk's public names are INVISIBLE to the gate:
      // the pretty is walked as the pristine, finds no derived text of its own
      // (it IS the only derived text this chunk has), and every table in it is
      // reported NOT covered — unchecked, not proven intact.
      sections.push({
        file: rel,
        wholeFile: true,
        capture: rel,
        title: cls.title,
        desc: `Lines 1-${lines.length} of ${sourceFile}: ${cls.desc}`,
        note: "whole-file (site-shell machinery rule): indexed in readable/, never sliced",
        startLine: 1,
        endLine: lines.length,
        sourceFile,
      });
      sections.push({
        file: sourceFile,
        wholeFile: true,
        origin: rel,
        title: `${tag} — ${cls.what} (whole-file reading copy)`,
        desc:
          `Lines 1-${lines.length} of ${sourceFile}. The captured chunk ${rel} rendered whole: the reading copy is the ` +
          `only derived text this chunk has (the site-shell machinery rule never slices it), so the export gate ` +
          `compares the capture's public names with it.`,
        note:
          "whole-file (site-shell machinery rule): the pristine is the captured chunk, the derived text is the readable pretty",
        startLine: 1,
        endLine: lines.length,
      });
      sources.push({
        sourceFile,
        capture: rel,
        captureKind: "file",
        captureSha256: manifest.files[rel].sha256,
        captureBytes: buf.length,
        prettyLines: lines.length,
        prettyBytes: Buffer.byteLength(pretty, "utf8"),
        tag,
        slices: 0,
        derived: "readable only (site-shell machinery, wholeFile)",
        what: cls.what,
      });
      console.log(`derive: ${rel} -> ${sourceFile} (${lines.length} lines, wholeFile machinery)`);
      continue;
    }

    // ── demo glue: statement-aligned slicing ────────────────────────────
    const dbg = await prettier.__debug.parse(pretty, { parser: "babel" });
    const program = (dbg.ast.program || dbg.ast).body;
    // The Unity loader is ONE top-level function declaration (createUnityInstance)
    // covering the whole file, so slices descend one level into that function
    // body and cut at ITS top-level statement boundaries (seedworld precedent,
    // recorded as slicingContext). The wrapper head line, a body-level `return`
    // (illegal outside a function) and the closing brace are index-only
    // skipped sections.
    const bodyMode = /webBuild\.loader\.js$/.test(rel);
    let top = program;
    let headSkip = null;
    let tailSkip = null;
    if (bodyMode) {
      if (program.length !== 1 || program[0].type !== "FunctionDeclaration")
        throw new Error(`${rel}: expected a single top-level function declaration — readable changed shape`);
      const fn = program[0];
      top = fn.body.body;
      if (top.length < 2) throw new Error(`${rel}: function body has ${top.length} statement(s) — cannot slice`);
      const firstLine = lineOf(pretty, top[0].start);
      if (firstLine > 1) headSkip = { A: 1, B: firstLine - 1 };
      tailSkip = { A: lineOf(pretty, top[top.length - 1].end) + 1, B: lines.length };
    }
    const stmts = top.map((n) => ({
      node: n,
      startLine: lineOf(pretty, n.start),
      endLine: lineOf(pretty, n.end),
      text: pretty.slice(n.start, n.end),
    }));
    for (let i = 1; i < stmts.length; i++)
      if (stmts[i].startLine <= stmts[i - 1].endLine)
        throw new Error(`${rel}: statements ${i - 1}/${i} share a line — cannot slice at line boundaries`);

    const specials = [];
    const covered = new Array(stmts.length).fill(false);
    const claim = (a, b, block) => {
      if (a < 0 || b < a || b >= stmts.length) throw new Error(`${rel}: bad ${block.file} range ${a}-${b}`);
      for (let i = a; i <= b; i++) {
        if (covered[i]) throw new Error(`${rel}: ${block.file} overlaps another block at statement ${i}`);
        covered[i] = true;
      }
      specials.push({ ...block, A: stmts[a].startLine, B: stmts[b].endLine });
    };

    // guard the two sliced files by content anchors
    if (bodyMode) {
      if (!/^function createUnityInstance\(/.test(pretty))
        throw new Error(`${rel}: first statement is not createUnityInstance — readable changed shape`);
      // a body-level `return` cannot stand alone at module scope — index it
      for (let i = 0; i < stmts.length; i++)
        if (stmts[i].node.type === "ReturnStatement" && !covered[i])
          claim(i, i, {
            kind: "skip",
            file: `${tag}-tail-return.js`,
            title: `${tag} — body-level return statement (not standalone, not sliced)`,
            desc: `Lines ${stmts[i].startLine}-${stmts[i].endLine}. The loader function's final \`return\` — a bare return is illegal outside a function, so this statement cannot stand alone; it is indexed only (see split-spec slicingContext).`,
          });
    }
    if (tag === "_nuxt__B9hgXP_e") {
      if (!/content-page web-demo-page/.test(pretty) || !/unity-demo\/index\.html/.test(pretty))
        throw new Error(`${rel}: web-demo route anchors missing — readable changed shape`);
    }

    let exportSkip = null;
    const lastStmt = stmts[stmts.length - 1];
    if (
      lastStmt &&
      lastStmt.node.type === "ExportNamedDeclaration" &&
      !covered[stmts.length - 1] &&
      /^export\s*\{[\s\S]*\}\s*;?$/.test(lastStmt.text.trim()) &&
      !/\bfrom\b/.test(lastStmt.text)
    ) {
      // The tail's derived text: the SERVED CAPTURE's own export statement.
      //
      // An index-only tail records no `text`, so the frozen public-export
      // gate has no derived text for that table and falls back to the
      // PRISTINE's own lines — the file compared with itself, a comparison
      // that can never fail, yet counted as CHECKED. Recording the capture's
      // own statement instead makes the two sides two DIFFERENT files: the
      // capture's raw statement and the reading copy's rendering of it.
      //
      // The statement is located by its PUBLIC-NAME SET (equal sets, not
      // positional), so a fragment of a string that happens to contain
      // `export {` is never mistaken for it. When the capture carries no
      // statement with that name set, NOTHING is invented: the tail stays a
      // plain index-only record and the gate keeps reporting it unchecked.
      const tailNames = exportListNames(lastStmt.text);
      const tailText = captureExportStatement(text, tailNames);
      if (tailText) {
        exportSkip = {
          file: `${tag}-tail-export.js`,
          title: `${tag} — final export table (not sliced)`,
          desc: `Lines ${lastStmt.startLine}-${lastStmt.endLine}. The chunk's final export {…} table — the exported bindings live in the earlier slices; a standalone tail carries no new statements, so it is indexed only. Its recorded text is the SERVED CAPTURE's own export statement, so the public-export gate compares the capture's statement with the reading copy's rendering of it — two different files, not a file with itself.`,
          text: tailText,
        };
        claim(stmts.length - 1, stmts.length - 1, { kind: "skip", ...exportSkip });
      } else {
        exportSkip = {
          file: `${tag}-tail-export.js`,
          title: `${tag} — final export table (not sliced)`,
          desc: `Lines ${lastStmt.startLine}-${lastStmt.endLine}. The chunk's final export {…} table — the exported bindings live in the earlier slices; a standalone tail carries no new statements, so it is indexed only.`,
        };
        claim(stmts.length - 1, stmts.length - 1, { kind: "skip", ...exportSkip });
      }
    }

    // runs of uncovered statements -> windows
    const runs = [];
    for (let i = 0; i < stmts.length; i++) {
      if (covered[i]) continue;
      const run = [stmts[i]];
      while (i + 1 < stmts.length && !covered[i + 1]) run.push(stmts[++i]);
      runs.push(run);
    }
    const slices = [];
    for (const run of runs) for (const w of windowize(run)) slices.push(w);

    // blocks in line order, then re-tile so every line of the pretty is owned
    const blocks = [...specials, ...slices.map((w) => ({ kind: "slice", A: w.startLine, B: w.endLine, count: w.count }))];
    if (headSkip)
      blocks.push({
        kind: "skip",
        A: headSkip.A,
        B: headSkip.B,
        file: `${tag}-wrapper-head.js`,
        title: `${tag} — function wrapper head (not a statement, not sliced)`,
        desc: `Lines ${headSkip.A}-${headSkip.B}. The loader's opening \`function createUnityInstance(t, n, l) {\` line — the wrapper of the sliced function body; indexed only, never sliced.`,
      });
    if (tailSkip && tailSkip.A <= tailSkip.B)
      blocks.push({
        kind: "skip",
        A: tailSkip.A,
        B: tailSkip.B,
        file: `${tag}-wrapper-tail.js`,
        title: `${tag} — function wrapper tail (not a statement, not sliced)`,
        desc: `Lines ${tailSkip.A}-${tailSkip.B}. The loader function's closing brace after the sliced body statements; indexed only, never sliced.`,
      });
    blocks.sort((a, b) => a.A - b.A);
    for (let i = 0; i < blocks.length; i++) {
      if (i === 0) blocks[i].A = 1;
      if (i + 1 < blocks.length) blocks[i].B = blocks[i + 1].A - 1;
      else blocks[i].B = lines.length;
    }

    let nn = 0;
    let perFileSkipped = 0;
    for (const b of blocks) {
      if (b.kind === "slice") {
        nn++;
        const num = String(nn).padStart(2, "0");
        const raw = lines.slice(b.A - 1, b.B).join("\n") + "\n";
        const file = `${tag}-${num}.js`;
        // re-cut through the recorded rename map (index-validated); a slice with
        // no record keeps its pristine readable range byte for byte
        const record = recordsFor(renameMap, file);
        const body = applyRecordedMap(raw, record);
        if (record) {
          renamedSlices++;
          const counts = recordCounts(record, raw);
          renamedSplices += counts.splices;
          for (const [oldName, target] of Object.entries(record.files || {})) {
            renamedNameSet.add(`${oldName}\u0000${target}`);
            if (!bindingsBySource.has(sourceFile)) bindingsBySource.set(sourceFile, {});
            bindingsBySource.get(sourceFile)[oldName] = target;
          }
          // a scoped name that reaches ONE target is also a chunk-level binding
          // rename — the reconstruction gates reach it in index-only skipped
          // sections (the final `export {…}` table) through this map (t)(1)
          for (const [oldName, hits] of Object.entries(record.scoped || {})) {
            const targets = new Set(hits.map(([, t]) => t));
            if (targets.size !== 1) continue;
            const target = [...targets][0];
            renamedNameSet.add(`${oldName}\u0000${target}`);
            if (!bindingsBySource.has(sourceFile)) bindingsBySource.set(sourceFile, {});
            bindingsBySource.get(sourceFile)[oldName] = target;
          }
        }
        const ms = markers(body);
        const topWord = ms.length ? ms[0][0] : /^\s*import\b/.test(body) ? "imports" : tag.toLowerCase();
        const oversized = b.count === 1 && b.B - b.A + 1 > MAX_WINDOW;
        const sliceText =
          `// ${tag} ${num} — ${topWord}\n` +
          `// Lines ${b.A}-${b.B} of ${sourceFile} (statement-aligned).\n` +
          body;
        const chk = parses(sliceText);
        if (!chk.ok) throw new Error(`generated src/${file} does not parse standalone: ${chk.why}`);
        writeDerived(`src/${file}`, sliceText);
        written.src.add(`src/${file}`);
        sections.push({
          file,
          title: `${tag} ${num} — ${topWord}`,
          desc: `${oversized ? "Oversized single declaration (kept whole). " : ""}Lines ${b.A}-${b.B}. Markers: ${markerText(ms)}.${record ? " Range re-cut through the recorded semantic rename map." : ""}`,
          startLine: b.A,
          endLine: b.B,
          sourceFile,
        });
      } else if (b.kind === "skip") {
        perFileSkipped++;
        sections.push({
          file: b.file,
          skipped: true,
          title: b.title,
          desc: b.desc,
          startLine: b.A,
          endLine: b.B,
          sourceFile,
          firstLine: lines[b.A - 1],
          lastLine: lines[b.B - 1],
          // the served capture's own export statement (when the capture
          // carries one with the tail's public-name set) — the derived text
          // the public-export gate compares the reading copy's table against
          ...(b.text ? { text: b.text } : {}),
        });
      }
    }
    // ── the READING-COPY shape: the capture is the PRISTINE ─────────────
    // The chunk's export table is carried by TWO files: the capture as
    // served, and the reading copy. The tail above records the CAPTURE's own
    // statement as its `text`, so the frozen public-export gate compares the
    // reading copy's rendering of that table with the capture's own bytes —
    // two different files, never a file with itself. That record is a
    // SNAPSHOT: a change to the served file alone (without a re-derive) is
    // not caught by it.
    //
    // The reading-copy section is the LIVE link. It is a whole-file section
    // whose `file` IS the reading copy and whose `origin` names the CAPTURE;
    // it records NO `sourceFile`, because the reading copy IS the derived
    // text and there is no slice to cut out of it. The gate then walks the
    // CAPTURE as the pristine and the reading copy as the derived text, so a
    // change to the served file IS caught.
    //
    // It carries `origin` and NOT `capture` on purpose: the gate rebinds a
    // source's whole-file link to the section that names the SAME capture,
    // and the source's pristine here is the reading copy — a `capture` field
    // would make the gate compare the reading copy with itself.
    if (exportSkip && exportSkip.text) {
      sections.push({
        file: sourceFile,
        wholeFile: true,
        origin: rel,
        title: `${tag} — reading copy (whole-file)`,
        desc:
          `Lines 1-${lines.length} of ${sourceFile}. The reading copy of the served capture ${rel}: the PRISTINE the frozen ` +
          `public-export gate reads is the capture itself and the DERIVED text is this reading copy, so the gate compares ` +
          `the served file's own export table with the layer's — two different files, and the served file is read live.`,
        note: "whole-file (reading-copy shape): the pristine is the captured chunk, the derived text is the readable pretty",
        startLine: 1,
        endLine: lines.length,
      });
    }
    slicedTotal += nn;
    skippedTotal += perFileSkipped;
    sources.push({
      sourceFile,
      capture: rel,
      captureKind: "file",
      captureSha256: manifest.files[rel].sha256,
      captureBytes: buf.length,
      prettyLines: lines.length,
      prettyBytes: Buffer.byteLength(pretty, "utf8"),
      prettyPasses: 1,
      idempotent: true,
      tag,
      slices: nn,
      renameBindings: bindingsBySource.get(sourceFile) || {},
      ...(bodyMode
        ? {
            slicing: "function-body",
            slicingNote:
              "slices descend one level into the single top-level createUnityInstance function body and cut at ITS statement boundaries; wrapper head/tail and the body-level return are skipped sections",
          }
        : {}),
      derived:
        `readable + ${nn} statement-aligned slice(s)` +
        (bodyMode ? " of the function body" : "") +
        (perFileSkipped ? ` + ${perFileSkipped} skipped section(s)` : ""),
    });
    console.log(`derive: ${rel} -> ${sourceFile} (${lines.length} lines, ${nn} slices, ${perFileSkipped} skipped)`);
  }

  // ── 2) Unity framework: gunzip in memory, pretty, wholeFile vendor ─────
  {
    const buf = captureBytes(FRAMEWORK_CAPTURE);
    if (!(buf[0] === 0x1f && buf[1] === 0x8b)) throw new Error(`${FRAMEWORK_CAPTURE}: not a gzip stream as served`);
    if (!buf.subarray(0, 96).includes(Buffer.from("UnityWeb Compressed Content")))
      throw new Error(`${FRAMEWORK_CAPTURE}: missing the UnityWeb gzip framing comment — not the served payload`);
    const text = zlib.gunzipSync(buf).toString("utf8");
    for (const [re, what] of [
      [/unityFramework/, "unityFramework factory"],
      [/WebAssembly/, "WebAssembly runtime"],
      [/emscripten|Emscripten/, "emscripten glue"],
    ])
      if (!re.test(text)) throw new Error(`${FRAMEWORK_CAPTURE}: decompressed framework guard failed (${what})`);
    const pretty = await formatOnce(prettier, text, "babel");
    if (pretty === text) throw new Error(`${FRAMEWORK_CAPTURE}: prettier output is byte-identical — nothing derived`);
    writeDerived(FRAMEWORK_PRETTY, pretty);
    written.readable.add(FRAMEWORK_PRETTY);
    const lines = linesOf(pretty);
    sections.push({
      file: "unity-demo/Build/webBuild.framework.js.vendor.js",
      wholeFile: true,
      title: "webBuild.framework.js.unityweb — Unity engine framework (decompressed, whole-file, never sliced)",
      desc:
        `Lines 1-${lines.length} of ${FRAMEWORK_PRETTY}. The Unity WebGL engine/emscripten framework, decompressed ` +
        `IN MEMORY from the gzip stream as served (${buf.length} B compressed) and prettified for reading. It is the ` +
        `file that decides how the .unityweb payloads are fetched and inflated, so it is the one to read when the demo ` +
        `will not start. Vendor rule — indexed whole-file in readable/, never sliced.`,
      note: "whole-file (Unity vendor framework rule): decompressed in memory, indexed in readable/, never sliced",
      startLine: 1,
      endLine: lines.length,
      sourceFile: FRAMEWORK_PRETTY,
    });
    sources.push({
      sourceFile: FRAMEWORK_PRETTY,
      capture: FRAMEWORK_CAPTURE,
      captureKind: "file-gzip",
      captureSha256: manifest.files[FRAMEWORK_CAPTURE].sha256,
      captureBytes: buf.length,
      prettyLines: lines.length,
      prettyBytes: Buffer.byteLength(pretty, "utf8"),
      prettyPasses: 1,
      idempotent: true,
      tag: "unity-demo__Build__webBuild.framework.js",
      slices: 0,
      derived: "readable only (Unity vendor framework, gunzip in memory + pretty, wholeFile)",
      what: "Unity engine framework (emscripten glue) — decompressed in memory",
    });
    console.log(`derive: ${FRAMEWORK_CAPTURE} -> ${FRAMEWORK_PRETTY} (${lines.length} lines, gunzip in memory, wholeFile vendor)`);
  }

  // ── 3) CSS: readable pretty, wholeFile section (stylesheet rule) ───────
  for (const rel of cssRels) {
    const buf = captureBytes(rel);
    const text = buf.toString("utf8");
    const pretty = await formatOnce(prettier, text, "css");
    if (pretty === text) throw new Error(`${rel}: prettier output is byte-identical to the capture`);
    const sourceFile = prettyRelFor(rel);
    writeDerived(sourceFile, pretty);
    written.readable.add(sourceFile);
    const lines = linesOf(pretty);
    const tag = tagOf(rel);
    sections.push({
      file: `${tag}.css`,
      wholeFile: true,
      title: `${tag} — stylesheet (whole-file, never sliced)`,
      desc: `Lines 1-${lines.length} of ${sourceFile}. Whole-file (stylesheet rule): the capture stylesheet is indexed whole in readable/, never sliced.`,
      note: "whole-file (stylesheet, not sliced): CSS is indexed whole in readable/",
      startLine: 1,
      endLine: lines.length,
      sourceFile,
    });
    sources.push({
      sourceFile,
      capture: rel,
      captureKind: "file",
      captureSha256: manifest.files[rel].sha256,
      captureBytes: buf.length,
      prettyLines: lines.length,
      prettyBytes: Buffer.byteLength(pretty, "utf8"),
      prettyPasses: 1,
      idempotent: true,
      tag,
      slices: 0,
      derived: "readable only (stylesheet, wholeFile)",
    });
    console.log(`derive: ${rel} -> ${sourceFile} (${lines.length} lines, wholeFile stylesheet)`);
  }

  // ── 4) HTML entry documents: inline <script>/<style> scan + twins ──────
  for (const rel of htmlRels) {
    const buf = captureBytes(rel);
    const blocks = scanBlocks(buf);
    const inline = blocks.filter((b) => !b.external);
    const external = blocks.filter((b) => b.external);
    inlineFiles.push(rel);
    for (const b of external)
      console.log(`derive: ${rel}: external ${b.kind} (not derived): ${b.tag.slice(0, 90)}`);
    if (!inline.length) {
      console.log(`derive: ${rel}: no inline <script>/<style> content blocks — no inline twins`);
      continue;
    }
    const entryTag = rel.replace(/\.html$/i, ""); // served path kept verbatim (dirs mirrored)
    for (const b of inline) {
      const isImportmap = b.kind === "importmap";
      const parser = isImportmap ? "json" : b.kind === "style" ? "css" : "babel";
      const DATA_TYPES = new Set(["application/ld+json", "application/json", "importmap", "speculationrules"]);
      const type = (/\btype\s*=\s*["']?([^"'\s>]+)/i.exec(b.tag)?.[1] ?? "").toLowerCase();
      if (b.kind === "script" && DATA_TYPES.has(type)) {
        notRendered.push({
          capture: rel,
          kind: "inline-data",
          type,
          byteStart: b.contentStart,
          byteEnd: b.contentEnd,
          bytes: b.bytes,
          sha256: b.sha256,
          rendered: false,
          reason: `typed data block (<script type="${type}">) — data, not JS/CSS; recorded with range + sha256, no pretty pass`,
        });
        continue;
      }
      const tag = `${entryTag}-inline-${b.block}`;
      const prettyFile = `${tag}.pretty.${isImportmap ? "json" : b.kind === "style" ? "css" : "js"}`;
      const pretty = await formatOnce(prettier, b.text, parser);
      if (pretty === b.text)
        throw new Error(`readable/${prettyFile} would be byte-identical to its capture source`);
      writeDerived(`readable/${prettyFile}`, pretty);
      written.readable.add(`readable/${prettyFile}`);
      const lines = linesOf(pretty);
      const prettyBuf = Buffer.from(pretty, "utf8");
      sections.push({
        file: `${tag}.${isImportmap ? "json" : b.kind === "style" ? "css" : "js"}`,
        wholeFile: true,
        title: `${tag} — inline ${b.kind} block (whole-file, never sliced)`,
        desc: `Lines 1-${lines.length} of readable/${prettyFile}. Whole-file: the entry document's inline ${b.kind} block (${b.bytes} B at bytes ${b.contentStart}-${b.contentEnd} of ${rel}) is indexed whole and never sliced.`,
        note: `whole-file (entry inline ${b.kind} block, not sliced)`,
        startLine: 1,
        endLine: lines.length,
        sourceFile: `readable/${prettyFile}`,
      });
      sources.push({
        sourceFile: `readable/${prettyFile}`,
        capture: rel,
        captureKind: `inline-${b.kind}`,
        captureByteStart: b.contentStart,
        captureByteEnd: b.contentEnd,
        captureSha256: b.sha256,
        captureBytes: b.bytes,
        prettyLines: lines.length,
        prettyBytes: prettyBuf.length,
        prettySha256: sha256(prettyBuf),
        tag,
        slices: 0,
        derived: "readable only (inline block, wholeFile)",
      });
    }
  }

  // ── inline byte-range map (twins only) ─────────────────────────────────
  const inlineMap = { note: "byte ranges of the inline <script>/<style> content blocks as served (twins only; typed data blocks are recorded in split-spec notRendered)", blocks: [] };
  for (const rel of htmlRels) {
    const buf = captureBytes(rel);
    const entryTag = rel.replace(/\.html$/i, ""); // served path kept verbatim (dirs mirrored)
    for (const b of scanBlocks(buf).filter((x) => !x.external)) {
      const type = (/\btype\s*=\s*["']?([^"'\s>]+)/i.exec(b.tag)?.[1] ?? "").toLowerCase();
      if (b.kind === "script" && ["application/ld+json", "application/json", "importmap", "speculationrules"].includes(type))
        continue; // typed data block: notRendered in split-spec, no twin
      const twinExt = b.kind === "style" ? "css" : b.kind === "importmap" ? "json" : "js";
      inlineMap.blocks.push({
        file: `readable/${entryTag}-inline-${b.block}.pretty.${twinExt}`,
        source: rel,
        kind: b.kind,
        byteStart: b.contentStart,
        byteEnd: b.contentEnd,
        bytes: b.bytes,
        sha256: b.sha256,
      });
    }
  }
  writeDerived("readable/index-inline-map.json", JSON.stringify(inlineMap, null, 2) + "\n");
  written.readable.add("readable/index-inline-map.json");

  // ── 5) prune orphan derived files (capture untouched) ──────────────────
  let pruned = 0;
  for (const [dir, keep, exts] of [
    ["readable", written.readable, /\.(pretty\.js|pretty\.css|pretty\.json)$/],
    ["src", written.src, /\.js$/],
  ]) {
    for (const rel of walkRel(dir)) {
      if (exts.test(rel) && !keep.has(rel)) {
        fs.rmSync(path.join(proj, rel));
        pruned++;
        console.log(`derive: pruned orphan derived file ${rel}`);
      }
    }
  }
  // drop now-empty directories left behind by a re-cut (e.g. a renamed chunk)
  const pruneEmptyDirs = (dir) => {
    const abs = path.join(proj, dir);
    if (!fs.existsSync(abs)) return;
    for (const e of fs.readdirSync(abs, { withFileTypes: true }))
      if (e.isDirectory()) {
        pruneEmptyDirs(path.join(dir, e.name));
        const p = path.join(abs, e.name);
        if (!fs.readdirSync(p).length) fs.rmdirSync(p);
      }
  };
  pruneEmptyDirs("readable");
  pruneEmptyDirs("src");

  // ── 6) split-spec.json (2-space indent + trailing newline) ─────────────
  const appJs = sources.filter((s) => s.derived.startsWith("readable +"));
  const wholeJs = sources.filter((s) => /wholeFile\)$/.test(s.derived) && s.capture.endsWith(".js"));
  const cssSources = sources.filter((s) => s.sourceFile.endsWith(".pretty.css"));
  const spec = {
    project: "diffusionworks-demo",
    kind: "statement-aligned-slices",
    coverageNote:
      "Export-name gate coverage (tools/check-exports.mjs). Every ES export table this capture carries is " +
      "reached by the gate. The site-shell machinery chunks are never sliced — the vendor rule indexes them " +
      "whole in readable/ — so each is recorded TWICE: the tiling section (its text is the CAPTURE, so the " +
      "readable pretty's public names are checked against the capture's) and the reading-copy section (its " +
      "pristine is the CAPTURE and its text is the readable pretty, so the capture's export table is checked " +
      "against the layer). Both are comparisons between two DIFFERENT files — a self-compare would prove " +
      "nothing — so a public export name changed in a served capture is reported LOST by name. The demo-glue " +
      "chunk's own export table is reached through its skipped tail, rebuilt with the recorded renameBindings; " +
      "the Unity framework and the CSS/inline blocks carry no ES module export surface at all.",
    ...(sources.some((s) => s.slicing === "function-body")
      ? {
          slicingContext:
            "unity-demo/Build/webBuild.loader.js is a single top-level function declaration " +
            "(createUnityInstance) covering the whole file — its slices descend one level into that " +
            "function body and cut at ITS top-level statement boundaries; the wrapper head line, the " +
            "final body-level `return` statement (a bare return is illegal outside a function) and the " +
            "closing brace are skipped (index-only) sections",
        }
      : {}),
    defaultFile: `src/${sections.find((s) => !s.wholeFile && !s.skipped).file}`,
    note:
      "Ultimate Water 2D Web Demo (https://diffusionworks.com/web-demo) is capture-class: a route page of a " +
      "closed product site wrapping a Unity WebGL build at /unity-demo/. §0.4 fork-over-mirror was checked on " +
      "2026-10-13 — the product site publishes deployments, not sources, and no public upstream repo exists for " +
      "this demo (GitHub search finds only this mirror's own repo), so the mirror stands. SCOPE: the DEMO's " +
      "closure only — the Nuxt shell bits needed to boot the demo page plus the Unity WebGL build; other site " +
      "routes (docs/support/privacy/...) are deliberately not captured. Derived pipeline: capture → pinned " +
      "prettier 3.9.6 (module API, default options, single pass verified idempotent — never the CLI: it respects " +
      ".gitignore and can silently echo its input) → readable/<served path>.pretty.js|css per captured JS/CSS " +
      "file; the capture preserves the served URL structure, so the derived layers MIRROR it — nested " +
      "directories and the served filenames kept, no __ flattening (taipei-rush-tokyo precedent, PLAN §5); " +
      "every pretty provably NOT byte-identical to its capture " +
      "source. The Unity framework (unity-demo/Build/webBuild.framework.js.unityweb) is a gzip stream as " +
      "served: it is decompressed IN MEMORY (never stored decompressed) and prettified to " +
      "readable/unity-demo/Build/webBuild.framework.js.pretty.js. src/: statement-aligned slices of the " +
      "demo's own glue — unity-demo/Build/webBuild.loader.js (the Unity loader: download, progress, " +
      "in-JS gzip inflate of the .unityweb payloads) and _nuxt/B9hgXP_e.js (the /web-demo route " +
      "component): top-level declaration boundaries only, ~250-350 line windows, oversized single " +
      "declarations stay whole, exact 2-line provenance header, each slice parses standalone under " +
      "`node --input-type=module --check -` and round-trips byte-exact to its recorded readable line range " +
      "(through the recorded semantic rename map where one is recorded). " +
      "Site-shell machinery rule — wholeFile sections, never sliced: _nuxt/l-4XETKm.js (Nuxt entry boot), " +
      "_nuxt/A3EUxX58.js (Nuxt/Vue vendor bundle), _nuxt/Buq_OoVt.js, _nuxt/bBm2T0bl.js, _nuxt/c0TEtrJJ.js " +
      "(Nuxt utilities/glue) and the Unity framework region — product-framework code, not demo code. Vendor " +
      "payload rule — notRendered with bytes + sha256: webBuild.data.unityweb and webBuild.wasm.unityweb are " +
      "UnityWeb gzip streams stored exactly as served (Unity's loader inflates them in JS; no " +
      "Content-Encoding on the wire), plus the seven Inter woff2 subsets, every image/ico and the two " +
      "recorded JSON build files. Inline scan: web-demo/index.html carries an importmap block (json twin), " +
      "the __NUXT__ boot script (js twin) and a typed Nuxt data block (inline-data notRendered); " +
      "unity-demo/index.html carries the Unity template boot script (js twin). Identifiers in src/ carry the " +
      "semantic rename campaign (PLAN §5) to the extent the bytes allow: the app's own /web-demo Nuxt route " +
      "component is renamed (tools/names.json -> tools/apply-names.mjs -> rename-map.json, recovered by " +
      "tools/recover-scoped-map.mjs and re-applied here on every re-cut); the Unity loader is Unity's " +
      "generated loader machinery whose whole body sits inside one top-level function declaration, so the " +
      "campaign's program-scope rule cannot reach it and the vendor rule leaves it unrenamed (recorded " +
      "honestly in README.md, not claimed). Capture bytes are untouched by everything above; re-cut with " +
      "`node tools/derive.mjs` after any capture refresh. `node tools/audit.js` is the gate.",
    renderOptions: {
      _default:
        "prettier 3.9.6, module API, default options, single pass (re-format verified idempotent at derive time) — never the CLI: it respects .gitignore and can silently echo its input",
      js: "parser babel, no plugins (the Unity framework is gunzipped in memory first)",
      css: "parser css, no plugins",
      json: "parser json, no plugins (inline importmap block)",
    },
    source:
      `readable/: ${sources.filter((s) => s.sourceFile?.endsWith(".pretty.js")).length} JS pretties ` +
      `(${appJs.length} demo-glue file(s) sliced, ${wholeJs.length} machinery/vendor wholeFile) + ` +
      `${cssSources.length} CSS pretties; ` +
      `src/: ${appJs.reduce((n, s) => n + s.slices, 0)} statement-aligned slices across ${appJs.length} demo-glue file(s); ` +
      `${sections.filter((s) => s.skipped).length} skipped section(s); ` +
      `${sections.filter((s) => s.wholeFile).length} wholeFile section(s); ` +
      `capture: ${captured.length} files under .upstream/manifest.json; inline scan: ${inlineFiles.join(", ")}; ` +
      `notRendered: ${notRendered.length} file/block record(s).`,
    inline: {
      scanned: inlineFiles,
      contentBlocks: sections.filter((s) => /-inline-\d+\./.test(s.file)).length,
      notRendered: notRendered.filter((x) => x.kind === "inline-data").length,
      note:
        "web-demo/index.html: importmap + __NUXT__ boot script have twins, the typed Nuxt data block is " +
        "inline-data notRendered; unity-demo/index.html: the Unity template boot script has a twin. " +
        "readable/index-inline-map.json records the byte range + sha256 of every twin block.",
    },
    rename: {
      map: "rename-map.json",
      slices: renamedSlices,
      names: renamedNameSet.size,
      splices: renamedSplices,
      pipeline:
        "tools/names.json (reviewed worklist) → tools/apply-names.mjs (scope-aware writer, canonical guard family) → recovered by tools/recover-scoped-map.mjs",
      note:
        "Semantic renames are recorded per slice in rename-map.json and re-applied on every re-cut. The " +
        "campaign covers the app's own /web-demo Nuxt route component only: its top-level compiler-generated " +
        "bindings are renamed to reviewed semantic names. The Unity loader (unity-demo/Build/webBuild.loader.js) " +
        "is Unity's generated loader machinery — its whole body sits inside one top-level function declaration " +
        "(createUnityInstance), so the campaign's program-scope rule cannot reach it, and the vendor rule " +
        "(deobfuscation applies to app code only) leaves it unrenamed; the site-shell machinery chunks and the " +
        "Unity framework are wholeFile and never renamed.",
    },
    sources,
    sections,
    notRendered,
  };
  fs.writeFileSync(path.join(proj, "split-spec.json"), JSON.stringify(spec, null, 2) + "\n");

  // ── 7) self-check (tools/audit.js is the authoritative gate) ───────────
  let bad = 0;
  const bySource = new Map();
  for (const s of sections) {
    // a READING-COPY section names no sourceFile: its `file` IS the derived
    // text (the readable pretty), so it has no line range to tile.
    if (!s.sourceFile) continue;
    if (!bySource.has(s.sourceFile)) bySource.set(s.sourceFile, []);
    bySource.get(s.sourceFile).push(s);
  }
  for (const [sourceFile, list] of bySource) {
    const lines = readLines(path.join(proj, sourceFile));
    const sorted = [...list].sort((a, b) => a.startLine - b.startLine);
    if (sorted[0].startLine !== 1) {
      console.error(`TILING FAIL ${sourceFile}: starts at line ${sorted[0].startLine}`);
      bad++;
    }
    for (let i = 1; i < sorted.length; i++)
      if (sorted[i].startLine !== sorted[i - 1].endLine + 1) {
        console.error(`TILING FAIL ${sourceFile}: gap/overlap at ${sorted[i].file}`);
        bad++;
      }
    if (sorted[sorted.length - 1].endLine !== lines.length) {
      console.error(`TILING FAIL ${sourceFile}: does not reach EOF (${lines.length})`);
      bad++;
    }
  }
  let parsed = 0;
  let ranged = 0;
  let roundOK = 0;
  for (const s of sections) {
    if (s.wholeFile || s.skipped) continue;
    ranged++;
    const abs = path.join(srcDir, s.file);
    const text = fs.readFileSync(abs, "utf8");
    const nl2 = text.indexOf("\n", text.indexOf("\n") + 1);
    const body = text.slice(nl2 + 1);
    const raw = readLines(path.join(proj, s.sourceFile)).slice(s.startLine - 1, s.endLine).join("\n") + "\n";
    const expected = applyRecordedMap(raw, recordsFor(renameMap, s.file));
    if (body !== expected) {
      console.error(`ROUND-TRIP FAIL ${s.file}`);
      bad++;
    } else roundOK++;
    if (!parses(text).ok) {
      console.error(`PARSE FAIL src/${s.file}`);
      bad++;
    } else parsed++;
  }
  let prettyParsed = 0;
  for (const s of sources) {
    if (!s.sourceFile?.endsWith(".pretty.js")) continue;
    if (!parses(fs.readFileSync(path.join(proj, s.sourceFile), "utf8")).ok) {
      console.error(`PARSE FAIL ${s.sourceFile}`);
      bad++;
    } else prettyParsed++;
  }
  console.log(
    `derive: ${written.readable.size} readable file(s), ${written.src.size} src slices ` +
      `(${parsed}/${ranged} parse standalone, ${roundOK}/${ranged} round-trip byte-exact through the recorded rename map), ` +
      `${renamedSlices} renamed slice(s) (${renamedNameSet.size} name(s), ${renamedSplices} splice(s)), ` +
      `${skippedTotal} skipped, ${sections.filter((s) => s.wholeFile).length} wholeFile, ` +
      `${prettyParsed} pretty js parse clean, ${notRendered.length} notRendered, ${pruned} orphan(s) pruned — ` +
      `self-check ${bad ? bad + " FAILURE(S)" : "clean"}`,
  );
  if (bad) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
