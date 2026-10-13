// serve.mjs — minimal static preview server for this mirror. No dependencies.
//
// usage: node tools/serve.mjs [root] [port]
//
// Why this exists (the one thing a plain server must get right): the Unity
// payloads under unity-demo/Build/*.unityweb are stored EXACTLY as served —
// gzip streams carrying Unity's "UnityWeb Compressed Content (gzip)" framing.
// The origin sends NO Content-Encoding for them (the Unity loader inflates
// them in JavaScript at runtime), so this server must not add one either.
// It serves every file byte-exact, maps directory URLs to index.html and
// extension-less paths (the /web-demo route) to their directory index.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(process.argv[2] || ".");
const port = Number(process.argv[3] || 5173);
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  // Unity payloads / data: byte-exact, no Content-Encoding (see header).
  ".unityweb": "application/octet-stream",
  ".wasm": "application/wasm",
};

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  let file = path.join(root, url);
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  // route form: /web-demo -> web-demo/index.html (the origin serves the bare route)
  if (!fs.existsSync(file) && !path.extname(url) && fs.existsSync(file + ".html")) file = file + ".html";
  if (!fs.existsSync(file) && !path.extname(url) && fs.existsSync(path.join(root, url, "index.html")))
    file = path.join(root, url, "index.html");
  if (!fs.existsSync(file)) {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("404 " + url);
    console.log("404", url);
    return;
  }
  const type = TYPES[path.extname(file).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;
  const size = fs.statSync(file).size;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (m && (m[1] || m[2])) {
      const start = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
      const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
      if (start <= end && start < size) {
        res.writeHead(206, {
          "content-type": type,
          "content-range": `bytes ${start}-${end}/${size}`,
          "accept-ranges": "bytes",
          "content-length": end - start + 1,
        });
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }
      res.writeHead(416, { "content-range": `bytes */${size}` });
      res.end();
      return;
    }
  }
  res.writeHead(200, { "content-type": type, "content-length": size, "cache-control": "no-store", "accept-ranges": "bytes" });
  fs.createReadStream(file).pipe(res);
});

server.listen(port, "127.0.0.1", () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
