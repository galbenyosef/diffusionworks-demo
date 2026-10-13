// unity-demo__Build__webBuild.loader 01 — console
// Lines 2-270 of readable/unity-demo__Build__webBuild.loader.pretty.js (statement-aligned).
  function c(e, t) {
    if (!c.aborted && n.showBanner)
      return ("error" == t && (c.aborted = !0), n.showBanner(e, t));
    switch (t) {
      case "error":
        console.error(e);
        break;
      case "warning":
        console.warn(e);
        break;
      default:
        console.log(e);
    }
  }
  function r(e) {
    var t = e.reason || e.error,
      n = t ? t.toString() : e.message || e.reason || "",
      r = t && t.stack ? t.stack.toString() : "";
    (n += "\n" + (r = r.startsWith(n) ? r.substring(n.length) : r).trim()) &&
      b.stackTraceRegExp &&
      b.stackTraceRegExp.test(n) &&
      x(
        n,
        e.filename || (t && (t.fileName || t.sourceURL)) || "",
        e.lineno || (t && (t.lineNumber || t.line)) || 0,
      );
  }
  function e(e, t, n) {
    var r = e[t];
    (void 0 !== r && r) ||
      (console.warn(
        'Config option "' +
          t +
          '" is missing or empty. Falling back to default value: "' +
          n +
          '". Consider updating your WebGL template to include the missing config option.',
      ),
      (e[t] = n));
  }
  l = l || function () {};
  var o,
    b = {
      canvas: t,
      webglContextAttributes: { preserveDrawingBuffer: !1, powerPreference: 2 },
      wasmFileSize: 34101210,
      cacheControl: function (e) {
        return e == b.dataUrl || e.match(/\.bundle/)
          ? "must-revalidate"
          : "no-store";
      },
      streamingAssetsUrl: "StreamingAssets",
      downloadProgress: {},
      deinitializers: [],
      intervals: {},
      setInterval: function (e, t) {
        e = window.setInterval(e, t);
        return ((this.intervals[e] = !0), e);
      },
      clearInterval: function (e) {
        (delete this.intervals[e], window.clearInterval(e));
      },
      preRun: [],
      postRun: [],
      print: function (e) {
        console.log(e);
      },
      printErr: function (e) {
        (console.error(e),
          "string" == typeof e &&
            -1 != e.indexOf("wasm streaming compile failed") &&
            (-1 != e.toLowerCase().indexOf("mime")
              ? c(
                  'HTTP Response Header "Content-Type" configured incorrectly on the server for file ' +
                    b.codeUrl +
                    ' , should be "application/wasm". Startup time performance will suffer.',
                  "warning",
                )
              : c(
                  'WebAssembly streaming compilation failed! This can happen for example if "Content-Encoding" HTTP header is incorrectly enabled on the server for file ' +
                    b.codeUrl +
                    ", but the file is not pre-compressed on disk (or vice versa). Check the Network tab in browser Devtools to debug server header configuration.",
                  "warning",
                )));
      },
      locateFile: function (e) {
        return e;
      },
      disabledCanvasEvents: ["contextmenu", "dragstart"],
    };
  for (o in (e(n, "companyName", "Unity"),
  e(n, "productName", "WebGL Player"),
  e(n, "productVersion", "1.0"),
  n))
    b[o] = n[o];
  b.streamingAssetsUrl = new URL(b.streamingAssetsUrl, document.URL).href;
  var a = b.disabledCanvasEvents.slice();
  function i(e) {
    e.preventDefault();
  }
  (a.forEach(function (e) {
    t.addEventListener(e, i);
  }),
    window.addEventListener("error", r),
    window.addEventListener("unhandledrejection", r));
  var s = "",
    d = "";
  function u(e) {
    document.webkitCurrentFullScreenElement === t
      ? t.style.width &&
        ((s = t.style.width),
        (d = t.style.height),
        (t.style.width = "100%"),
        (t.style.height = "100%"))
      : s && ((t.style.width = s), (t.style.height = d), (d = s = ""));
  }
  (document.addEventListener("webkitfullscreenchange", u),
    b.deinitializers.push(function () {
      for (var e in (b.disableAccessToMediaDevices(),
      a.forEach(function (e) {
        t.removeEventListener(e, i);
      }),
      window.removeEventListener("error", r),
      window.removeEventListener("unhandledrejection", r),
      document.removeEventListener("webkitfullscreenchange", u),
      b.intervals))
        window.clearInterval(e);
      b.intervals = {};
    }),
    (b.QuitCleanup = function () {
      for (var e = 0; e < b.deinitializers.length; e++) b.deinitializers[e]();
      ((b.deinitializers = []), "function" == typeof b.onQuit && b.onQuit());
    }));
  var f,
    h,
    m,
    p,
    g,
    w,
    v,
    y,
    k,
    _ = {
      Module: b,
      SetFullscreen: function () {
        if (b.SetFullscreen) return b.SetFullscreen.apply(b, arguments);
        b.print("Failed to set Fullscreen mode: Player not loaded yet.");
      },
      SendMessage: function () {
        if (b.SendMessage) return b.SendMessage.apply(b, arguments);
        b.print("Failed to execute SendMessage: Player not loaded yet.");
      },
      Quit: function () {
        return new Promise(function (e, t) {
          ((b.shouldQuit = !0), (b.onQuit = e));
        });
      },
      GetMetricsInfo: function () {
        var e = Number(b._getMetricsInfo()) >>> 0,
          t = 4 + e,
          n = 4 + t,
          r = 8 + n,
          o = 8 + r,
          a = 4 + o,
          i = 4 + a,
          s = 8 + i,
          l = 8 + s,
          c = 4 + l,
          d = 4 + c,
          u = 4 + d;
        return {
          totalWASMHeapSize: b.HEAPU32[e >> 2],
          usedWASMHeapSize: b.HEAPU32[t >> 2],
          totalJSHeapSize: b.HEAPF64[n >> 3],
          usedJSHeapSize: b.HEAPF64[r >> 3],
          pageLoadTime: b.HEAPU32[o >> 2],
          pageLoadTimeToFrame1: b.HEAPU32[a >> 2],
          fps: b.HEAPF64[i >> 3],
          movingAverageFps: b.HEAPF64[s >> 3],
          assetLoadTime: b.HEAPU32[l >> 2],
          webAssemblyStartupTime:
            b.HEAPU32[c >> 2] - (b.webAssemblyTimeStart || 0),
          codeDownloadTime: b.HEAPU32[d >> 2],
          gameStartupTime: b.HEAPU32[u >> 2],
          numJankedFrames: b.HEAPU32[(4 + u) >> 2],
        };
      },
    };
  function x(e, t, n) {
    -1 == e.indexOf("fullscreen error") &&
      (b.startupErrorHandler
        ? b.startupErrorHandler(e, t, n)
        : (b.errorHandler && b.errorHandler(e, t, n)) ||
          (console.log("Invoking error handler due to\n" + e),
          "function" == typeof dump &&
            dump("Invoking error handler due to\n" + e),
          x.didShowErrorMessage ||
            (-1 !=
            (e =
              "An error occurred running the Unity content on this page. See your browser JavaScript console for more info. The error was:\n" +
              e).indexOf("DISABLE_EXCEPTION_CATCHING")
              ? (e =
                  "An exception has occurred, but exception handling has been disabled in this build. If you are the developer of this content, enable exceptions in your project WebGL player settings to be able to catch the exception or see the stack trace.")
              : -1 != e.indexOf("Cannot enlarge memory arrays")
                ? (e =
                    "Out of memory. If you are the developer of this content, try allocating more memory to your WebGL build in the WebGL player settings.")
                : (-1 == e.indexOf("Invalid array buffer length") &&
                    -1 == e.indexOf("Invalid typed array length") &&
                    -1 == e.indexOf("out of memory") &&
                    -1 == e.indexOf("could not allocate memory")) ||
                  (e =
                    "The browser could not allocate enough memory for the WebGL content. If you are the developer of this content, try allocating less memory to your WebGL build in the WebGL player settings."),
            alert(e),
            (x.didShowErrorMessage = !0))));
  }
  function S(e, t) {
    if ("symbolsUrl" != e) {
      var n = b.downloadProgress[e],
        r =
          ((n =
            n ||
            (b.downloadProgress[e] = {
              started: !1,
              finished: !1,
              lengthComputable: !1,
              total: 0,
              loaded: 0,
            })),
          "object" != typeof t ||
            ("progress" != t.type && "load" != t.type) ||
            (n.started ||
              ((n.started = !0), (n.lengthComputable = t.lengthComputable)),
            (n.total = t.total),
            (n.loaded = t.loaded),
            "load" == t.type && (n.finished = !0)),
          0),
        o = 0,
        a = 0,
        i = 0,
        s = 0;
      for (e in b.downloadProgress) {
        if (!(n = b.downloadProgress[e]).started) return;
        (a++,
          n.lengthComputable
            ? ((r += n.loaded), (o += n.total), i++)
            : n.finished || s++);
      }
      l(0.9 * (a ? (a - s - (o ? (i * (o - r)) / o : 0)) / a : 0));
    }
  }
  function E() {
    var e = this;
    ((this.isConnected = this.connect().then(function () {
      return e.cleanUpCache();
    })),
      this.isConnected.catch(function (e) {
        ((e = "Error when initializing cache: " + e),
          console.log("[UnityCache] " + e));
      }));
  }
  function C(e) {
    console.log("[UnityCache] " + e);
  }
  function U(e) {
    return (
      (U.link = U.link || document.createElement("a")),
      (U.link.href = e),
      U.link.href
    );
  }
