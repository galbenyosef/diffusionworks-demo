# ULTIMATE WATER 2D WEB DEMO — offline mirror

Full mirror of the **Ultimate Water 2D web demo** (https://diffusionworks.com/web-demo).

Source: https://diffusionworks.com/web-demo

![ULTIMATE WATER 2D WEB DEMO](docs/cover.png)

## Stack

- **Unity WebGL demo (IL2CPP)** — the demo itself is a Unity WebGL build served at
  `/unity-demo/`: `Build/webBuild.loader.js` (the Unity loader: progress, in-JS gzip
  inflate, `createUnityInstance`), `Build/webBuild.framework.js.unityweb` (the
  Unity/emscripten engine framework, 78 KB compressed), `Build/webBuild.wasm.unityweb`
  (10.4 MB) and `Build/webBuild.data.unityweb` (24.5 MB). The data payload is a
  `UnityWebData1.0` archive: `data.unity3d` (25.8 MB, the compiled scenes/assets),
  `Il2CppData/Metadata/global-metadata.dat` (9.1 MB), `Resources/unity default
  resources`, `RuntimeInitializeOnLoads.json`, `ScriptingAssemblies.json` and
  `boot.config` (build-guid `754943ef158f467daa3c668f0ed8593a`). The build's own
  assemblies name the product: **`DiffusionWorks.UltimateWaterSystem2D.dll`**
  (namespace `DW_UWS2D`: `WaterPhysics`, `WaterSurfaceRegistry`, …) plus
  `Assembly-CSharp.dll` (the demo scene scripts).
- **Gzip UnityWeb payloads, NO Content-Encoding** — the three `.unityweb` files are
  gzip streams carrying Unity's `UnityWeb Compressed Content (gzip)` framing and are
  served exactly like that; the Unity loader inflates them in JavaScript at runtime.
  A static server must serve them byte-exact and must not add a `Content-Encoding`
  (that is why this mirror ships its own preview `tools/serve.mjs`).
- **Nuxt 3 product-site shell for the one route** — the demo page is a Nuxt/Vite
  SSR route: an importmap (`#entry` → `/_nuxt/l-4XETKm.js`), six boot chunks
  (entry + modulepreload closure), `entry.BnxCdEeO.css`, Inter woff2 subsets, and an
  `<iframe src="/unity-demo/index.html">` that carries the demo. The shell only
  frames the demo; the game is entirely the Unity build.
- **Hostinger hcdn front** — content-negotiates WebP for images (browsers get
  `.webp` variants of the TemplateData PNGs) and br for transfer; the stored
  resource bytes are stable and are what this capture holds.

## What this is

Ultimate Water 2D (diffusionworks.com/web-demo) — "Play the Ultimate Water 2D
interactive Unity WebGL demo in your browser": a side-view 2D lake running the
DiffusionWorks water system — a character walks and jumps (WASD, J), boats and a
floating platform ride the surface (buoyancy), and the waterline is rendered as a
cross-section with ripples, reflections and underwater light shafts. The in-game
hints name the demo's pieces ("Use WASD to move / press J to Jump", "Floating
platform / Use FloatingPlatform2D Script").

**Scope — the demo's closure only.** The URL is one route of a closed product site
(marketing pages live at `/`, `/docs`, `/support`, `/privacy`); the mirror captures
exactly what the demo page needs to boot plus the Unity build it embeds, and nothing
else. The boundary is network-log-proven: while `/web-demo` boots and the demo runs,
the page requests only the six shell chunks, the CSS, one font file, its own images
and the whole `/unity-demo/` tree. The entry's `__vite__mapDeps` route table names
the five booted chunks plus eight further lazy chunks (`ScEKgHkK`, `D0CFReFO`,
`CZKwawUT`, `Bug7AP2i`, `Cy5Lpvs9`, `Cc91Ut1X`, `CFXZFARg`, `BQY1bykr`); **none of
the lazy eight is ever requested while the demo page boots** — they are other site
routes' payloads and are deliberately not captured (product-site scope).

Captured whole: **34 files, 38,479,123 bytes** (~36.7 MiB) — the Nuxt shell closure
for the route (entry document kept at `web-demo/index.html`), the page's images and
fonts, and the Unity demo (`/unity-demo/`: index document, TemplateData, loader and
the three `.unityweb` payloads). The page's own note says the first load is
"approximately 34 MB", which matches the four `Build/` files (35.1 MB).

External at runtime: **none** — every request the demo makes is first-party; the
network log contains no third-party host (two `blob:` URLs are the loader handing
the decompressed framework to Unity and are internal). Because everything is
first-party, an offline static server reproduces the demo exactly.

Genuine 404s (probed 2026-10-13, documented gaps): `unity-demo/StreamingAssets`
(the build declares `streamingAssetsUrl` but ships no StreamingAssets tree),
`unity-demo/Build/webBuild.loader.js.map`, `unity-demo/Build/webBuild.data` (the
payload exists only in `.unityweb` form), `web-demo/_payload.json` (SSR data is
inlined; not used), and `web-demo/index.html` — the route is served bare at
`/web-demo`, so the filename 404s by design; the mirror stores the document at
`web-demo/index.html` so a static server with directory indexes lands on it.

## Layout

- `web-demo/index.html` — the entry document, byte-exact as served at `/web-demo`
- `_nuxt/` — the shell closure: entry chunk (`l-4XETKm.js`), the modulepreload
  chunks (`A3EUxX58`, `Buq_OoVt`, `bBm2T0bl`, `c0TEtrJJ`), the route chunk
  (`B9hgXP_e.js`), `entry.BnxCdEeO.css`, the seven Inter woff2 subsets,
  `builds/latest.json` and `builds/meta/<buildId>.json`
- `images/`, `brand/`, `favicon.png`, `favicon.ico`, `asset-store/` — the page
  imagery (hero, logo, icons, the demo's social card)
- `unity-demo/` — the demo as served: `index.html`, `TemplateData/` (stylesheet,
  favicon, Unity template images) and `Build/` (loader + three `.unityweb` payloads)
- `.upstream/manifest.json` — sha256 for every captured file (Gen-A)
- `readable/` — prettified derived layer (pinned prettier 3.9.6): the six shell
  chunks, the Unity loader, the Unity framework (gunzipped in memory, never stored
  decompressed), both stylesheets and the three inline twin blocks
- `src/` + `split-spec.json` — 5 statement-aligned slices of the demo glue (the
  Unity loader's function body and the `/web-demo` route component) with the
  recorded derivation spec
- `tools/derive.mjs` — rebuild `readable/` + `src/` + `split-spec.json`
- `tools/audit.js` — integrity gate for the derived layers (`AUDIT PASS`)
- `tools/serve.mjs` — dependency-free preview server (byte-exact, no added
  Content-Encoding; maps `/web-demo` to its directory index)
- `tools/update.mjs` — read-only drift probe against the live origin
- `tools/verify.mjs` — re-hash the capture against the manifest
- `docs/cover.png` — cover (gameplay: the water sim mid-interaction — surface
  ripples around the float, the platform riding the waterline),
  `docs/boot-2026-10-13.png` — boot evidence (the mirror serving `/web-demo/`,
  demo rendered in the iframe), `docs/network-log-2026-10-13.jsonl` — the raw
  browser network log (the runtime-closure record)

## Assets

- **payloads (Unity builds)** — `unity-demo/Build/`: `webBuild.data.unityweb`
  (24.5 MB; inner `data.unity3d` scenes/assets + `global-metadata.dat` IL2CPP
  metadata + default resources), `webBuild.wasm.unityweb` (10.4 MB);
  `webBuild.loader.js` and `webBuild.framework.js.unityweb` are the loader and
  engine framework
- **images** — 11 file(s): `images/ultimate-water-hero.png` (the page hero),
  `brand/diffusionworks-logo-dark-v4.png`, `favicon.png`, `favicon.ico`,
  `asset-store/ultimate-water-2d-social-1200x630.png` (social card), and the Unity
  template set `unity-demo/TemplateData/` (`unity-logo-dark.png`,
  `progress-bar-empty-dark.png`, `progress-bar-full-dark.png`,
  `unity-logo-title-footer.png`, `fullscreen-button.png`, `favicon.ico`)
- **fonts** — 7 file(s): `_nuxt/` (Inter woff2 subsets: latin, latin-ext,
  cyrillic, cyrillic-ext, greek, greek-ext, vietnamese — the CSS references all
  seven; browsers fetch only the ranges a page needs)
- **audio, models, data** — none as files: the demo's meshes, textures, sounds and
  scenes are compiled inside `webBuild.data.unityweb` (the payload is the asset
  container); the only other data files are the two Nuxt build JSONs under `_nuxt/builds/`
- **stylesheets** — 2 file(s): `_nuxt/entry.BnxCdEeO.css`,
  `unity-demo/TemplateData/style.css`

## Run

Serve this repo root with the mirror's own server and open the demo route:

```
node tools/serve.mjs . 5173
```

then open `http://127.0.0.1:5173/web-demo/` — the `/web-demo` route as the origin
serves it (the demo itself is also directly reachable at
`http://127.0.0.1:5173/unity-demo/index.html`). The sub-paths matter: the shell's
imports are root-absolute (`/_nuxt/…`) and the iframe points at `/unity-demo/…`,
so serve from the repo root.

**Use a server that does not add `Content-Encoding` for the `.unityweb` files.**
They are stored exactly as served — gzip streams that Unity's loader inflates in
JavaScript. `tools/serve.mjs` is byte-exact by design; a server that force-adds
`Content-Encoding: gzip` to those paths would hand Unity pre-decoded bytes and the
build would not start. Plain static servers (`npx serve .`) leave unknown
extensions alone and work too.

## Verify

```
node tools/verify.mjs     # re-hash the capture against the manifest (34 files)
node tools/audit.js       # derived-layer integrity gate (AUDIT PASS)
```

## Updating from upstream

```
node tools/update.mjs     # read-only drift probe: what changed upstream
```

The probe never rewrites the capture — a mirror is a point-in-time snapshot.
Route caveats it handles: the entry is a bare route (`/web-demo`), so the
`index.html` filename is never probed upstream; `/web-demo/index.html` 404s by
design. No other normalization beyond the fleet's rotating-uuid rule is needed —
the origin's resource bytes are identical across Accept-Encoding variants (hcdn
adds a br/gzip transfer layer that clients strip). Refreshing means re-running the
fetch into a clean tree and re-cutting the derived layers on top of the new capture
(`node tools/derive.mjs`, then `node tools/audit.js`).

### 2026-10-13 derivation note

Both derived layers are in place, cut from the recorded capture (capture bytes
untouched — `node tools/verify.mjs` re-hashes all 34 files):

- `readable/` — pinned prettier 3.9.6 (module API, default options, single pass
  verified idempotent — never the CLI, it respects `.gitignore` and can silently
  echo its input) rendered the six Nuxt boot chunks and the Unity loader to
  `*.pretty.js`, the two stylesheets to `*.pretty.css`, and the entry documents'
  inline blocks to twins (`web-demo__index-inline-1.pretty.json` — the importmap,
  `web-demo__index-inline-2.pretty.js` — the `__NUXT__` boot script,
  `unity-demo__index-inline-1.pretty.js` — the Unity template boot script); the
  typed Nuxt data block is recorded as inline-data in `split-spec.json`
  `notRendered` (range + sha256), not rendered. The **Unity framework**
  (`webBuild.framework.js.unityweb`) is a gzip stream as served: it is
  decompressed **in memory only** (never stored decompressed) and prettified to
  `readable/unity-demo__Build__webBuild.framework.js.pretty.js` (15,200 lines) —
  this is the file to read when the demo will not start. Every pretty is provably
  not a byte copy of its capture source and re-renders byte-exact under the pinned
  version (13/13).
- `src/` — 5 statement-aligned slices (`src/<tag>-NN.js`, exact 2-line provenance
  header) of the demo's own glue, in two files: the Unity loader
  (`unity-demo__Build__webBuild.loader.js`, 2,920 readable lines) and the
  `/web-demo` route component (`_nuxt__B9hgXP_e.js`, 139 lines). The loader is a
  **single top-level function declaration** (`createUnityInstance`) covering the
  whole file, so its slices descend one level into that function body and cut at
  ITS top-level statement boundaries — recorded as `slicingContext` in
  `split-spec.json`; the wrapper head line, the final body-level `return` (a bare
  return is illegal outside a function) and the closing brace are index-only
  skipped sections. 5/5 slices parse standalone
  (`node --input-type=module --check -`) and round-trip byte-exact to their
  readable line ranges. Windows target ~250-350 lines; the loader's giant inline
  statement (655 lines) and module registry (1,689 lines) stay whole as oversized
  declarations.
- Site-shell machinery rule — wholeFile sections, never sliced: the five Nuxt
  site-shell chunks (`l-4XETKm` entry boot with the `__vite__mapDeps` route table,
  `A3EUxX58` vendor bundle, `Buq_OoVt`, `bBm2T0bl`, `c0TEtrJJ`) and the Unity
  framework region, each content-guarded. Vendor payload rule — `notRendered` with
  bytes + sha256: the two `.unityweb` payloads (verified to carry the UnityWeb gzip
  framing), the 7 fonts, 9 images/icos and the two build JSONs (24 records).
- Import rule — `src/` keeps the served chunk names verbatim: the route slice's
  `./A3EUxX58.js` resolves inside the capture and its named imports are exported by
  that chunk; `#entry` is an import-map alias and is resolved through the captured
  importmap block to `_nuxt/l-4XETKm.js` (2/2 imports resolve).
- Gates: `node tools/verify.mjs` → `34 files checked, 0 problems`;
  `node tools/update.mjs` → `up to date: 34 captured files identical upstream`;
  `node tools/audit.js` → `AUDIT PASS` (5/5 statement-aligned round-trips byte-exact,
  13/13 pretties re-render byte-exact, 3 inline twins + 1 inline-data block verified,
  23 notRendered records byte-verified, capture manifest free of derived layers).
  Serve probe — repo root served on loopback, `/web-demo/` (entry, 3,939 B),
  `/unity-demo/index.html` (5,777 B), the loader, the `.unityweb` payloads (gzip
  magic verified over HTTP), a shell chunk and the hero image all HTTP 200; the demo
  ran offline in the browser and the offline session logged 0 404s; listener killed,
  port closed (netstat + refused connect). Rebuild with `node tools/derive.mjs`.
- §0.4 fork-over-mirror checked 2026-10-13: the demo has **no public upstream
  repo** — no github/gitlab link exists anywhere in the captured page or JS, the
  site's `/`, `/docs` and `/support` pages link none either, and a GitHub search
  finds no DiffusionWorks source repo (only this mirror, plus an unrelated
  semiconductor-terminology project that shares the name). The product site
  publishes deployments, not sources, so the mirror stands.
- Network-log-led closure: the runtime graph was recorded from a full browser
  session (`network --all --follow`) through load and gameplay — every request is
  first-party (the six shell chunks, CSS, one Inter woff2, the page images, the
  whole `/unity-demo/` tree, the Nuxt build meta). A static scan of the captured
  files (script/link refs, `url()` refs, `from`/`import()`/`__vite__mapDeps`
  tables, path literals) then caught the remaining referenced-but-missing files
  (the six further Inter subsets the CSS names, `builds/latest.json`, the
  `#entry` importmap target, `/favicon.ico`) which were fetched to fixpoint; the
  only deliberately unfetched references are the seven lazy route chunks of other
  site routes (documented above).
- Identifier note — src/ keeps the bundles' own minified names; the rename
  campaign (PLAN §5) is recorded here as an **open task**, not claimed.

## Mirror conventions

- **Capture layer** — the captured files are byte-exact copies of what the
  origin served; nothing in them is edited. The `.unityweb` payloads stay gzip
  streams (UnityWeb framing) exactly as served.
- **Readable layer** — `readable/` is derived (prettified) and never shipped to
  a browser; it exists so the bundles, the loader and the Unity framework can
  actually be read. Nothing is decompressed on disk beyond that layer.
- **Provenance** — `.upstream/manifest.json` records sha256 for each captured
  artifact, and `tools/verify.mjs` re-checks it.
- **Drift** — `tools/update.mjs` is read-only: it reports what changed upstream
  and never rewrites the capture.

## Fleet status

<!-- mirror-status:start — feeds _standard/REPO-INDEX.md. Update ONLY your own mirror's block; never edit the shared index (PLAN §8). Rebuild: node _standard/build-index.mjs -->
<!-- cols: cls=classification · ver=verify 0 problems · upd=drift probe · man=manifest · rdbl=readable re-derived · src=reversed src · boot=boot test · top=offline-mirror topic · tag=backup tag · staged=staged not committed -->
| # | repo | cls | ver | upd | man | rdbl | src | boot | top | tag | staged |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 0 | diffusionworks-demo | mirror | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
<!-- mirror-status:end -->
