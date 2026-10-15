// unity-demo__Build__webBuild.loader 04 — worker
// Lines 2615-2883 of readable/unity-demo__Build__webBuild.loader.pretty.js (statement-aligned).
  function T(t) {
    S(t);
    var e = b.cacheControl(b[t]),
      n = b.companyName && b.productName ? b.cachedFetch : b.fetchWithProgress,
      r = b[t],
      o = /file:\/\//.exec(r) ? "same-origin" : void 0;
    return n(b[t], {
      method: "GET",
      companyName: b.companyName,
      productName: b.productName,
      productVersion: b.productVersion,
      control: e,
      mode: o,
      onProgress: function (e) {
        S(t, e);
      },
    })
      .then(function (e) {
        return (
          (i = e.parsedBody),
          (s = b[t]),
          new Promise(function (e, t) {
            try {
              for (var n in A) {
                var r, o, a;
                if (A[n].hasUnityMarker(i))
                  return (
                    s &&
                      console.log(
                        'You can reduce startup time if you configure your web server to add "Content-Encoding: ' +
                          n +
                          '" response header when serving "' +
                          s +
                          '" file.',
                      ),
                    (r = A[n]).worker ||
                      ((o = URL.createObjectURL(
                        new Blob(
                          [
                            "this.require = ",
                            r.require.toString(),
                            "; this.decompress = ",
                            r.decompress.toString(),
                            "; this.onmessage = ",
                            function (e) {
                              e = {
                                id: e.data.id,
                                decompressed: this.decompress(
                                  e.data.compressed,
                                ),
                              };
                              postMessage(
                                e,
                                e.decompressed ? [e.decompressed.buffer] : [],
                              );
                            }.toString(),
                            "; postMessage({ ready: true });",
                          ],
                          { type: "application/javascript" },
                        ),
                      )),
                      (r.worker = new Worker(o)),
                      (r.worker.onmessage = function (e) {
                        e.data.ready
                          ? URL.revokeObjectURL(o)
                          : (this.callbacks[e.data.id](e.data.decompressed),
                            delete this.callbacks[e.data.id]);
                      }),
                      (r.worker.callbacks = {}),
                      (r.worker.nextCallbackId = 0)),
                    (a = r.worker.nextCallbackId++),
                    (r.worker.callbacks[a] = e),
                    void r.worker.postMessage({ id: a, compressed: i }, [
                      i.buffer,
                    ])
                  );
              }
              e(i);
            } catch (e) {
              t(e);
            }
          })
        );
        var i, s;
      })
      .catch(function (e) {
        var t = "Failed to download file " + r;
        "file:" == location.protocol
          ? c(
              t +
                ". Loading web pages via a file:// URL without a web server is not supported by this browser. Please use a local development web server to host Unity content, or use the Unity Build and Run option.",
              "error",
            )
          : console.error(t);
      });
  }
  function P() {
    var t = performance.now(),
      m =
        (Promise.all([
          T("frameworkUrl").then(function (e) {
            var s = URL.createObjectURL(
              new Blob([e], { type: "application/javascript" }),
            );
            return new Promise(function (a, e) {
              var i = document.createElement("script");
              ((i.src = s),
                (i.onload = function () {
                  if ("undefined" == typeof unityFramework || !unityFramework) {
                    var e,
                      t = [
                        ["br", "br"],
                        ["gz", "gzip"],
                      ];
                    for (e in t) {
                      var n,
                        r = t[e];
                      if (b.frameworkUrl.endsWith("." + r[0]))
                        return (
                          (n = "Unable to parse " + b.frameworkUrl + "!"),
                          "file:" == location.protocol
                            ? void c(
                                n +
                                  " Loading pre-compressed (brotli or gzip) content via a file:// URL without a web server is not supported by this browser. Please use a local development web server to host compressed Unity content, or use the Unity Build and Run option.",
                                "error",
                              )
                            : ((n +=
                                ' This can happen if build compression was enabled but web server hosting the content was misconfigured to not serve the file with HTTP Response Header "Content-Encoding: ' +
                                r[1] +
                                '" present. Check browser Console and Devtools Network tab to debug.'),
                              "br" == r[0] &&
                                "http:" == location.protocol &&
                                ((r =
                                  -1 !=
                                  ["localhost", "127.0.0.1"].indexOf(
                                    location.hostname,
                                  )
                                    ? ""
                                    : "Migrate your server to use HTTPS."),
                                (n = /Firefox/.test(navigator.userAgent)
                                  ? "Unable to parse " +
                                    b.frameworkUrl +
                                    '!<br>If using custom web server, verify that web server is sending .br files with HTTP Response Header "Content-Encoding: br". Brotli compression may not be supported in Firefox over HTTP connections. ' +
                                    r +
                                    ' See <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1670675">https://bugzilla.mozilla.org/show_bug.cgi?id=1670675</a> for more information.'
                                  : "Unable to parse " +
                                    b.frameworkUrl +
                                    '!<br>If using custom web server, verify that web server is sending .br files with HTTP Response Header "Content-Encoding: br". Brotli compression may not be supported over HTTP connections. Migrate your server to use HTTPS.')),
                              void c(n, "error"))
                        );
                    }
                    c(
                      "Unable to parse " +
                        b.frameworkUrl +
                        "! The file is corrupt, or compression was misconfigured? (check Content-Encoding HTTP Response Header on web server)",
                      "error",
                    );
                  }
                  var o = unityFramework;
                  ((unityFramework = null),
                    (i.onload = null),
                    URL.revokeObjectURL(s),
                    a(o));
                }),
                (i.onerror = function (e) {
                  c(
                    "Unable to load file " +
                      b.frameworkUrl +
                      "! Check that the file exists on the remote server. (also check browser Console and Devtools Network tab to debug)",
                    "error",
                  );
                }),
                document.body.appendChild(i),
                b.deinitializers.push(function () {
                  document.body.removeChild(i);
                }));
            });
          }),
          T("codeUrl"),
        ]).then(function (e) {
          ((b.wasmBinary = e[1]),
            e[0](b),
            (b.codeDownloadTimeEnd = performance.now() - t));
        }),
        performance.now()),
      e = T("dataUrl");
    b.preRun.push(function () {
      (b.addRunDependency("dataUrl"),
        e.then(function (t) {
          var e = new TextDecoder("utf-8"),
            n = 0;
          function r() {
            var e =
              (t[n] | (t[n + 1] << 8) | (t[n + 2] << 16) | (t[n + 3] << 24)) >>>
              0;
            return ((n += 4), e);
          }
          function o(e) {
            if (A.gzip.hasUnityMarker(t))
              throw (
                e +
                '. Failed to parse binary data file, because it is still gzip-compressed and should have been uncompressed by the browser. Web server has likely provided gzip-compressed data without specifying the HTTP Response Header "Content-Encoding: gzip" with it to instruct the browser to decompress it. Please verify your web server hosting configuration.'
              );
            if (A.br.hasUnityMarker(t))
              throw (
                e +
                '. Failed to parse binary data file, because it is still brotli-compressed and should have been uncompressed by the browser. Web server has likely provided brotli-compressed data without specifying the HTTP Response Header "Content-Encoding: br" with it to instruct the browser to decompress it. Please verify your web server hosting configuration.'
              );
            throw e;
          }
          var a = "UnityWebData1.0\0",
            i = e.decode(t.subarray(0, a.length)),
            s =
              (i != a && o('Unknown data format (id="' + i + '")'),
              (n += a.length),
              r());
          for (
            n + s > t.length &&
            o(
              "Invalid binary data file header! (pos=" +
                n +
                ", headerSize=" +
                s +
                ", file length=" +
                t.length +
                ")",
            );
            n < s;
          ) {
            var l = r(),
              c = r(),
              d =
                (l + c > t.length &&
                  o(
                    "Invalid binary data file size! (offset=" +
                      l +
                      ", size=" +
                      c +
                      ", file length=" +
                      t.length +
                      ")",
                  ),
                r()),
              u =
                (n + d > t.length &&
                  o(
                    "Invalid binary data file path name! (pos=" +
                      n +
                      ", length=" +
                      d +
                      ", file length=" +
                      t.length +
                      ")",
                  ),
                e.decode(t.subarray(n, n + d)));
            n += d;
            for (
              var f = 0, h = u.indexOf("/", f) + 1;
              0 < h;
              f = h, h = u.indexOf("/", f) + 1
            )
              b.FS_createPath(u.substring(0, f), u.substring(f, h - 1), !0, !0);
            b.FS_createDataFile(u, null, t.subarray(l, l + c), !0, !0, !0);
          }
          (b.removeRunDependency("dataUrl"),
            (b.dataUrlLoadEndTime = performance.now() - m));
        }));
    });
  }
