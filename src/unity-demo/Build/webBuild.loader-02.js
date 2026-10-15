// unity-demo/Build/webBuild.loader 02 — metadata
// Lines 271-925 of readable/unity-demo/Build/webBuild.loader.pretty.js (statement-aligned).
  ((b.SystemInfo = (function () {
    var e,
      t,
      n,
      r,
      o,
      a = navigator.userAgent + " ",
      i = [
        ["Firefox", "Firefox"],
        ["OPR", "Opera"],
        ["Edg", "Edge"],
        ["SamsungBrowser", "Samsung Browser"],
        ["Trident", "Internet Explorer"],
        ["MSIE", "Internet Explorer"],
        ["Chrome", "Chrome"],
        ["CriOS", "Chrome on iOS Safari"],
        ["FxiOS", "Firefox on iOS Safari"],
        ["Safari", "Safari"],
      ];
    function s(e, t, n) {
      return (e = RegExp(e, "i").exec(t)) && e[n];
    }
    for (var l = 0; l < i.length; ++l)
      if ((t = s(i[l][0] + "[/ ](.*?)[ \\)]", a, 1))) {
        e = i[l][1];
        break;
      }
    ("Safari" == e && (t = s("Version/(.*?) ", a, 1)),
      "Internet Explorer" == e && (t = s("rv:(.*?)\\)? ", a, 1) || t));
    for (
      var c = [
          ["Windows (.*?)[;)]", "Windows"],
          ["Android ([0-9_.]+)", "Android"],
          ["iPhone OS ([0-9_.]+)", "iPhoneOS"],
          ["iPad.*? OS ([0-9_.]+)", "iPadOS"],
          ["FreeBSD( )", "FreeBSD"],
          ["OpenBSD( )", "OpenBSD"],
          ["Linux|X11()", "Linux"],
          ["Mac OS X ([0-9_\\.]+)", "MacOS"],
          ["bot|google|baidu|bing|msn|teoma|slurp|yandex", "Search Bot"],
        ],
        d = 0;
      d < c.length;
      ++d
    )
      if ((r = s(c[d][0], a, 1))) {
        ((n = c[d][1]), (r = r.replace(/_/g, ".")));
        break;
      }
    var u;
    function f() {
      try {
        return window.WebAssembly
          ? WebAssembly.validate(
              new Uint8Array([
                0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 5,
                3, 1, 0, 1, 10, 13, 1, 11, 0, 65, 0, 65, 0, 65, 1, 252, 11, 0,
                11,
              ]),
            )
            ? WebAssembly.validate(
                new Uint8Array([
                  0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0,
                  10, 11, 1, 9, 1, 1, 125, 32, 0, 252, 0, 26, 11,
                ]),
              )
              ? WebAssembly.validate(
                  new Uint8Array([
                    0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0,
                    10, 10, 1, 8, 1, 1, 126, 32, 0, 194, 26, 11,
                  ]),
                )
                ? WebAssembly.validate(
                    new Uint8Array([
                      0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1,
                      0, 10, 9, 1, 7, 0, 65, 0, 253, 15, 26, 11,
                    ]),
                  )
                  ? !!WebAssembly.validate(
                      new Uint8Array([
                        0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1,
                        0, 10, 10, 1, 8, 0, 6, 64, 1, 25, 1, 11, 11,
                      ]),
                    ) || "wasm-exceptions"
                  : "wasm-simd128"
                : "sign-extend"
              : "non-trapping fp-to-int"
            : "bulk-memory"
          : "WebAssembly";
      } catch (e) {
        return "Exception: " + e;
      }
    }
    ((r =
      {
        "NT 5.0": "2000",
        "NT 5.1": "XP",
        "NT 5.2": "Server 2003",
        "NT 6.0": "Vista",
        "NT 6.1": "7",
        "NT 6.2": "8",
        "NT 6.3": "8.1",
        "NT 10.0": "10",
      }[r] || r),
      (webgpuVersion = 0),
      (h = document.createElement("canvas")) &&
        ((u = (m = h.getContext("webgl2")) ? 2 : 0),
        m || ((m = h && h.getContext("webgl")) && (u = 1)),
        m &&
          (o =
            (m.getExtension("WEBGL_debug_renderer_info") &&
              m.getParameter(37446)) ||
            m.getParameter(7937))));
    var h = "undefined" != typeof SharedArrayBuffer,
      m =
        "object" == typeof WebAssembly &&
        "function" == typeof WebAssembly.compile,
      b = m && !0 === f();
    return {
      width: screen.width,
      height: screen.height,
      userAgent: a.trim(),
      browser: e || "Unknown browser",
      browserVersion: t || "Unknown version",
      mobile: /Mobile|Android|iP(ad|hone)/.test(navigator.appVersion),
      os: n || "Unknown OS",
      osVersion: r || "Unknown OS Version",
      gpu: o || "Unknown GPU",
      language: navigator.userLanguage || navigator.language,
      hasWebGL: u,
      hasWebGPU: webgpuVersion,
      hasCursorLock: !!document.body.requestPointerLock,
      hasFullscreen:
        !!document.body.requestFullscreen ||
        !!document.body.webkitRequestFullscreen,
      hasThreads: h,
      hasWasm: m,
      hasWasm2023: b,
      missingWasm2023Feature: b ? null : f(),
      hasWasmThreads: !1,
    };
  })()),
    (b.abortHandler = function (e) {
      return (x(e, "", 0), !0);
    }),
    (Error.stackTraceLimit = Math.max(Error.stackTraceLimit || 0, 50)),
    (b.readBodyWithProgress = function (a, i, s) {
      var e = a.body ? a.body.getReader() : void 0,
        l = void 0 !== a.headers.get("Content-Length"),
        c = (function (e, t) {
          if (!t) return 0;
          var t = e.headers.get("Content-Encoding"),
            n = parseInt(e.headers.get("Content-Length")),
            r = 536870912;
          switch (t) {
            case "br":
              return Math.min(Math.round(2 * n), r);
            case "gzip":
              return Math.min(Math.round(1.6 * n), r);
            default:
              return n;
          }
        })(a, l),
        d = new Uint8Array(c),
        u = [],
        f = 0,
        h = 0;
      return (
        l ||
          console.warn(
            "[UnityCache] Response is served without Content-Length header. Please reconfigure server to include valid Content-Length for better download performance.",
          ),
        (function o() {
          return void 0 === e
            ? a.arrayBuffer().then(function (e) {
                var t = new Uint8Array(e);
                return (
                  i({
                    type: "progress",
                    response: a,
                    total: e.length,
                    loaded: 0,
                    lengthComputable: l,
                    chunk: s ? t : null,
                  }),
                  t
                );
              })
            : e.read().then(function (e) {
                if (e.done) {
                  if (f === c) return d;
                  if (f < c) return d.slice(0, f);
                  for (
                    var t = new Uint8Array(f), n = (t.set(d, 0), h), r = 0;
                    r < u.length;
                    ++r
                  )
                    (t.set(u[r], n), (n += u[r].length));
                  return t;
                }
                return (
                  f + e.value.length <= d.length
                    ? (d.set(e.value, f), (h = f + e.value.length))
                    : u.push(e.value),
                  (f += e.value.length),
                  i({
                    type: "progress",
                    response: a,
                    total: Math.max(c, f),
                    loaded: f,
                    lengthComputable: l,
                    chunk: s ? e.value : null,
                  }),
                  o()
                );
              });
        })().then(function (e) {
          return (
            i({
              type: "load",
              response: a,
              total: e.length,
              loaded: e.length,
              lengthComputable: l,
              chunk: null,
            }),
            (a.parsedBody = e),
            a
          );
        })
      );
    }),
    (b.fetchWithProgress = function (e, t) {
      var n = function () {};
      return (
        t && t.onProgress && (n = t.onProgress),
        fetch(e, t).then(function (e) {
          return b.readBodyWithProgress(e, n, t.enableStreamingDownload);
        })
      );
    }),
    (b.UnityCache =
      ((f = { name: "UnityCache", version: 4 }),
      (h = { name: "RequestMetaDataStore", version: 1 }),
      (m = "RequestStore"),
      (p = "WebAssembly"),
      (g =
        window.indexedDB ||
        window.mozIndexedDB ||
        window.webkitIndexedDB ||
        window.msIndexedDB),
      (w = null),
      (E.getInstance = function () {
        return (w = w || new E());
      }),
      (E.destroyInstance = function () {
        return w
          ? w.close().then(function () {
              w = null;
            })
          : Promise.resolve();
      }),
      (E.prototype.clearCache = function () {
        var r = this;
        return this.isConnected
          .then(function () {
            return r.execute(h.name, "clear", []);
          })
          .then(function () {
            return r.cache.keys();
          })
          .then(function e(t) {
            var n;
            return 0 === t.length
              ? Promise.resolve()
              : ((n = t.pop()),
                r.cache.delete(n).then(function () {
                  return e(t);
                }));
          });
      }),
      (E.UnityCacheDatabase = f),
      (E.RequestMetaDataStore = h),
      (E.MaximumCacheSize = 1073741824),
      (E.prototype.loadRequest = function (e) {
        var t = this;
        return t.isConnected
          .then(function () {
            return Promise.all([t.cache.match(e), t.loadRequestMetaData(e)]);
          })
          .then(function (e) {
            if (void 0 !== e[0] && void 0 !== e[1])
              return { response: e[0], metaData: e[1] };
          });
      }),
      (E.prototype.loadRequestMetaData = function (e) {
        e = "string" == typeof e ? e : e.url;
        return this.execute(h.name, "get", [e]);
      }),
      (E.prototype.updateRequestMetaData = function (e) {
        return this.execute(h.name, "put", [e]);
      }),
      (E.prototype.storeRequest = function (e, t) {
        var n = this;
        return n.isConnected.then(function () {
          return n.cache.put(e, t);
        });
      }),
      (E.prototype.close = function () {
        return this.isConnected.then(
          function () {
            (this.database && (this.database.close(), (this.database = null)),
              this.cache && (this.cache = null));
          }.bind(this),
        );
      }),
      (E.prototype.connect = function () {
        var o = this;
        return void 0 === g
          ? Promise.reject(
              new Error(
                "Could not connect to cache: IndexedDB is not supported.",
              ),
            )
          : void 0 === window.caches
            ? Promise.reject(
                new Error(
                  "Could not connect to cache: Cache API is not supported.",
                ),
              )
            : new Promise(function (t, n) {
                try {
                  function r() {
                    o.openDBTimeout &&
                      (clearTimeout(o.openDBTimeout), (o.openDBTimeout = null));
                  }
                  o.openDBTimeout = setTimeout(function () {
                    void 0 === o.database &&
                      n(
                        new Error(
                          "Could not connect to cache: Database timeout.",
                        ),
                      );
                  }, 2e4);
                  var e = g.open(f.name, f.version);
                  ((e.onupgradeneeded = o.upgradeDatabase.bind(o)),
                    (e.onsuccess = function (e) {
                      (r(), (o.database = e.target.result), t());
                    }),
                    (e.onerror = function (e) {
                      (r(),
                        (o.database = null),
                        n(new Error("Could not connect to database.")));
                    }));
                } catch (e) {
                  (r(),
                    (o.database = null),
                    (o.cache = null),
                    n(
                      new Error(
                        "Could not connect to cache: Could not connect to database.",
                      ),
                    ));
                }
              })
                .then(function () {
                  var e = f.name + "_" + b.companyName + "_" + b.productName;
                  return caches.open(e);
                })
                .then(function (e) {
                  o.cache = e;
                });
      }),
      (E.prototype.upgradeDatabase = function (e) {
        var t,
          e = e.target.result;
        (e.objectStoreNames.contains(h.name) ||
          ((t = e.createObjectStore(h.name, { keyPath: "url" })),
          ["accessedAt", "updatedAt"].forEach(function (e) {
            t.createIndex(e, e);
          })),
          e.objectStoreNames.contains(m) && e.deleteObjectStore(m),
          e.objectStoreNames.contains(p) && e.deleteObjectStore(p));
      }),
      (E.prototype.execute = function (a, i, s) {
        return this.isConnected.then(
          function () {
            return new Promise(
              function (t, n) {
                try {
                  var e, r, o;
                  null === this.database
                    ? n(new Error("indexedDB access denied"))
                    : ((e =
                        -1 != ["put", "delete", "clear"].indexOf(i)
                          ? "readwrite"
                          : "readonly"),
                      (r = this.database.transaction([a], e).objectStore(a)),
                      "openKeyCursor" == i &&
                        ((r = r.index(s[0])), (s = s.slice(1))),
                      ((o = r[i].apply(r, s)).onsuccess = function (e) {
                        t(e.target.result);
                      }),
                      (o.onerror = function (e) {
                        n(e);
                      }));
                } catch (e) {
                  n(e);
                }
              }.bind(this),
            );
          }.bind(this),
        );
      }),
      (E.prototype.getMetaDataEntries = function () {
        var r = this,
          o = 0,
          a = [];
        return new Promise(function (t, n) {
          var e = r.database
            .transaction([h.name], "readonly")
            .objectStore(h.name)
            .openCursor();
          ((e.onsuccess = function (e) {
            e = e.target.result;
            e
              ? ((o += e.value.size), a.push(e.value), e.continue())
              : t({ metaDataEntries: a, cacheSize: o });
          }),
            (e.onerror = function (e) {
              n(e);
            }));
        });
      }),
      (E.prototype.cleanUpCache = function () {
        var i = this;
        return this.getMetaDataEntries().then(function (e) {
          for (
            var t = e.metaDataEntries, n = e.cacheSize, r = [], o = [], a = 0;
            a < t.length;
            ++a
          )
            t[a].version == b.productVersion
              ? o.push(t[a])
              : (r.push(t[a]), (n -= t[a].size));
          o.sort(function (e, t) {
            return e.accessedAt - t.accessedAt;
          });
          for (a = 0; a < o.length && !(n < E.MaximumCacheSize); ++a)
            (r.push(o[a]), (n -= o[a].size));
          return (function e() {
            var t;
            return 0 === r.length
              ? Promise.resolve()
              : ((t = r.pop()),
                i.cache
                  .delete(t.url)
                  .then(function (e) {
                    if (e)
                      return (
                        (r = t.url),
                        new Promise(function (e, t) {
                          var n = i.database.transaction([h.name], "readwrite");
                          (n.objectStore(h.name).delete(r),
                            (n.oncomplete = e),
                            (n.onerror = t));
                        })
                      );
                    var r;
                  })
                  .then(e));
          })();
        });
      }),
      E)),
    (b.cachedFetch =
      ((v = b.UnityCache),
      (y = b.fetchWithProgress),
      (k = b.readBodyWithProgress),
      function (o, a) {
        var e,
          t,
          i = v.getInstance(),
          s = U("string" == typeof o ? o : o.url),
          l = {
            enabled:
              ((e = s),
              (!(t = a) || !t.method || "GET" === t.method) &&
                (!t ||
                  -1 != ["must-revalidate", "immutable"].indexOf(t.control)) &&
                !!e.match("^https?://")),
          };
        function c(n, r) {
          return fetch(n, r).then(function (e) {
            var t;
            return !l.enabled || l.revalidated
              ? e
              : 304 === e.status
                ? ((l.revalidated = !0),
                  i
                    .updateRequestMetaData(l.metaData)
                    .then(function () {
                      C(
                        "'" +
                          l.metaData.url +
                          "' successfully revalidated and served from the browser cache",
                      );
                    })
                    .catch(function (e) {
                      C(
                        "'" +
                          l.metaData.url +
                          "' successfully revalidated but not stored in the browser cache due to the error: " +
                          e,
                      );
                    }),
                  k(l.response, r.onProgress, r.enableStreamingDownload))
                : 200 == e.status
                  ? ((l.response = e),
                    (l.metaData.updatedAt = l.metaData.accessedAt),
                    (l.revalidated = !0),
                    (t = e.clone()),
                    k(e, r.onProgress, r.enableStreamingDownload).then(
                      function (e) {
                        return (
                          (l.metaData.size = e.parsedBody.length),
                          Promise.all([
                            i.storeRequest(n, t),
                            i.updateRequestMetaData(l.metaData),
                          ])
                            .then(function () {
                              C(
                                "'" +
                                  s +
                                  "' successfully downloaded and stored in the browser cache",
                              );
                            })
                            .catch(function (e) {
                              C(
                                "'" +
                                  s +
                                  "' successfully downloaded but not stored in the browser cache due to the error: " +
                                  e,
                              );
                            }),
                          e
                        );
                      },
                    ))
                  : (C(
                      "'" +
                        s +
                        "' request failed with status: " +
                        e.status +
                        " " +
                        e.statusText,
                    ),
                    k(e, r.onProgress, r.enableStreamingDownload));
          });
        }
        return (
          a &&
            ((l.control = a.control),
            (l.companyName = a.companyName),
            (l.productName = a.productName),
            (l.productVersion = a.productVersion)),
          (l.revalidated = !1),
          (l.metaData = {
            url: s,
            accessedAt: Date.now(),
            version: l.productVersion,
          }),
          (l.response = null),
          l.enabled
            ? i
                .loadRequest(s)
                .then(function (e) {
                  var n, r, t;
                  return e
                    ? ((n = e.response),
                      (r = e.metaData),
                      (l.response = n),
                      (l.metaData.size = r.size),
                      (l.metaData.updatedAt = r.updatedAt),
                      "immutable" == l.control
                        ? ((l.revalidated = !0),
                          i.updateRequestMetaData(r).then(function () {
                            C(
                              "'" +
                                l.metaData.url +
                                "' served from the browser cache without revalidation",
                            );
                          }),
                          k(n, a.onProgress, a.enableStreamingDownload))
                        : ((e = s),
                          ((t =
                            window.location.href.match(/^[a-z]+:\/\/[^\/]+/)) &&
                            !e.lastIndexOf(t[0], 0)) ||
                          (!n.headers.get("Last-Modified") &&
                            !n.headers.get("ETag"))
                            ? ((e = (a = a || {}).headers || {}),
                              (a.headers = e),
                              n.headers.get("Last-Modified")
                                ? ((e["If-Modified-Since"] =
                                    n.headers.get("Last-Modified")),
                                  (e["Cache-Control"] = "no-cache"))
                                : n.headers.get("ETag") &&
                                  ((e["If-None-Match"] = n.headers.get("ETag")),
                                  (e["Cache-Control"] = "no-cache")),
                              c(o, a))
                            : fetch(s, { method: "HEAD" }).then(function (t) {
                                return (
                                  (l.revalidated = [
                                    "Last-Modified",
                                    "ETag",
                                  ].every(function (e) {
                                    return (
                                      !n.headers.get(e) ||
                                      n.headers.get(e) == t.headers.get(e)
                                    );
                                  })),
                                  l.revalidated
                                    ? (i
                                        .updateRequestMetaData(r)
                                        .then(function () {
                                          C(
                                            "'" +
                                              l.metaData.url +
                                              "' successfully revalidated and served from the browser cache",
                                          );
                                        }),
                                      k(
                                        l.response,
                                        a.onProgress,
                                        a.enableStreamingDownload,
                                      ))
                                    : c(o, a)
                                );
                              })))
                    : c(o, a);
                })
                .catch(function (e) {
                  return (
                    C(
                      "Failed to load '" +
                        l.metaData.url +
                        "' from browser cache due to the error: " +
                        e,
                    ),
                    y(o, a)
                  );
                })
            : y(o, a)
        );
      })));
