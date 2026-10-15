// unity-demo__Build__webBuild.loader 03 — mode
// Lines 926-2614 of readable/unity-demo__Build__webBuild.loader.pretty.js (statement-aligned).
  var A = {
    gzip: {
      require: function (e) {
        var t,
          n = {
            "inflate.js": function (e, t, n) {
              "use strict";
              var u = e("./zlib/inflate"),
                f = e("./utils/common"),
                h = e("./utils/strings"),
                m = e("./zlib/constants"),
                r = e("./zlib/messages"),
                o = e("./zlib/zstream"),
                a = e("./zlib/gzheader"),
                b = Object.prototype.toString;
              function i(e) {
                if (!(this instanceof i)) return new i(e);
                this.options = f.assign(
                  { chunkSize: 16384, windowBits: 0, to: "" },
                  e || {},
                );
                var t = this.options;
                if (
                  (t.raw &&
                    0 <= t.windowBits &&
                    t.windowBits < 16 &&
                    ((t.windowBits = -t.windowBits),
                    0 === t.windowBits && (t.windowBits = -15)),
                  !(0 <= t.windowBits && t.windowBits < 16) ||
                    (e && e.windowBits) ||
                    (t.windowBits += 32),
                  15 < t.windowBits &&
                    t.windowBits < 48 &&
                    0 == (15 & t.windowBits) &&
                    (t.windowBits |= 15),
                  (this.err = 0),
                  (this.msg = ""),
                  (this.ended = !1),
                  (this.chunks = []),
                  (this.strm = new o()),
                  (this.strm.avail_out = 0),
                  (e = u.inflateInit2(this.strm, t.windowBits)) !== m.Z_OK)
                )
                  throw new Error(r[e]);
                ((this.header = new a()),
                  u.inflateGetHeader(this.strm, this.header));
              }
              function s(e, t) {
                if (((t = new i(t)).push(e, !0), t.err))
                  throw t.msg || r[t.err];
                return t.result;
              }
              ((i.prototype.push = function (e, t) {
                var n,
                  r,
                  o,
                  a,
                  i,
                  s = this.strm,
                  l = this.options.chunkSize,
                  c = this.options.dictionary,
                  d = !1;
                if (this.ended) return !1;
                ((r = t === ~~t ? t : !0 === t ? m.Z_FINISH : m.Z_NO_FLUSH),
                  "string" == typeof e
                    ? (s.input = h.binstring2buf(e))
                    : "[object ArrayBuffer]" === b.call(e)
                      ? (s.input = new Uint8Array(e))
                      : (s.input = e),
                  (s.next_in = 0),
                  (s.avail_in = s.input.length));
                do {
                  if (
                    (0 === s.avail_out &&
                      ((s.output = new f.Buf8(l)),
                      (s.next_out = 0),
                      (s.avail_out = l)),
                    (n = u.inflate(s, m.Z_NO_FLUSH)) === m.Z_NEED_DICT &&
                      c &&
                      ((i =
                        "string" == typeof c
                          ? h.string2buf(c)
                          : "[object ArrayBuffer]" === b.call(c)
                            ? new Uint8Array(c)
                            : c),
                      (n = u.inflateSetDictionary(this.strm, i))),
                    n === m.Z_BUF_ERROR && !0 === d && ((n = m.Z_OK), (d = !1)),
                    n !== m.Z_STREAM_END && n !== m.Z_OK)
                  )
                    return (this.onEnd(n), !(this.ended = !0));
                } while (
                  (!s.next_out ||
                    (0 !== s.avail_out &&
                      n !== m.Z_STREAM_END &&
                      (0 !== s.avail_in ||
                        (r !== m.Z_FINISH && r !== m.Z_SYNC_FLUSH))) ||
                    ("string" === this.options.to
                      ? ((i = h.utf8border(s.output, s.next_out)),
                        (o = s.next_out - i),
                        (a = h.buf2string(s.output, i)),
                        (s.next_out = o),
                        (s.avail_out = l - o),
                        o && f.arraySet(s.output, s.output, i, o, 0),
                        this.onData(a))
                      : this.onData(f.shrinkBuf(s.output, s.next_out))),
                  0 === s.avail_in && 0 === s.avail_out && (d = !0),
                  (0 < s.avail_in || 0 === s.avail_out) && n !== m.Z_STREAM_END)
                );
                return (r = n === m.Z_STREAM_END ? m.Z_FINISH : r) ===
                  m.Z_FINISH
                  ? ((n = u.inflateEnd(this.strm)),
                    this.onEnd(n),
                    (this.ended = !0),
                    n === m.Z_OK)
                  : r !== m.Z_SYNC_FLUSH ||
                      (this.onEnd(m.Z_OK), !(s.avail_out = 0));
              }),
                (i.prototype.onData = function (e) {
                  this.chunks.push(e);
                }),
                (i.prototype.onEnd = function (e) {
                  (e === m.Z_OK &&
                    ("string" === this.options.to
                      ? (this.result = this.chunks.join(""))
                      : (this.result = f.flattenChunks(this.chunks))),
                    (this.chunks = []),
                    (this.err = e),
                    (this.msg = this.strm.msg));
                }),
                (n.Inflate = i),
                (n.inflate = s),
                (n.inflateRaw = function (e, t) {
                  return (((t = t || {}).raw = !0), s(e, t));
                }),
                (n.ungzip = s));
            },
            "utils/common.js": function (e, t, n) {
              "use strict";
              var r =
                  "undefined" != typeof Uint8Array &&
                  "undefined" != typeof Uint16Array &&
                  "undefined" != typeof Int32Array,
                o =
                  ((n.assign = function (e) {
                    for (
                      var t = Array.prototype.slice.call(arguments, 1);
                      t.length;
                    ) {
                      var n = t.shift();
                      if (n) {
                        if ("object" != typeof n)
                          throw new TypeError(n + "must be non-object");
                        for (var r in n) n.hasOwnProperty(r) && (e[r] = n[r]);
                      }
                    }
                    return e;
                  }),
                  (n.shrinkBuf = function (e, t) {
                    if (e.length !== t) {
                      if (e.subarray) return e.subarray(0, t);
                      e.length = t;
                    }
                    return e;
                  }),
                  {
                    arraySet: function (e, t, n, r, o) {
                      if (t.subarray && e.subarray)
                        e.set(t.subarray(n, n + r), o);
                      else for (var a = 0; a < r; a++) e[o + a] = t[n + a];
                    },
                    flattenChunks: function (e) {
                      for (var t, n, r, o = 0, a = 0, i = e.length; a < i; a++)
                        o += e[a].length;
                      for (
                        r = new Uint8Array(o), a = t = 0, i = e.length;
                        a < i;
                        a++
                      )
                        ((n = e[a]), r.set(n, t), (t += n.length));
                      return r;
                    },
                  }),
                a = {
                  arraySet: function (e, t, n, r, o) {
                    for (var a = 0; a < r; a++) e[o + a] = t[n + a];
                  },
                  flattenChunks: function (e) {
                    return [].concat.apply([], e);
                  },
                };
              ((n.setTyped = function (e) {
                e
                  ? ((n.Buf8 = Uint8Array),
                    (n.Buf16 = Uint16Array),
                    (n.Buf32 = Int32Array),
                    n.assign(n, o))
                  : ((n.Buf8 = Array),
                    (n.Buf16 = Array),
                    (n.Buf32 = Array),
                    n.assign(n, a));
              }),
                n.setTyped(r));
            },
            "utils/strings.js": function (e, t, n) {
              "use strict";
              var l = e("./common"),
                o = !0,
                a = !0;
              try {
                String.fromCharCode.apply(null, [0]);
              } catch (e) {
                o = !1;
              }
              try {
                String.fromCharCode.apply(null, new Uint8Array(1));
              } catch (e) {
                a = !1;
              }
              for (var c = new l.Buf8(256), r = 0; r < 256; r++)
                c[r] =
                  252 <= r
                    ? 6
                    : 248 <= r
                      ? 5
                      : 240 <= r
                        ? 4
                        : 224 <= r
                          ? 3
                          : 192 <= r
                            ? 2
                            : 1;
              function d(e, t) {
                if (t < 65537 && ((e.subarray && a) || (!e.subarray && o)))
                  return String.fromCharCode.apply(null, l.shrinkBuf(e, t));
                for (var n = "", r = 0; r < t; r++)
                  n += String.fromCharCode(e[r]);
                return n;
              }
              ((c[254] = c[254] = 1),
                (n.string2buf = function (e) {
                  for (var t, n, r, o, a = e.length, i = 0, s = 0; s < a; s++)
                    (55296 == (64512 & (n = e.charCodeAt(s))) &&
                      s + 1 < a &&
                      56320 == (64512 & (r = e.charCodeAt(s + 1))) &&
                      ((n = 65536 + ((n - 55296) << 10) + (r - 56320)), s++),
                      (i += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4));
                  for (t = new l.Buf8(i), s = o = 0; o < i; s++)
                    (55296 == (64512 & (n = e.charCodeAt(s))) &&
                      s + 1 < a &&
                      56320 == (64512 & (r = e.charCodeAt(s + 1))) &&
                      ((n = 65536 + ((n - 55296) << 10) + (r - 56320)), s++),
                      n < 128
                        ? (t[o++] = n)
                        : (n < 2048
                            ? (t[o++] = 192 | (n >>> 6))
                            : (n < 65536
                                ? (t[o++] = 224 | (n >>> 12))
                                : ((t[o++] = 240 | (n >>> 18)),
                                  (t[o++] = 128 | ((n >>> 12) & 63))),
                              (t[o++] = 128 | ((n >>> 6) & 63))),
                          (t[o++] = 128 | (63 & n))));
                  return t;
                }),
                (n.buf2binstring = function (e) {
                  return d(e, e.length);
                }),
                (n.binstring2buf = function (e) {
                  for (
                    var t = new l.Buf8(e.length), n = 0, r = t.length;
                    n < r;
                    n++
                  )
                    t[n] = e.charCodeAt(n);
                  return t;
                }),
                (n.buf2string = function (e, t) {
                  for (
                    var n,
                      r,
                      o = t || e.length,
                      a = new Array(2 * o),
                      i = 0,
                      s = 0;
                    s < o;
                  )
                    if ((n = e[s++]) < 128) a[i++] = n;
                    else if (4 < (r = c[n])) ((a[i++] = 65533), (s += r - 1));
                    else {
                      for (
                        n &= 2 === r ? 31 : 3 === r ? 15 : 7;
                        1 < r && s < o;
                      )
                        ((n = (n << 6) | (63 & e[s++])), r--);
                      1 < r
                        ? (a[i++] = 65533)
                        : n < 65536
                          ? (a[i++] = n)
                          : ((n -= 65536),
                            (a[i++] = 55296 | ((n >> 10) & 1023)),
                            (a[i++] = 56320 | (1023 & n)));
                    }
                  return d(a, i);
                }),
                (n.utf8border = function (e, t) {
                  for (
                    var n =
                      (t = (t = t || e.length) > e.length ? e.length : t) - 1;
                    0 <= n && 128 == (192 & e[n]);
                  )
                    n--;
                  return !(n < 0) && 0 !== n && n + c[e[n]] > t ? n : t;
                }));
            },
            "zlib/inflate.js": function (e, t, n) {
              "use strict";
              var D = e("../utils/common"),
                B = e("./adler32"),
                I = e("./crc32"),
                R = e("./inffast"),
                z = e("./inftrees"),
                L = 0,
                O = -2,
                F = 1,
                r = 852,
                o = 592;
              function M(e) {
                return (
                  ((e >>> 24) & 255) +
                  ((e >>> 8) & 65280) +
                  ((65280 & e) << 8) +
                  ((255 & e) << 24)
                );
              }
              function a() {
                ((this.mode = 0),
                  (this.last = !1),
                  (this.wrap = 0),
                  (this.havedict = !1),
                  (this.flags = 0),
                  (this.dmax = 0),
                  (this.check = 0),
                  (this.total = 0),
                  (this.head = null),
                  (this.wbits = 0),
                  (this.wsize = 0),
                  (this.whave = 0),
                  (this.wnext = 0),
                  (this.window = null),
                  (this.hold = 0),
                  (this.bits = 0),
                  (this.length = 0),
                  (this.offset = 0),
                  (this.extra = 0),
                  (this.lencode = null),
                  (this.distcode = null),
                  (this.lenbits = 0),
                  (this.distbits = 0),
                  (this.ncode = 0),
                  (this.nlen = 0),
                  (this.ndist = 0),
                  (this.have = 0),
                  (this.next = null),
                  (this.lens = new D.Buf16(320)),
                  (this.work = new D.Buf16(288)),
                  (this.lendyn = null),
                  (this.distdyn = null),
                  (this.sane = 0),
                  (this.back = 0),
                  (this.was = 0));
              }
              function i(e) {
                var t;
                return e && e.state
                  ? ((t = e.state),
                    (e.total_in = e.total_out = t.total = 0),
                    (e.msg = ""),
                    t.wrap && (e.adler = 1 & t.wrap),
                    (t.mode = F),
                    (t.last = 0),
                    (t.havedict = 0),
                    (t.dmax = 32768),
                    (t.head = null),
                    (t.hold = 0),
                    (t.bits = 0),
                    (t.lencode = t.lendyn = new D.Buf32(r)),
                    (t.distcode = t.distdyn = new D.Buf32(o)),
                    (t.sane = 1),
                    (t.back = -1),
                    L)
                  : O;
              }
              function s(e) {
                var t;
                return e && e.state
                  ? (((t = e.state).wsize = 0),
                    (t.whave = 0),
                    (t.wnext = 0),
                    i(e))
                  : O;
              }
              function l(e, t) {
                var n, r;
                return !e ||
                  !e.state ||
                  ((r = e.state),
                  t < 0
                    ? ((n = 0), (t = -t))
                    : ((n = 1 + (t >> 4)), t < 48 && (t &= 15)),
                  t && (t < 8 || 15 < t))
                  ? O
                  : (null !== r.window && r.wbits !== t && (r.window = null),
                    (r.wrap = n),
                    (r.wbits = t),
                    s(e));
              }
              function c(e, t) {
                var n;
                return e
                  ? ((n = new a()),
                    ((e.state = n).window = null),
                    (n = l(e, t)) !== L && (e.state = null),
                    n)
                  : O;
              }
              var N,
                H,
                W = !0;
              function Z(e, t, n, r) {
                var o;
                return (
                  null === (e = e.state).window &&
                    ((e.wsize = 1 << e.wbits),
                    (e.wnext = 0),
                    (e.whave = 0),
                    (e.window = new D.Buf8(e.wsize))),
                  r >= e.wsize
                    ? (D.arraySet(e.window, t, n - e.wsize, e.wsize, 0),
                      (e.wnext = 0),
                      (e.whave = e.wsize))
                    : (r < (o = e.wsize - e.wnext) && (o = r),
                      D.arraySet(e.window, t, n - r, o, e.wnext),
                      (r -= o)
                        ? (D.arraySet(e.window, t, n - r, r, 0),
                          (e.wnext = r),
                          (e.whave = e.wsize))
                        : ((e.wnext += o),
                          e.wnext === e.wsize && (e.wnext = 0),
                          e.whave < e.wsize && (e.whave += o))),
                  0
                );
              }
              ((n.inflateReset = s),
                (n.inflateReset2 = l),
                (n.inflateResetKeep = i),
                (n.inflateInit = function (e) {
                  return c(e, 15);
                }),
                (n.inflateInit2 = c),
                (n.inflate = function (e, t) {
                  var n,
                    r,
                    o,
                    a,
                    i,
                    s,
                    l,
                    c,
                    d,
                    u,
                    f,
                    h,
                    m,
                    b,
                    p,
                    g,
                    w,
                    v,
                    y,
                    k,
                    _,
                    x,
                    S,
                    E,
                    C = 0,
                    U = new D.Buf8(4),
                    A = [
                      16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14,
                      1, 15,
                    ];
                  if (
                    !e ||
                    !e.state ||
                    !e.output ||
                    (!e.input && 0 !== e.avail_in)
                  )
                    return O;
                  (12 === (n = e.state).mode && (n.mode = 13),
                    (i = e.next_out),
                    (o = e.output),
                    (l = e.avail_out),
                    (a = e.next_in),
                    (r = e.input),
                    (s = e.avail_in),
                    (c = n.hold),
                    (d = n.bits),
                    (u = s),
                    (f = l),
                    (x = L));
                  e: for (;;)
                    switch (n.mode) {
                      case F:
                        if (0 === n.wrap) n.mode = 13;
                        else {
                          for (; d < 16;) {
                            if (0 === s) break e;
                            (s--, (c += r[a++] << d), (d += 8));
                          }
                          if (2 & n.wrap && 35615 === c)
                            ((U[(n.check = 0)] = 255 & c),
                              (U[1] = (c >>> 8) & 255),
                              (n.check = I(n.check, U, 2, 0)),
                              (d = c = 0),
                              (n.mode = 2));
                          else if (
                            ((n.flags = 0),
                            n.head && (n.head.done = !1),
                            !(1 & n.wrap) || (((255 & c) << 8) + (c >> 8)) % 31)
                          )
                            ((e.msg = "incorrect header check"), (n.mode = 30));
                          else if (8 != (15 & c))
                            ((e.msg = "unknown compression method"),
                              (n.mode = 30));
                          else {
                            if (
                              ((d -= 4),
                              (_ = 8 + (15 & (c >>>= 4))),
                              0 === n.wbits)
                            )
                              n.wbits = _;
                            else if (_ > n.wbits) {
                              ((e.msg = "invalid window size"), (n.mode = 30));
                              break;
                            }
                            ((n.dmax = 1 << _),
                              (e.adler = n.check = 1),
                              (n.mode = 512 & c ? 10 : 12),
                              (d = c = 0));
                          }
                        }
                        break;
                      case 2:
                        for (; d < 16;) {
                          if (0 === s) break e;
                          (s--, (c += r[a++] << d), (d += 8));
                        }
                        if (((n.flags = c), 8 != (255 & n.flags))) {
                          ((e.msg = "unknown compression method"),
                            (n.mode = 30));
                          break;
                        }
                        if (57344 & n.flags) {
                          ((e.msg = "unknown header flags set"), (n.mode = 30));
                          break;
                        }
                        (n.head && (n.head.text = (c >> 8) & 1),
                          512 & n.flags &&
                            ((U[0] = 255 & c),
                            (U[1] = (c >>> 8) & 255),
                            (n.check = I(n.check, U, 2, 0))),
                          (d = c = 0),
                          (n.mode = 3));
                      case 3:
                        for (; d < 32;) {
                          if (0 === s) break e;
                          (s--, (c += r[a++] << d), (d += 8));
                        }
                        (n.head && (n.head.time = c),
                          512 & n.flags &&
                            ((U[0] = 255 & c),
                            (U[1] = (c >>> 8) & 255),
                            (U[2] = (c >>> 16) & 255),
                            (U[3] = (c >>> 24) & 255),
                            (n.check = I(n.check, U, 4, 0))),
                          (d = c = 0),
                          (n.mode = 4));
                      case 4:
                        for (; d < 16;) {
                          if (0 === s) break e;
                          (s--, (c += r[a++] << d), (d += 8));
                        }
                        (n.head &&
                          ((n.head.xflags = 255 & c), (n.head.os = c >> 8)),
                          512 & n.flags &&
                            ((U[0] = 255 & c),
                            (U[1] = (c >>> 8) & 255),
                            (n.check = I(n.check, U, 2, 0))),
                          (d = c = 0),
                          (n.mode = 5));
                      case 5:
                        if (1024 & n.flags) {
                          for (; d < 16;) {
                            if (0 === s) break e;
                            (s--, (c += r[a++] << d), (d += 8));
                          }
                          ((n.length = c),
                            n.head && (n.head.extra_len = c),
                            512 & n.flags &&
                              ((U[0] = 255 & c),
                              (U[1] = (c >>> 8) & 255),
                              (n.check = I(n.check, U, 2, 0))),
                            (d = c = 0));
                        } else n.head && (n.head.extra = null);
                        n.mode = 6;
                      case 6:
                        if (
                          1024 & n.flags &&
                          ((h = s < (h = n.length) ? s : h) &&
                            (n.head &&
                              ((_ = n.head.extra_len - n.length),
                              n.head.extra ||
                                (n.head.extra = new Array(n.head.extra_len)),
                              D.arraySet(n.head.extra, r, a, h, _)),
                            512 & n.flags && (n.check = I(n.check, r, h, a)),
                            (s -= h),
                            (a += h),
                            (n.length -= h)),
                          n.length)
                        )
                          break e;
                        ((n.length = 0), (n.mode = 7));
                      case 7:
                        if (2048 & n.flags) {
                          if (0 === s) break e;
                          for (
                            h = 0;
                            (_ = r[a + h++]),
                              n.head &&
                                _ &&
                                n.length < 65536 &&
                                (n.head.name += String.fromCharCode(_)),
                              _ && h < s;
                          );
                          if (
                            (512 & n.flags && (n.check = I(n.check, r, h, a)),
                            (s -= h),
                            (a += h),
                            _)
                          )
                            break e;
                        } else n.head && (n.head.name = null);
                        ((n.length = 0), (n.mode = 8));
                      case 8:
                        if (4096 & n.flags) {
                          if (0 === s) break e;
                          for (
                            h = 0;
                            (_ = r[a + h++]),
                              n.head &&
                                _ &&
                                n.length < 65536 &&
                                (n.head.comment += String.fromCharCode(_)),
                              _ && h < s;
                          );
                          if (
                            (512 & n.flags && (n.check = I(n.check, r, h, a)),
                            (s -= h),
                            (a += h),
                            _)
                          )
                            break e;
                        } else n.head && (n.head.comment = null);
                        n.mode = 9;
                      case 9:
                        if (512 & n.flags) {
                          for (; d < 16;) {
                            if (0 === s) break e;
                            (s--, (c += r[a++] << d), (d += 8));
                          }
                          if (c !== (65535 & n.check)) {
                            ((e.msg = "header crc mismatch"), (n.mode = 30));
                            break;
                          }
                          d = c = 0;
                        }
                        (n.head &&
                          ((n.head.hcrc = (n.flags >> 9) & 1),
                          (n.head.done = !0)),
                          (e.adler = n.check = 0),
                          (n.mode = 12));
                        break;
                      case 10:
                        for (; d < 32;) {
                          if (0 === s) break e;
                          (s--, (c += r[a++] << d), (d += 8));
                        }
                        ((e.adler = n.check = M(c)),
                          (d = c = 0),
                          (n.mode = 11));
                      case 11:
                        if (0 === n.havedict)
                          return (
                            (e.next_out = i),
                            (e.avail_out = l),
                            (e.next_in = a),
                            (e.avail_in = s),
                            (n.hold = c),
                            (n.bits = d),
                            2
                          );
                        ((e.adler = n.check = 1), (n.mode = 12));
                      case 12:
                        if (5 === t || 6 === t) break e;
                      case 13:
                        if (n.last)
                          ((c >>>= 7 & d), (d -= 7 & d), (n.mode = 27));
                        else {
                          for (; d < 3;) {
                            if (0 === s) break e;
                            (s--, (c += r[a++] << d), (d += 8));
                          }
                          switch (((n.last = 1 & c), --d, 3 & (c >>>= 1))) {
                            case 0:
                              n.mode = 14;
                              break;
                            case 1:
                              var T,
                                T = (P = void 0),
                                P = n;
                              if (W) {
                                for (
                                  N = new D.Buf32(512),
                                    H = new D.Buf32(32),
                                    T = 0;
                                  T < 144;
                                )
                                  P.lens[T++] = 8;
                                for (; T < 256;) P.lens[T++] = 9;
                                for (; T < 280;) P.lens[T++] = 7;
                                for (; T < 288;) P.lens[T++] = 8;
                                for (
                                  z(1, P.lens, 0, 288, N, 0, P.work, {
                                    bits: 9,
                                  }),
                                    T = 0;
                                  T < 32;
                                )
                                  P.lens[T++] = 5;
                                (z(2, P.lens, 0, 32, H, 0, P.work, { bits: 5 }),
                                  (W = !1));
                              }
                              if (
                                ((P.lencode = N),
                                (P.lenbits = 9),
                                (P.distcode = H),
                                (P.distbits = 5),
                                (n.mode = 20),
                                6 !== t)
                              )
                                break;
                              ((c >>>= 2), (d -= 2));
                              break e;
                            case 2:
                              n.mode = 17;
                              break;
                            case 3:
                              ((e.msg = "invalid block type"), (n.mode = 30));
                          }
                          ((c >>>= 2), (d -= 2));
                        }
                        break;
                      case 14:
                        for (c >>>= 7 & d, d -= 7 & d; d < 32;) {
                          if (0 === s) break e;
                          (s--, (c += r[a++] << d), (d += 8));
                        }
                        if ((65535 & c) != ((c >>> 16) ^ 65535)) {
                          ((e.msg = "invalid stored block lengths"),
                            (n.mode = 30));
                          break;
                        }
                        if (
                          ((n.length = 65535 & c),
                          (d = c = 0),
                          (n.mode = 15),
                          6 === t)
                        )
                          break e;
                      case 15:
                        n.mode = 16;
                      case 16:
                        if ((h = n.length)) {
                          if (0 === (h = l < (h = s < h ? s : h) ? l : h))
                            break e;
                          (D.arraySet(o, r, a, h, i),
                            (s -= h),
                            (a += h),
                            (l -= h),
                            (i += h),
                            (n.length -= h));
                        } else n.mode = 12;
                        break;
                      case 17:
                        for (; d < 14;) {
                          if (0 === s) break e;
                          (s--, (c += r[a++] << d), (d += 8));
                        }
                        if (
                          ((n.nlen = 257 + (31 & c)),
                          (c >>>= 5),
                          (d -= 5),
                          (n.ndist = 1 + (31 & c)),
                          (c >>>= 5),
                          (d -= 5),
                          (n.ncode = 4 + (15 & c)),
                          (c >>>= 4),
                          (d -= 4),
                          286 < n.nlen || 30 < n.ndist)
                        ) {
                          ((e.msg = "too many length or distance symbols"),
                            (n.mode = 30));
                          break;
                        }
                        ((n.have = 0), (n.mode = 18));
                      case 18:
                        for (; n.have < n.ncode;) {
                          for (; d < 3;) {
                            if (0 === s) break e;
                            (s--, (c += r[a++] << d), (d += 8));
                          }
                          ((n.lens[A[n.have++]] = 7 & c), (c >>>= 3), (d -= 3));
                        }
                        for (; n.have < 19;) n.lens[A[n.have++]] = 0;
                        if (
                          ((n.lencode = n.lendyn),
                          (n.lenbits = 7),
                          (S = { bits: n.lenbits }),
                          (x = z(0, n.lens, 0, 19, n.lencode, 0, n.work, S)),
                          (n.lenbits = S.bits),
                          x)
                        ) {
                          ((e.msg = "invalid code lengths set"), (n.mode = 30));
                          break;
                        }
                        ((n.have = 0), (n.mode = 19));
                      case 19:
                        for (; n.have < n.nlen + n.ndist;) {
                          for (
                            ;
                            (g =
                              ((C = n.lencode[c & ((1 << n.lenbits) - 1)]) >>>
                                16) &
                              255),
                              (w = 65535 & C),
                              !((p = C >>> 24) <= d);
                          ) {
                            if (0 === s) break e;
                            (s--, (c += r[a++] << d), (d += 8));
                          }
                          if (w < 16)
                            ((c >>>= p), (d -= p), (n.lens[n.have++] = w));
                          else {
                            if (16 === w) {
                              for (E = p + 2; d < E;) {
                                if (0 === s) break e;
                                (s--, (c += r[a++] << d), (d += 8));
                              }
                              if (((c >>>= p), (d -= p), 0 === n.have)) {
                                ((e.msg = "invalid bit length repeat"),
                                  (n.mode = 30));
                                break;
                              }
                              ((_ = n.lens[n.have - 1]),
                                (h = 3 + (3 & c)),
                                (c >>>= 2),
                                (d -= 2));
                            } else if (17 === w) {
                              for (E = p + 3; d < E;) {
                                if (0 === s) break e;
                                (s--, (c += r[a++] << d), (d += 8));
                              }
                              ((_ = 0),
                                (h = 3 + (7 & (c >>>= p))),
                                (c >>>= 3),
                                (d = d - p - 3));
                            } else {
                              for (E = p + 7; d < E;) {
                                if (0 === s) break e;
                                (s--, (c += r[a++] << d), (d += 8));
                              }
                              ((_ = 0),
                                (h = 11 + (127 & (c >>>= p))),
                                (c >>>= 7),
                                (d = d - p - 7));
                            }
                            if (n.have + h > n.nlen + n.ndist) {
                              ((e.msg = "invalid bit length repeat"),
                                (n.mode = 30));
                              break;
                            }
                            for (; h--;) n.lens[n.have++] = _;
                          }
                        }
                        if (30 === n.mode) break;
                        if (0 === n.lens[256]) {
                          ((e.msg = "invalid code -- missing end-of-block"),
                            (n.mode = 30));
                          break;
                        }
                        if (
                          ((n.lenbits = 9),
                          (S = { bits: n.lenbits }),
                          (x = z(
                            1,
                            n.lens,
                            0,
                            n.nlen,
                            n.lencode,
                            0,
                            n.work,
                            S,
                          )),
                          (n.lenbits = S.bits),
                          x)
                        ) {
                          ((e.msg = "invalid literal/lengths set"),
                            (n.mode = 30));
                          break;
                        }
                        if (
                          ((n.distbits = 6),
                          (n.distcode = n.distdyn),
                          (S = { bits: n.distbits }),
                          (x = z(
                            2,
                            n.lens,
                            n.nlen,
                            n.ndist,
                            n.distcode,
                            0,
                            n.work,
                            S,
                          )),
                          (n.distbits = S.bits),
                          x)
                        ) {
                          ((e.msg = "invalid distances set"), (n.mode = 30));
                          break;
                        }
                        if (((n.mode = 20), 6 === t)) break e;
                      case 20:
                        n.mode = 21;
                      case 21:
                        if (6 <= s && 258 <= l) {
                          ((e.next_out = i),
                            (e.avail_out = l),
                            (e.next_in = a),
                            (e.avail_in = s),
                            (n.hold = c),
                            (n.bits = d),
                            R(e, f),
                            (i = e.next_out),
                            (o = e.output),
                            (l = e.avail_out),
                            (a = e.next_in),
                            (r = e.input),
                            (s = e.avail_in),
                            (c = n.hold),
                            (d = n.bits),
                            12 === n.mode && (n.back = -1));
                          break;
                        }
                        for (
                          n.back = 0;
                          (g =
                            ((C = n.lencode[c & ((1 << n.lenbits) - 1)]) >>>
                              16) &
                            255),
                            (w = 65535 & C),
                            !((p = C >>> 24) <= d);
                        ) {
                          if (0 === s) break e;
                          (s--, (c += r[a++] << d), (d += 8));
                        }
                        if (g && 0 == (240 & g)) {
                          for (
                            v = p, y = g, k = w;
                            (g =
                              ((C =
                                n.lencode[
                                  k + ((c & ((1 << (v + y)) - 1)) >> v)
                                ]) >>>
                                16) &
                              255),
                              (w = 65535 & C),
                              !(v + (p = C >>> 24) <= d);
                          ) {
                            if (0 === s) break e;
                            (s--, (c += r[a++] << d), (d += 8));
                          }
                          ((c >>>= v), (d -= v), (n.back += v));
                        }
                        if (
                          ((c >>>= p),
                          (d -= p),
                          (n.back += p),
                          (n.length = w),
                          0 === g)
                        ) {
                          n.mode = 26;
                          break;
                        }
                        if (32 & g) {
                          ((n.back = -1), (n.mode = 12));
                          break;
                        }
                        if (64 & g) {
                          ((e.msg = "invalid literal/length code"),
                            (n.mode = 30));
                          break;
                        }
                        ((n.extra = 15 & g), (n.mode = 22));
                      case 22:
                        if (n.extra) {
                          for (E = n.extra; d < E;) {
                            if (0 === s) break e;
                            (s--, (c += r[a++] << d), (d += 8));
                          }
                          ((n.length += c & ((1 << n.extra) - 1)),
                            (c >>>= n.extra),
                            (d -= n.extra),
                            (n.back += n.extra));
                        }
                        ((n.was = n.length), (n.mode = 23));
                      case 23:
                        for (
                          ;
                          (g =
                            ((C = n.distcode[c & ((1 << n.distbits) - 1)]) >>>
                              16) &
                            255),
                            (w = 65535 & C),
                            !((p = C >>> 24) <= d);
                        ) {
                          if (0 === s) break e;
                          (s--, (c += r[a++] << d), (d += 8));
                        }
                        if (0 == (240 & g)) {
                          for (
                            v = p, y = g, k = w;
                            (g =
                              ((C =
                                n.distcode[
                                  k + ((c & ((1 << (v + y)) - 1)) >> v)
                                ]) >>>
                                16) &
                              255),
                              (w = 65535 & C),
                              !(v + (p = C >>> 24) <= d);
                          ) {
                            if (0 === s) break e;
                            (s--, (c += r[a++] << d), (d += 8));
                          }
                          ((c >>>= v), (d -= v), (n.back += v));
                        }
                        if (((c >>>= p), (d -= p), (n.back += p), 64 & g)) {
                          ((e.msg = "invalid distance code"), (n.mode = 30));
                          break;
                        }
                        ((n.offset = w), (n.extra = 15 & g), (n.mode = 24));
                      case 24:
                        if (n.extra) {
                          for (E = n.extra; d < E;) {
                            if (0 === s) break e;
                            (s--, (c += r[a++] << d), (d += 8));
                          }
                          ((n.offset += c & ((1 << n.extra) - 1)),
                            (c >>>= n.extra),
                            (d -= n.extra),
                            (n.back += n.extra));
                        }
                        if (n.offset > n.dmax) {
                          ((e.msg = "invalid distance too far back"),
                            (n.mode = 30));
                          break;
                        }
                        n.mode = 25;
                      case 25:
                        if (0 === l) break e;
                        if (n.offset > (h = f - l)) {
                          if ((h = n.offset - h) > n.whave && n.sane) {
                            ((e.msg = "invalid distance too far back"),
                              (n.mode = 30));
                            break;
                          }
                          ((m =
                            h > n.wnext
                              ? ((h -= n.wnext), n.wsize - h)
                              : n.wnext - h),
                            h > n.length && (h = n.length),
                            (b = n.window));
                        } else ((b = o), (m = i - n.offset), (h = n.length));
                        for (
                          l -= h = l < h ? l : h, n.length -= h;
                          (o[i++] = b[m++]), --h;
                        );
                        0 === n.length && (n.mode = 21);
                        break;
                      case 26:
                        if (0 === l) break e;
                        ((o[i++] = n.length), l--, (n.mode = 21));
                        break;
                      case 27:
                        if (n.wrap) {
                          for (; d < 32;) {
                            if (0 === s) break e;
                            (s--, (c |= r[a++] << d), (d += 8));
                          }
                          if (
                            ((f -= l),
                            (e.total_out += f),
                            (n.total += f),
                            f &&
                              (e.adler = n.check =
                                (n.flags ? I : B)(n.check, o, f, i - f)),
                            (f = l),
                            (n.flags ? c : M(c)) !== n.check)
                          ) {
                            ((e.msg = "incorrect data check"), (n.mode = 30));
                            break;
                          }
                          d = c = 0;
                        }
                        n.mode = 28;
                      case 28:
                        if (n.wrap && n.flags) {
                          for (; d < 32;) {
                            if (0 === s) break e;
                            (s--, (c += r[a++] << d), (d += 8));
                          }
                          if (c !== (4294967295 & n.total)) {
                            ((e.msg = "incorrect length check"), (n.mode = 30));
                            break;
                          }
                          d = c = 0;
                        }
                        n.mode = 29;
                      case 29:
                        x = 1;
                        break e;
                      case 30:
                        x = -3;
                        break e;
                      case 31:
                        return -4;
                      default:
                        return O;
                    }
                  return (
                    (e.next_out = i),
                    (e.avail_out = l),
                    (e.next_in = a),
                    (e.avail_in = s),
                    (n.hold = c),
                    (n.bits = d),
                    (n.wsize ||
                      (f !== e.avail_out &&
                        n.mode < 30 &&
                        (n.mode < 27 || 4 !== t))) &&
                    Z(e, e.output, e.next_out, f - e.avail_out)
                      ? ((n.mode = 31), -4)
                      : ((u -= e.avail_in),
                        (f -= e.avail_out),
                        (e.total_in += u),
                        (e.total_out += f),
                        (n.total += f),
                        n.wrap &&
                          f &&
                          (e.adler = n.check =
                            (n.flags ? I : B)(n.check, o, f, e.next_out - f)),
                        (e.data_type =
                          n.bits +
                          (n.last ? 64 : 0) +
                          (12 === n.mode ? 128 : 0) +
                          (20 === n.mode || 15 === n.mode ? 256 : 0)),
                        ((0 == u && 0 === f) || 4 === t) && x === L ? -5 : x)
                  );
                }),
                (n.inflateEnd = function (e) {
                  var t;
                  return e && e.state
                    ? ((t = e.state).window && (t.window = null),
                      (e.state = null),
                      L)
                    : O;
                }),
                (n.inflateGetHeader = function (e, t) {
                  return e && e.state && 0 != (2 & (e = e.state).wrap)
                    ? (((e.head = t).done = !1), L)
                    : O;
                }),
                (n.inflateSetDictionary = function (e, t) {
                  var n,
                    r = t.length;
                  return !e ||
                    !e.state ||
                    (0 !== (n = e.state).wrap && 11 !== n.mode)
                    ? O
                    : 11 === n.mode && B(1, t, r, 0) !== n.check
                      ? -3
                      : Z(e, t, r, r)
                        ? ((n.mode = 31), -4)
                        : ((n.havedict = 1), L);
                }),
                (n.inflateInfo = "pako inflate (from Nodeca project)"));
            },
            "zlib/constants.js": function (e, t, n) {
              "use strict";
              t.exports = {
                Z_NO_FLUSH: 0,
                Z_PARTIAL_FLUSH: 1,
                Z_SYNC_FLUSH: 2,
                Z_FULL_FLUSH: 3,
                Z_FINISH: 4,
                Z_BLOCK: 5,
                Z_TREES: 6,
                Z_OK: 0,
                Z_STREAM_END: 1,
                Z_NEED_DICT: 2,
                Z_ERRNO: -1,
                Z_STREAM_ERROR: -2,
                Z_DATA_ERROR: -3,
                Z_BUF_ERROR: -5,
                Z_NO_COMPRESSION: 0,
                Z_BEST_SPEED: 1,
                Z_BEST_COMPRESSION: 9,
                Z_DEFAULT_COMPRESSION: -1,
                Z_FILTERED: 1,
                Z_HUFFMAN_ONLY: 2,
                Z_RLE: 3,
                Z_FIXED: 4,
                Z_DEFAULT_STRATEGY: 0,
                Z_BINARY: 0,
                Z_TEXT: 1,
                Z_UNKNOWN: 2,
                Z_DEFLATED: 8,
              };
            },
            "zlib/messages.js": function (e, t, n) {
              "use strict";
              t.exports = {
                2: "need dictionary",
                1: "stream end",
                0: "",
                "-1": "file error",
                "-2": "stream error",
                "-3": "data error",
                "-4": "insufficient memory",
                "-5": "buffer error",
                "-6": "incompatible version",
              };
            },
            "zlib/zstream.js": function (e, t, n) {
              "use strict";
              t.exports = function () {
                ((this.input = null),
                  (this.next_in = 0),
                  (this.avail_in = 0),
                  (this.total_in = 0),
                  (this.output = null),
                  (this.next_out = 0),
                  (this.avail_out = 0),
                  (this.total_out = 0),
                  (this.msg = ""),
                  (this.state = null),
                  (this.data_type = 2),
                  (this.adler = 0));
              };
            },
            "zlib/gzheader.js": function (e, t, n) {
              "use strict";
              t.exports = function () {
                ((this.text = 0),
                  (this.time = 0),
                  (this.xflags = 0),
                  (this.os = 0),
                  (this.extra = null),
                  (this.extra_len = 0),
                  (this.name = ""),
                  (this.comment = ""),
                  (this.hcrc = 0),
                  (this.done = !1));
              };
            },
            "zlib/adler32.js": function (e, t, n) {
              "use strict";
              t.exports = function (e, t, n, r) {
                for (
                  var o = (65535 & e) | 0, a = ((e >>> 16) & 65535) | 0, i = 0;
                  0 !== n;
                ) {
                  for (
                    n -= i = 2e3 < n ? 2e3 : n;
                    (a = (a + (o = (o + t[r++]) | 0)) | 0), --i;
                  );
                  ((o %= 65521), (a %= 65521));
                }
                return o | (a << 16) | 0;
              };
            },
            "zlib/crc32.js": function (e, t, n) {
              "use strict";
              var s = (function () {
                for (var e = [], t = 0; t < 256; t++) {
                  for (var n = t, r = 0; r < 8; r++)
                    n = 1 & n ? 3988292384 ^ (n >>> 1) : n >>> 1;
                  e[t] = n;
                }
                return e;
              })();
              t.exports = function (e, t, n, r) {
                var o = s,
                  a = r + n;
                e ^= -1;
                for (var i = r; i < a; i++) e = (e >>> 8) ^ o[255 & (e ^ t[i])];
                return -1 ^ e;
              };
            },
            "zlib/inffast.js": function (e, t, n) {
              "use strict";
              t.exports = function (e, t) {
                var n,
                  r,
                  o,
                  a,
                  i,
                  s,
                  l = e.state,
                  c = e.next_in,
                  d = e.input,
                  u = c + (e.avail_in - 5),
                  f = e.next_out,
                  h = e.output,
                  m = f - (t - e.avail_out),
                  b = f + (e.avail_out - 257),
                  p = l.dmax,
                  g = l.wsize,
                  w = l.whave,
                  v = l.wnext,
                  y = l.window,
                  k = l.hold,
                  _ = l.bits,
                  x = l.lencode,
                  S = l.distcode,
                  E = (1 << l.lenbits) - 1,
                  C = (1 << l.distbits) - 1;
                e: do {
                  for (
                    _ < 15 &&
                      ((k += d[c++] << _),
                      (_ += 8),
                      (k += d[c++] << _),
                      (_ += 8)),
                      n = x[k & E];
                    ;
                  ) {
                    if (
                      ((k >>>= r = n >>> 24),
                      (_ -= r),
                      0 == (r = (n >>> 16) & 255))
                    )
                      h[f++] = 65535 & n;
                    else {
                      if (!(16 & r)) {
                        if (0 == (64 & r)) {
                          n = x[(65535 & n) + (k & ((1 << r) - 1))];
                          continue;
                        }
                        if (32 & r) {
                          l.mode = 12;
                          break e;
                        }
                        ((e.msg = "invalid literal/length code"),
                          (l.mode = 30));
                        break e;
                      }
                      for (
                        o = 65535 & n,
                          (r &= 15) &&
                            (_ < r && ((k += d[c++] << _), (_ += 8)),
                            (o += k & ((1 << r) - 1)),
                            (k >>>= r),
                            (_ -= r)),
                          _ < 15 &&
                            ((k += d[c++] << _),
                            (_ += 8),
                            (k += d[c++] << _),
                            (_ += 8)),
                          n = S[k & C];
                        ;
                      ) {
                        if (
                          ((k >>>= r = n >>> 24),
                          (_ -= r),
                          !(16 & (r = (n >>> 16) & 255)))
                        ) {
                          if (0 == (64 & r)) {
                            n = S[(65535 & n) + (k & ((1 << r) - 1))];
                            continue;
                          }
                          ((e.msg = "invalid distance code"), (l.mode = 30));
                          break e;
                        }
                        if (
                          ((a = 65535 & n),
                          _ < (r &= 15) &&
                            ((k += d[c++] << _),
                            (_ += 8) < r && ((k += d[c++] << _), (_ += 8))),
                          p < (a += k & ((1 << r) - 1)))
                        ) {
                          ((e.msg = "invalid distance too far back"),
                            (l.mode = 30));
                          break e;
                        }
                        if (((k >>>= r), (_ -= r), (r = f - m) < a)) {
                          if (w < (r = a - r) && l.sane) {
                            ((e.msg = "invalid distance too far back"),
                              (l.mode = 30));
                            break e;
                          }
                          if (((s = y), (i = 0) === v)) {
                            if (((i += g - r), r < o)) {
                              for (o -= r; (h[f++] = y[i++]), --r;);
                              ((i = f - a), (s = h));
                            }
                          } else if (v < r) {
                            if (((i += g + v - r), (r -= v) < o)) {
                              for (o -= r; (h[f++] = y[i++]), --r;);
                              if (((i = 0), v < o)) {
                                for (o -= r = v; (h[f++] = y[i++]), --r;);
                                ((i = f - a), (s = h));
                              }
                            }
                          } else if (((i += v - r), r < o)) {
                            for (o -= r; (h[f++] = y[i++]), --r;);
                            ((i = f - a), (s = h));
                          }
                          for (; 2 < o;)
                            ((h[f++] = s[i++]),
                              (h[f++] = s[i++]),
                              (h[f++] = s[i++]),
                              (o -= 3));
                          o && ((h[f++] = s[i++]), 1 < o && (h[f++] = s[i++]));
                        } else {
                          for (
                            i = f - a;
                            (h[f++] = h[i++]),
                              (h[f++] = h[i++]),
                              (h[f++] = h[i++]),
                              2 < (o -= 3);
                          );
                          o && ((h[f++] = h[i++]), 1 < o && (h[f++] = h[i++]));
                        }
                        break;
                      }
                    }
                    break;
                  }
                } while (c < u && f < b);
                ((k &= (1 << (_ -= (o = _ >> 3) << 3)) - 1),
                  (e.next_in = c -= o),
                  (e.next_out = f),
                  (e.avail_in = c < u ? u - c + 5 : 5 - (c - u)),
                  (e.avail_out = f < b ? b - f + 257 : 257 - (f - b)),
                  (l.hold = k),
                  (l.bits = _));
              };
            },
            "zlib/inftrees.js": function (e, t, n) {
              "use strict";
              var R = e("../utils/common"),
                z = [
                  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35,
                  43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0,
                ],
                L = [
                  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18,
                  18, 19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72,
                  78,
                ],
                O = [
                  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
                  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193,
                  12289, 16385, 24577, 0, 0,
                ],
                F = [
                  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22,
                  22, 23, 23, 24, 24, 25, 25, 26, 26, 27, 27, 28, 28, 29, 29,
                  64, 64,
                ];
              t.exports = function (e, t, n, r, o, a, i, s) {
                for (
                  var l,
                    c,
                    d,
                    u,
                    f,
                    h,
                    m,
                    b,
                    p,
                    g = s.bits,
                    w = 0,
                    v = 0,
                    y = 0,
                    k = 0,
                    _ = 0,
                    x = 0,
                    S = 0,
                    E = 0,
                    C = 0,
                    U = 0,
                    A = null,
                    T = 0,
                    P = new R.Buf16(16),
                    D = new R.Buf16(16),
                    B = null,
                    I = 0,
                    w = 0;
                  w <= 15;
                  w++
                )
                  P[w] = 0;
                for (v = 0; v < r; v++) P[t[n + v]]++;
                for (_ = g, k = 15; 1 <= k && 0 === P[k]; k--);
                if ((k < _ && (_ = k), 0 === k))
                  ((o[a++] = 20971520), (o[a++] = 20971520), (s.bits = 1));
                else {
                  for (y = 1; y < k && 0 === P[y]; y++);
                  for (_ < y && (_ = y), w = E = 1; w <= 15; w++)
                    if ((E = (E <<= 1) - P[w]) < 0) return -1;
                  if (0 < E && (0 === e || 1 !== k)) return -1;
                  for (D[1] = 0, w = 1; w < 15; w++) D[w + 1] = D[w] + P[w];
                  for (v = 0; v < r; v++)
                    0 !== t[n + v] && (i[D[t[n + v]]++] = v);
                  if (
                    ((h =
                      0 === e
                        ? ((A = B = i), 19)
                        : 1 === e
                          ? ((A = z), (T -= 257), (B = L), (I -= 257), 256)
                          : ((A = O), (B = F), -1)),
                    (w = y),
                    (f = a),
                    (S = v = U = 0),
                    (d = -1),
                    (u = (C = 1 << (x = _)) - 1),
                    (1 === e && 852 < C) || (2 === e && 592 < C))
                  )
                    return 1;
                  for (;;) {
                    for (
                      p =
                        i[v] < h
                          ? ((b = 0), i[v])
                          : i[v] > h
                            ? ((b = B[I + i[v]]), A[T + i[v]])
                            : ((b = 96), 0),
                        l = 1 << (m = w - S),
                        y = c = 1 << x;
                      (o[f + (U >> S) + (c -= l)] =
                        (m << 24) | (b << 16) | p | 0),
                        0 !== c;
                    );
                    for (l = 1 << (w - 1); U & l;) l >>= 1;
                    if (
                      ((U = 0 !== l ? (U & (l - 1)) + l : 0), v++, 0 == --P[w])
                    ) {
                      if (w === k) break;
                      w = t[n + i[v]];
                    }
                    if (_ < w && (U & u) !== d) {
                      for (
                        f += y, E = 1 << (x = w - (S = 0 === S ? _ : S));
                        x + S < k && !((E -= P[x + S]) <= 0);
                      )
                        (x++, (E <<= 1));
                      if (
                        ((C += 1 << x),
                        (1 === e && 852 < C) || (2 === e && 592 < C))
                      )
                        return 1;
                      o[(d = U & u)] = (_ << 24) | (x << 16) | (f - a) | 0;
                    }
                  }
                  (0 !== U && (o[f + U] = ((w - S) << 24) | (64 << 16) | 0),
                    (s.bits = _));
                }
                return 0;
              };
            },
          };
        for (t in n) n[t].folder = t.substring(0, t.lastIndexOf("/") + 1);
        function r(e, t) {
          var n = t.match(/^\//)
            ? null
            : e
              ? t.match(/^\.\.?\//)
                ? o(e.folder + t)
                : a(e, t)
              : o(t);
          if (n)
            return (
              n.exports ||
                ((n.parent = e), n(r.bind(null, n), n, (n.exports = {}))),
              n.exports
            );
          throw "module not found: " + t;
        }
        var o = function (e) {
            var t = [];
            return (e = e.split("/").every(function (e) {
              return ".." == e ? t.pop() : "." == e || "" == e || t.push(e);
            })
              ? t.join("/")
              : null)
              ? n[e] || n[e + ".js"] || n[e + "/index.js"]
              : null;
          },
          a = function (e, t) {
            return e
              ? o(e.folder + "node_modules/" + t) || a(e.parent, t)
              : null;
          };
        return r(null, e);
      },
      decompress: function (e) {
        this.exports || (this.exports = this.require("inflate.js"));
        try {
          return this.exports.inflate(e);
        } catch (e) {}
      },
      hasUnityMarker: function (e) {
        var t = 10,
          n = "UnityWeb Compressed Content (gzip)";
        if (t > e.length || 31 != e[0] || 139 != e[1]) return !1;
        var r = e[3];
        if (4 & r) {
          if (t + 2 > e.length) return !1;
          if ((t += 2 + e[t] + (e[t + 1] << 8)) > e.length) return !1;
        }
        if (8 & r) {
          for (; t < e.length && e[t];) t++;
          if (t + 1 > e.length) return !1;
          t++;
        }
        return (
          16 & r &&
          String.fromCharCode.apply(null, e.subarray(t, t + n.length + 1)) ==
            n + "\0"
        );
      },
    },
    br: {
      hasUnityMarker: function (e) {
        var t = "UnityWeb Compressed Content (brotli)";
        if (!e.length) return !1;
        var n = 1 & e[0] ? (14 & e[0] ? 4 : 7) : 1,
          r = e[0] & ((1 << n) - 1),
          o = 1 + ((Math.log(t.length - 1) / Math.log(2)) >> 3);
        if (
          ((commentOffset = (1 + n + 2 + 1 + 2 + (o << 3) + 7) >> 3),
          17 == r || commentOffset > e.length)
        )
          return !1;
        for (
          var a = r + ((6 + (o << 4) + ((t.length - 1) << 6)) << n), i = 0;
          i < commentOffset;
          i++, a >>>= 8
        )
          if (e[i] != (255 & a)) return !1;
        return (
          String.fromCharCode.apply(
            null,
            e.subarray(commentOffset, commentOffset + t.length),
          ) == t
        );
      },
    },
  };
