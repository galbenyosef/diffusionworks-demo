import {
  $ as e,
  Mt as t,
  N as n,
  Nt as r,
  P as i,
  Pt as a,
  a as o,
  j as s,
  jt as c,
  o as l,
  st as u,
} from "./CYlFAcRp.js";
import { c as d, i as f, o as ee, s as p, t as m, u as h } from "./bBm2T0bl.js";
function g(e) {
  if (typeof e != `object` || !e) return !1;
  let t = Object.getPrototypeOf(e);
  return (t !== null &&
    t !== Object.prototype &&
    Object.getPrototypeOf(t) !== null) ||
    Symbol.iterator in e
    ? !1
    : Symbol.toStringTag in e
      ? Object.prototype.toString.call(e) === `[object Module]`
      : !0;
}
function _(e, t, n = `.`, r) {
  if (!g(t)) return _(e, {}, n, r);
  let i = { ...t };
  for (let t of Object.keys(e)) {
    if (t === `__proto__` || t === `constructor`) continue;
    let a = e[t];
    a != null &&
      ((r && r(i, t, a, n)) ||
        (i[t] =
          Array.isArray(a) && Array.isArray(i[t])
            ? [...a, ...i[t]]
            : g(a) && g(i[t])
              ? _(a, i[t], (n ? `${n}.` : ``) + t.toString(), r)
              : a));
  }
  return i;
}
function te(e) {
  return (...t) => t.reduce((t, n) => _(t, n, ``, e), {});
}
var v = te();
function y(e, t) {
  try {
    return t in e;
  } catch {
    return !1;
  }
}
var b = class extends Error {
  static __h3_error__ = !0;
  statusCode = 500;
  fatal = !1;
  unhandled = !1;
  statusMessage;
  data;
  cause;
  constructor(e, t = {}) {
    (super(e, t), t.cause && !this.cause && (this.cause = t.cause));
  }
  toJSON() {
    let e = { message: this.message, statusCode: T(this.statusCode, 500) };
    return (
      this.statusMessage && (e.statusMessage = w(this.statusMessage)),
      this.data !== void 0 && (e.data = this.data),
      e
    );
  }
};
function x(e) {
  if (typeof e == `string`) return new b(e);
  if (S(e)) return e;
  let t = new b(e.message ?? e.statusMessage ?? ``, { cause: e.cause || e });
  if (y(e, `stack`))
    try {
      Object.defineProperty(t, "stack", {
        get() {
          return e.stack;
        },
      });
    } catch {
      try {
        t.stack = e.stack;
      } catch {}
    }
  if (
    (e.data && (t.data = e.data),
    e.statusCode
      ? (t.statusCode = T(e.statusCode, t.statusCode))
      : e.status && (t.statusCode = T(e.status, t.statusCode)),
    e.statusMessage
      ? (t.statusMessage = e.statusMessage)
      : e.statusText && (t.statusMessage = e.statusText),
    t.statusMessage)
  ) {
    let e = t.statusMessage;
    w(t.statusMessage) !== e &&
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default.",
      );
  }
  return (
    e.fatal !== void 0 && (t.fatal = e.fatal),
    e.unhandled !== void 0 && (t.unhandled = e.unhandled),
    t
  );
}
function S(e) {
  return e?.constructor?.__h3_error__ === !0;
}
var C = /[^\u0009\u0020-\u007E]/g;
function w(e = ``) {
  return e.replace(C, ``);
}
function T(e, t = 200) {
  return !e ||
    (typeof e == `string` && (e = Number.parseInt(e, 10)), e < 100 || e > 999)
    ? t
    : e;
}
(globalThis.Headers, globalThis.Response);
var E = `__nuxt_error`,
  D = (e) => !!e && typeof e == `object` && `__nuxt_error` in e,
  O = (e) => {
    if (D(e)) return e;
    typeof e != `string` && e?.statusText && (e.message ??= e.statusText);
    let t = x(e ?? {});
    return (
      Object.defineProperty(t, E, {
        value: !0,
        configurable: !1,
        writable: !1,
      }),
      Object.defineProperty(t, "status", {
        get: () => t.statusCode,
        configurable: !0,
      }),
      Object.defineProperty(t, "statusText", {
        get: () => t.statusMessage,
        configurable: !0,
      }),
      t
    );
  },
  ne = `https://a.invalid/probe/`,
  re = `https://b.invalid/probe/`;
function k(e, t = ne) {
  try {
    return new URL(e, t);
  } catch {
    return null;
  }
}
function A(e) {
  let t = k(e);
  return !!t && t.href === k(e, re)?.href;
}
function j(e) {
  return e[0] !== `/` || e[1] === `/` || e[1] === `\\`
    ? !1
    : (e[1] !== `	` &&
        e[1] !==
          `
` &&
        e[1] !== `\r`) ||
        !A(e);
}
function M(e) {
  return !!e && !j(e) && A(e);
}
function N(e) {
  if (!e || j(e)) return null;
  let t = k(e.replace(/[\u0000-\u001F\u007F\s]+/g, ``));
  for (; t?.protocol === `view-source:`;) t = k(t.pathname);
  return t ? (f(t.protocol) ? t.protocol : null) : ``;
}
function P(e) {
  return N(e) === null ? e : null;
}
var F = /bot\b|chrome-lighthouse|facebookexternalhit|google\b/i;
function I(e) {
  return F.test(e);
}
var L = Symbol(`layout-meta`),
  R = Symbol(`route`),
  z = a({ docsBase: t, reporters: r }),
  B = () => o()?.$router;
function V(e) {
  let t = e;
  return t.parent ?? t.subs?.sub;
}
function H(t) {
  let n = t.scope,
    r = e();
  for (; r;) {
    if (r === n) return !0;
    r = V(r);
  }
  return !1;
}
var U = () => {
  if (n()) {
    let e = s();
    if (!e || H(e)) return i(R, o()._route);
  }
  return o()._route;
};
function W(e) {
  return e;
}
var G = () => {
  try {
    if (o()._processingMiddleware) return !0;
  } catch {
    return !1;
  }
  return !1;
};
function K(e, t) {
  e ||= `/`;
  let n = typeof e == `string` || `path` in e,
    r = typeof e == `string` ? e : `path` in e ? q(e) : B().resolve(e).href;
  if (t?.open) {
    let e = N(r);
    if (e !== null) throw z.NUXT_E2002({ toPath: r, protocol: e });
    let i = n && !M(r) && !r.startsWith(`#`) ? ee(l().app.baseURL, r) : r,
      { target: a = `_blank`, windowFeatures: o = {} } = t.open,
      s = [];
    for (let [e, t] of Object.entries(o))
      t !== void 0 && s.push(`${e.toLowerCase()}=${t}`);
    return (open(i, a, s.join(`, `)), Promise.resolve());
  }
  let i = M(r),
    a = t?.external || i;
  if (a) {
    if (!t?.external) throw z.NUXT_E2001({ toPath: r });
    let e = N(r);
    if (e !== null) throw z.NUXT_E2002({ toPath: r, protocol: e });
  }
  let s = G();
  if (!a && s) {
    if (t?.replace) {
      if (typeof e == `string`) {
        let { pathname: t, search: n, hash: r } = d(e);
        return {
          path: t,
          ...(n && { query: p(n) }),
          ...(r && { hash: r }),
          replace: !0,
        };
      }
      return { ...e, replace: !0 };
    }
    return e;
  }
  let c = B(),
    u = o();
  if (a)
    return (
      u._cookieWriters?.forEach((e) => e()),
      window.addEventListener(
        `pagehide`,
        (e) => {
          e.persisted || u._scope.stop();
        },
        { once: !0 },
      ),
      t?.replace ? location.replace(r) : (location.href = r),
      s ? (u.isHydrating ? new Promise(() => {}) : !1) : Promise.resolve()
    );
  let f = typeof e == `string` ? J(e) : e;
  return t?.replace ? c.replace(f) : c.push(f);
}
function q(e) {
  return h(e.path || ``, e.query || {}) + (e.hash || ``);
}
function J(e) {
  let t = d(e);
  return le(m(t.pathname)) + t.search + t.hash;
}
var Y = /%7C/g,
  ie = /%5B/g,
  ae = /%5D/g,
  oe = /%252F/gi,
  se = /#/g,
  ce = /\?/g;
function le(e) {
  return encodeURI(e)
    .replace(Y, `|`)
    .replace(ie, `[`)
    .replace(ae, `]`)
    .replace(se, `%23`)
    .replace(ce, `%3F`)
    .replace(oe, `%2F`);
}
var X = () => u(o().payload, `error`),
  Z = (e) => {
    let t = O(e);
    try {
      let e = X();
      (o().hooks.callHook(`app:error`, t), (e.value ||= t));
    } catch {
      throw t;
    }
    return t;
  },
  Q = (e, t) => {
    let n = e.callHook(`app:error`, O(t));
    return (c.NUXT_E1012({ userAgent: navigator.userAgent, cause: t }), n);
  },
  $ = async (e, t) => {
    I(navigator.userAgent) ? await Q(e, t) : await e.runWithContext(() => Z(t));
  },
  ue = async (e = {}) => {
    let t = o(),
      n = X();
    (t.callHook(`app:error:cleared`, e),
      e.redirect && (await B().replace(e.redirect)),
      (n.value = void 0));
  };
export {
  j as _,
  X as a,
  D as b,
  K as c,
  B as d,
  z as f,
  I as g,
  M as h,
  Z as i,
  q as l,
  R as m,
  $ as n,
  W as o,
  L as p,
  ue as r,
  J as s,
  Q as t,
  U as u,
  P as v,
  v as x,
  O as y,
};
