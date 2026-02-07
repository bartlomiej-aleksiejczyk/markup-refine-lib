function de() {
  fe(), pe();
}
function fe() {
  document.querySelectorAll(
    "input[data-clickable-item-list-filter]"
  ).forEach((e) => {
    const t = e.parentElement.querySelector(".clickable-item-list") || e.nextElementSibling;
    if (!t || !t.classList.contains("clickable-item-list")) {
      console.warn("No clickable-item-list found near filter input");
      return;
    }
    e.addEventListener("input", () => {
      const s = e.value.trim().toLowerCase(), i = [], o = [];
      for (o.push({ ul: t, parentLi: null }); o.length; ) {
        const { ul: r, parentLi: c } = o.pop(), l = Array.from(r.children).filter((a) => a.tagName === "LI");
        for (const a of l) {
          i.push({ li: a, parentLi: c });
          const u = a.querySelector(":scope > ul");
          u && o.push({ ul: u, parentLi: a });
        }
      }
      for (const r of i) {
        const c = r.li.textContent.toLowerCase();
        r.selfMatches = s === "" || c.includes(s), r.childrenMatch = !1;
      }
      for (let r = i.length - 1; r >= 0; r--) {
        const c = i[r], a = c.li.querySelector(":scope > ul");
        if (a) {
          const u = Array.from(a.children).filter(
            (h) => h.tagName === "LI"
          );
          c.childrenMatch = u.some((h) => {
            const d = i.find((p) => p.li === h);
            return d && (d.selfMatches || d.childrenMatch);
          });
        }
        if (c.parentLi) {
          const u = i.find((h) => h.li === c.parentLi);
          u && (c.selfMatches || c.childrenMatch) && (u.childrenMatch = !0);
        }
      }
      for (const r of i) {
        const c = r.li, l = c.querySelector(":scope > ul"), a = c.querySelector("details"), u = r.selfMatches || r.childrenMatch;
        c.style.display = u ? "" : "none", a && (u ? a.open = !0 : a.open = !1), r.selfMatches && l && Array.from(l.children).filter(
          (d) => d.tagName === "LI"
        ).forEach((d) => {
          d.style.display = "";
        });
      }
    });
  });
}
function pe() {
  const n = window.location.origin + window.location.pathname;
  document.querySelectorAll(
    "ul[data-clickable-item-list-autoselector]"
  ).forEach((t) => {
    const s = t.querySelectorAll("a[href]");
    let i = 0;
    s.forEach((o) => {
      const r = new URL(
        o.getAttribute("href"),
        window.location.origin + window.location.pathname
      ).href, c = n.endsWith("/") ? n.slice(0, -1) : n, l = r.endsWith("/") ? r.slice(0, -1) : r;
      if (c === l) {
        const a = o.closest("li");
        a && t.contains(a) && (a.classList.add("clickable-item-list--selected"), i++);
      }
      if (i > 1) {
        s.forEach((a) => a.classList.remove("clickable-item-list--selected"));
        return;
      }
    });
  });
}
function me() {
  document.querySelectorAll("[data-copyable-snippet]").forEach((t) => {
    if (t.querySelector("code") && !t.querySelector(".copyable-snippet-button")) {
      const i = document.createElement("button");
      i.className = "copyable-snippet-button", i.setAttribute("aria-label", "Copy"), i.textContent = "📋", t.appendChild(i), i.addEventListener("click", n);
    }
  });
  function n(t) {
    const s = t.target.closest(".copyable-snippet-button");
    if (!s) return;
    const i = s.closest("[data-copyable-snippet]");
    if (!i) return;
    const o = i.querySelector("code");
    if (!o) return;
    const r = o.textContent;
    if (!r) return;
    const c = s.textContent;
    navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(r).then(() => {
      s.disabled = !0, s.textContent = "✅", setTimeout(() => {
        s.textContent = c, s.disabled = !1;
      }, 1e3);
    }).catch(() => e(r, s, c)) : e(r, s, c);
  }
  function e(t, s, i) {
    const o = document.createElement("textarea");
    o.value = t, o.style.position = "fixed", o.style.opacity = "0", document.body.appendChild(o), o.select();
    try {
      document.execCommand("copy") ? s.textContent = "✅" : s.textContent = "❌";
    } catch (r) {
      console.warn("Fallback copy failed:", r), s.textContent = "❌";
    }
    document.body.removeChild(o), setTimeout(() => s.textContent = i, 1e3);
  }
}
function I(n) {
  return Array.isArray ? Array.isArray(n) : re(n) === "[object Array]";
}
function ge(n) {
  if (typeof n == "string")
    return n;
  let e = n + "";
  return e == "0" && 1 / n == -1 / 0 ? "-0" : e;
}
function ye(n) {
  return n == null ? "" : ge(n);
}
function k(n) {
  return typeof n == "string";
}
function se(n) {
  return typeof n == "number";
}
function Ae(n) {
  return n === !0 || n === !1 || Ee(n) && re(n) == "[object Boolean]";
}
function ie(n) {
  return typeof n == "object";
}
function Ee(n) {
  return ie(n) && n !== null;
}
function F(n) {
  return n != null;
}
function P(n) {
  return !n.trim().length;
}
function re(n) {
  return n == null ? n === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(n);
}
const Ce = "Incorrect 'index' type", be = (n) => `Invalid value for key ${n}`, Me = (n) => `Pattern length exceeds max of ${n}.`, xe = (n) => `Missing ${n} property in key`, Se = (n) => `Property 'weight' in key '${n}' must be a positive integer`, J = Object.prototype.hasOwnProperty;
class Fe {
  constructor(e) {
    this._keys = [], this._keyMap = {};
    let t = 0;
    e.forEach((s) => {
      let i = ce(s);
      this._keys.push(i), this._keyMap[i.id] = i, t += i.weight;
    }), this._keys.forEach((s) => {
      s.weight /= t;
    });
  }
  get(e) {
    return this._keyMap[e];
  }
  keys() {
    return this._keys;
  }
  toJSON() {
    return JSON.stringify(this._keys);
  }
}
function ce(n) {
  let e = null, t = null, s = null, i = 1, o = null;
  if (k(n) || I(n))
    s = n, e = Z(n), t = z(n);
  else {
    if (!J.call(n, "name"))
      throw new Error(xe("name"));
    const r = n.name;
    if (s = r, J.call(n, "weight") && (i = n.weight, i <= 0))
      throw new Error(Se(r));
    e = Z(r), t = z(r), o = n.getFn;
  }
  return { path: e, id: t, weight: i, src: s, getFn: o };
}
function Z(n) {
  return I(n) ? n : n.split(".");
}
function z(n) {
  return I(n) ? n.join(".") : n;
}
function we(n, e) {
  let t = [], s = !1;
  const i = (o, r, c) => {
    if (F(o))
      if (!r[c])
        t.push(o);
      else {
        let l = r[c];
        const a = o[l];
        if (!F(a))
          return;
        if (c === r.length - 1 && (k(a) || se(a) || Ae(a)))
          t.push(ye(a));
        else if (I(a)) {
          s = !0;
          for (let u = 0, h = a.length; u < h; u += 1)
            i(a[u], r, c + 1);
        } else r.length && i(a, r, c + 1);
      }
  };
  return i(n, k(e) ? e.split(".") : e, 0), s ? t : t[0];
}
const Be = {
  // Whether the matches should be included in the result set. When `true`, each record in the result
  // set will include the indices of the matched characters.
  // These can consequently be used for highlighting purposes.
  includeMatches: !1,
  // When `true`, the matching function will continue to the end of a search pattern even if
  // a perfect match has already been located in the string.
  findAllMatches: !1,
  // Minimum number of characters that must be matched before a result is considered a match
  minMatchCharLength: 1
}, ve = {
  // When `true`, the algorithm continues searching to the end of the input even if a perfect
  // match is found before the end of the same input.
  isCaseSensitive: !1,
  // When `true`, the algorithm will ignore diacritics (accents) in comparisons
  ignoreDiacritics: !1,
  // When true, the matching function will continue to the end of a search pattern even if
  includeScore: !1,
  // List of properties that will be searched. This also supports nested properties.
  keys: [],
  // Whether to sort the result list, by score
  shouldSort: !0,
  // Default sort function: sort by ascending score, ascending index
  sortFn: (n, e) => n.score === e.score ? n.idx < e.idx ? -1 : 1 : n.score < e.score ? -1 : 1
}, De = {
  // Approximately where in the text is the pattern expected to be found?
  location: 0,
  // At what point does the match algorithm give up. A threshold of '0.0' requires a perfect match
  // (of both letters and location), a threshold of '1.0' would match anything.
  threshold: 0.6,
  // Determines how close the match must be to the fuzzy location (specified above).
  // An exact letter match which is 'distance' characters away from the fuzzy location
  // would score as a complete mismatch. A distance of '0' requires the match be at
  // the exact location specified, a threshold of '1000' would require a perfect match
  // to be within 800 characters of the fuzzy location to be found using a 0.8 threshold.
  distance: 100
}, Le = {
  // When `true`, it enables the use of unix-like search commands
  useExtendedSearch: !1,
  // The get function to use when fetching an object's properties.
  // The default will search nested paths *ie foo.bar.baz*
  getFn: we,
  // When `true`, search will ignore `location` and `distance`, so it won't matter
  // where in the string the pattern appears.
  // More info: https://fusejs.io/concepts/scoring-theory.html#fuzziness-score
  ignoreLocation: !1,
  // When `true`, the calculation for the relevance score (used for sorting) will
  // ignore the field-length norm.
  // More info: https://fusejs.io/concepts/scoring-theory.html#field-length-norm
  ignoreFieldNorm: !1,
  // The weight to determine how much field length norm effects scoring.
  fieldNormWeight: 1
};
var f = {
  ...ve,
  ...Be,
  ...De,
  ...Le
};
const ke = /[^ ]+/g;
function Ie(n = 1, e = 3) {
  const t = /* @__PURE__ */ new Map(), s = Math.pow(10, e);
  return {
    get(i) {
      const o = i.match(ke).length;
      if (t.has(o))
        return t.get(o);
      const r = 1 / Math.pow(o, 0.5 * n), c = parseFloat(Math.round(r * s) / s);
      return t.set(o, c), c;
    },
    clear() {
      t.clear();
    }
  };
}
class Y {
  constructor({
    getFn: e = f.getFn,
    fieldNormWeight: t = f.fieldNormWeight
  } = {}) {
    this.norm = Ie(t, 3), this.getFn = e, this.isCreated = !1, this.setIndexRecords();
  }
  setSources(e = []) {
    this.docs = e;
  }
  setIndexRecords(e = []) {
    this.records = e;
  }
  setKeys(e = []) {
    this.keys = e, this._keysMap = {}, e.forEach((t, s) => {
      this._keysMap[t.id] = s;
    });
  }
  create() {
    this.isCreated || !this.docs.length || (this.isCreated = !0, k(this.docs[0]) ? this.docs.forEach((e, t) => {
      this._addString(e, t);
    }) : this.docs.forEach((e, t) => {
      this._addObject(e, t);
    }), this.norm.clear());
  }
  // Adds a doc to the end of the index
  add(e) {
    const t = this.size();
    k(e) ? this._addString(e, t) : this._addObject(e, t);
  }
  // Removes the doc at the specified index of the index
  removeAt(e) {
    this.records.splice(e, 1);
    for (let t = e, s = this.size(); t < s; t += 1)
      this.records[t].i -= 1;
  }
  getValueForItemAtKeyId(e, t) {
    return e[this._keysMap[t]];
  }
  size() {
    return this.records.length;
  }
  _addString(e, t) {
    if (!F(e) || P(e))
      return;
    let s = {
      v: e,
      i: t,
      n: this.norm.get(e)
    };
    this.records.push(s);
  }
  _addObject(e, t) {
    let s = { i: t, $: {} };
    this.keys.forEach((i, o) => {
      let r = i.getFn ? i.getFn(e) : this.getFn(e, i.path);
      if (F(r)) {
        if (I(r)) {
          let c = [];
          const l = [{ nestedArrIndex: -1, value: r }];
          for (; l.length; ) {
            const { nestedArrIndex: a, value: u } = l.pop();
            if (F(u))
              if (k(u) && !P(u)) {
                let h = {
                  v: u,
                  i: a,
                  n: this.norm.get(u)
                };
                c.push(h);
              } else I(u) && u.forEach((h, d) => {
                l.push({
                  nestedArrIndex: d,
                  value: h
                });
              });
          }
          s.$[o] = c;
        } else if (k(r) && !P(r)) {
          let c = {
            v: r,
            n: this.norm.get(r)
          };
          s.$[o] = c;
        }
      }
    }), this.records.push(s);
  }
  toJSON() {
    return {
      keys: this.keys,
      records: this.records
    };
  }
}
function oe(n, e, { getFn: t = f.getFn, fieldNormWeight: s = f.fieldNormWeight } = {}) {
  const i = new Y({ getFn: t, fieldNormWeight: s });
  return i.setKeys(n.map(ce)), i.setSources(e), i.create(), i;
}
function _e(n, { getFn: e = f.getFn, fieldNormWeight: t = f.fieldNormWeight } = {}) {
  const { keys: s, records: i } = n, o = new Y({ getFn: e, fieldNormWeight: t });
  return o.setKeys(s), o.setIndexRecords(i), o;
}
function O(n, {
  errors: e = 0,
  currentLocation: t = 0,
  expectedLocation: s = 0,
  distance: i = f.distance,
  ignoreLocation: o = f.ignoreLocation
} = {}) {
  const r = e / n.length;
  if (o)
    return r;
  const c = Math.abs(s - t);
  return i ? r + c / i : c ? 1 : r;
}
function Te(n = [], e = f.minMatchCharLength) {
  let t = [], s = -1, i = -1, o = 0;
  for (let r = n.length; o < r; o += 1) {
    let c = n[o];
    c && s === -1 ? s = o : !c && s !== -1 && (i = o - 1, i - s + 1 >= e && t.push([s, i]), s = -1);
  }
  return n[o - 1] && o - s >= e && t.push([s, o - 1]), t;
}
const N = 32;
function Ne(n, e, t, {
  location: s = f.location,
  distance: i = f.distance,
  threshold: o = f.threshold,
  findAllMatches: r = f.findAllMatches,
  minMatchCharLength: c = f.minMatchCharLength,
  includeMatches: l = f.includeMatches,
  ignoreLocation: a = f.ignoreLocation
} = {}) {
  if (e.length > N)
    throw new Error(Me(N));
  const u = e.length, h = n.length, d = Math.max(0, Math.min(s, h));
  let p = o, m = d;
  const g = c > 1 || l, A = g ? Array(h) : [];
  let y;
  for (; (y = n.indexOf(e, m)) > -1; ) {
    let C = O(e, {
      currentLocation: y,
      expectedLocation: d,
      distance: i,
      ignoreLocation: a
    });
    if (p = Math.min(C, p), m = y + u, g) {
      let v = 0;
      for (; v < u; )
        A[y + v] = 1, v += 1;
    }
  }
  m = -1;
  let M = [], E = 1, x = u + h;
  const S = 1 << u - 1;
  for (let C = 0; C < u; C += 1) {
    let v = 0, b = x;
    for (; v < b; )
      O(e, {
        errors: C,
        currentLocation: d + b,
        expectedLocation: d,
        distance: i,
        ignoreLocation: a
      }) <= p ? v = b : x = b, b = Math.floor((x - v) / 2 + v);
    x = b;
    let w = Math.max(1, d - b + 1), D = r ? h : Math.min(d + b, h) + u, L = Array(D + 2);
    L[D + 1] = (1 << C) - 1;
    for (let B = D; B >= w; B -= 1) {
      let $ = B - 1, Q = t[n.charAt($)];
      if (g && (A[$] = +!!Q), L[B] = (L[B + 1] << 1 | 1) & Q, C && (L[B] |= (M[B + 1] | M[B]) << 1 | 1 | M[B + 1]), L[B] & S && (E = O(e, {
        errors: C,
        currentLocation: $,
        expectedLocation: d,
        distance: i,
        ignoreLocation: a
      }), E <= p)) {
        if (p = E, m = $, m <= d)
          break;
        w = Math.max(1, 2 * d - m);
      }
    }
    if (O(e, {
      errors: C + 1,
      currentLocation: d,
      expectedLocation: d,
      distance: i,
      ignoreLocation: a
    }) > p)
      break;
    M = L;
  }
  const T = {
    isMatch: m >= 0,
    // Count exact matches (those with a score of 0) to be "almost" exact
    score: Math.max(1e-3, E)
  };
  if (g) {
    const C = Te(A, c);
    C.length ? l && (T.indices = C) : T.isMatch = !1;
  }
  return T;
}
function Re(n) {
  let e = {};
  for (let t = 0, s = n.length; t < s; t += 1) {
    const i = n.charAt(t);
    e[i] = (e[i] || 0) | 1 << s - t - 1;
  }
  return e;
}
const j = String.prototype.normalize ? ((n) => n.normalize("NFD").replace(/[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]/g, "")) : ((n) => n);
class ae {
  constructor(e, {
    location: t = f.location,
    threshold: s = f.threshold,
    distance: i = f.distance,
    includeMatches: o = f.includeMatches,
    findAllMatches: r = f.findAllMatches,
    minMatchCharLength: c = f.minMatchCharLength,
    isCaseSensitive: l = f.isCaseSensitive,
    ignoreDiacritics: a = f.ignoreDiacritics,
    ignoreLocation: u = f.ignoreLocation
  } = {}) {
    if (this.options = {
      location: t,
      threshold: s,
      distance: i,
      includeMatches: o,
      findAllMatches: r,
      minMatchCharLength: c,
      isCaseSensitive: l,
      ignoreDiacritics: a,
      ignoreLocation: u
    }, e = l ? e : e.toLowerCase(), e = a ? j(e) : e, this.pattern = e, this.chunks = [], !this.pattern.length)
      return;
    const h = (p, m) => {
      this.chunks.push({
        pattern: p,
        alphabet: Re(p),
        startIndex: m
      });
    }, d = this.pattern.length;
    if (d > N) {
      let p = 0;
      const m = d % N, g = d - m;
      for (; p < g; )
        h(this.pattern.substr(p, N), p), p += N;
      if (m) {
        const A = d - N;
        h(this.pattern.substr(A), A);
      }
    } else
      h(this.pattern, 0);
  }
  searchIn(e) {
    const { isCaseSensitive: t, ignoreDiacritics: s, includeMatches: i } = this.options;
    if (e = t ? e : e.toLowerCase(), e = s ? j(e) : e, this.pattern === e) {
      let g = {
        isMatch: !0,
        score: 0
      };
      return i && (g.indices = [[0, e.length - 1]]), g;
    }
    const {
      location: o,
      distance: r,
      threshold: c,
      findAllMatches: l,
      minMatchCharLength: a,
      ignoreLocation: u
    } = this.options;
    let h = [], d = 0, p = !1;
    this.chunks.forEach(({ pattern: g, alphabet: A, startIndex: y }) => {
      const { isMatch: M, score: E, indices: x } = Ne(e, g, A, {
        location: o + y,
        distance: r,
        threshold: c,
        findAllMatches: l,
        minMatchCharLength: a,
        includeMatches: i,
        ignoreLocation: u
      });
      M && (p = !0), d += E, M && x && (h = [...h, ...x]);
    });
    let m = {
      isMatch: p,
      score: p ? d / this.chunks.length : 1
    };
    return p && i && (m.indices = h), m;
  }
}
class _ {
  constructor(e) {
    this.pattern = e;
  }
  static isMultiMatch(e) {
    return X(e, this.multiRegex);
  }
  static isSingleMatch(e) {
    return X(e, this.singleRegex);
  }
  search() {
  }
}
function X(n, e) {
  const t = n.match(e);
  return t ? t[1] : null;
}
class $e extends _ {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "exact";
  }
  static get multiRegex() {
    return /^="(.*)"$/;
  }
  static get singleRegex() {
    return /^=(.*)$/;
  }
  search(e) {
    const t = e === this.pattern;
    return {
      isMatch: t,
      score: t ? 0 : 1,
      indices: [0, this.pattern.length - 1]
    };
  }
}
class Oe extends _ {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "inverse-exact";
  }
  static get multiRegex() {
    return /^!"(.*)"$/;
  }
  static get singleRegex() {
    return /^!(.*)$/;
  }
  search(e) {
    const s = e.indexOf(this.pattern) === -1;
    return {
      isMatch: s,
      score: s ? 0 : 1,
      indices: [0, e.length - 1]
    };
  }
}
class je extends _ {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "prefix-exact";
  }
  static get multiRegex() {
    return /^\^"(.*)"$/;
  }
  static get singleRegex() {
    return /^\^(.*)$/;
  }
  search(e) {
    const t = e.startsWith(this.pattern);
    return {
      isMatch: t,
      score: t ? 0 : 1,
      indices: [0, this.pattern.length - 1]
    };
  }
}
class qe extends _ {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "inverse-prefix-exact";
  }
  static get multiRegex() {
    return /^!\^"(.*)"$/;
  }
  static get singleRegex() {
    return /^!\^(.*)$/;
  }
  search(e) {
    const t = !e.startsWith(this.pattern);
    return {
      isMatch: t,
      score: t ? 0 : 1,
      indices: [0, e.length - 1]
    };
  }
}
class Pe extends _ {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "suffix-exact";
  }
  static get multiRegex() {
    return /^"(.*)"\$$/;
  }
  static get singleRegex() {
    return /^(.*)\$$/;
  }
  search(e) {
    const t = e.endsWith(this.pattern);
    return {
      isMatch: t,
      score: t ? 0 : 1,
      indices: [e.length - this.pattern.length, e.length - 1]
    };
  }
}
class ze extends _ {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "inverse-suffix-exact";
  }
  static get multiRegex() {
    return /^!"(.*)"\$$/;
  }
  static get singleRegex() {
    return /^!(.*)\$$/;
  }
  search(e) {
    const t = !e.endsWith(this.pattern);
    return {
      isMatch: t,
      score: t ? 0 : 1,
      indices: [0, e.length - 1]
    };
  }
}
class le extends _ {
  constructor(e, {
    location: t = f.location,
    threshold: s = f.threshold,
    distance: i = f.distance,
    includeMatches: o = f.includeMatches,
    findAllMatches: r = f.findAllMatches,
    minMatchCharLength: c = f.minMatchCharLength,
    isCaseSensitive: l = f.isCaseSensitive,
    ignoreDiacritics: a = f.ignoreDiacritics,
    ignoreLocation: u = f.ignoreLocation
  } = {}) {
    super(e), this._bitapSearch = new ae(e, {
      location: t,
      threshold: s,
      distance: i,
      includeMatches: o,
      findAllMatches: r,
      minMatchCharLength: c,
      isCaseSensitive: l,
      ignoreDiacritics: a,
      ignoreLocation: u
    });
  }
  static get type() {
    return "fuzzy";
  }
  static get multiRegex() {
    return /^"(.*)"$/;
  }
  static get singleRegex() {
    return /^(.*)$/;
  }
  search(e) {
    return this._bitapSearch.searchIn(e);
  }
}
class ue extends _ {
  constructor(e) {
    super(e);
  }
  static get type() {
    return "include";
  }
  static get multiRegex() {
    return /^'"(.*)"$/;
  }
  static get singleRegex() {
    return /^'(.*)$/;
  }
  search(e) {
    let t = 0, s;
    const i = [], o = this.pattern.length;
    for (; (s = e.indexOf(this.pattern, t)) > -1; )
      t = s + o, i.push([s, t - 1]);
    const r = !!i.length;
    return {
      isMatch: r,
      score: r ? 0 : 1,
      indices: i
    };
  }
}
const U = [
  $e,
  ue,
  je,
  qe,
  ze,
  Pe,
  Oe,
  le
], ee = U.length, Ue = / +(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/, We = "|";
function Ke(n, e = {}) {
  return n.split(We).map((t) => {
    let s = t.trim().split(Ue).filter((o) => o && !!o.trim()), i = [];
    for (let o = 0, r = s.length; o < r; o += 1) {
      const c = s[o];
      let l = !1, a = -1;
      for (; !l && ++a < ee; ) {
        const u = U[a];
        let h = u.isMultiMatch(c);
        h && (i.push(new u(h, e)), l = !0);
      }
      if (!l)
        for (a = -1; ++a < ee; ) {
          const u = U[a];
          let h = u.isSingleMatch(c);
          if (h) {
            i.push(new u(h, e));
            break;
          }
        }
    }
    return i;
  });
}
const He = /* @__PURE__ */ new Set([le.type, ue.type]);
class Ge {
  constructor(e, {
    isCaseSensitive: t = f.isCaseSensitive,
    ignoreDiacritics: s = f.ignoreDiacritics,
    includeMatches: i = f.includeMatches,
    minMatchCharLength: o = f.minMatchCharLength,
    ignoreLocation: r = f.ignoreLocation,
    findAllMatches: c = f.findAllMatches,
    location: l = f.location,
    threshold: a = f.threshold,
    distance: u = f.distance
  } = {}) {
    this.query = null, this.options = {
      isCaseSensitive: t,
      ignoreDiacritics: s,
      includeMatches: i,
      minMatchCharLength: o,
      findAllMatches: c,
      ignoreLocation: r,
      location: l,
      threshold: a,
      distance: u
    }, e = t ? e : e.toLowerCase(), e = s ? j(e) : e, this.pattern = e, this.query = Ke(this.pattern, this.options);
  }
  static condition(e, t) {
    return t.useExtendedSearch;
  }
  searchIn(e) {
    const t = this.query;
    if (!t)
      return {
        isMatch: !1,
        score: 1
      };
    const { includeMatches: s, isCaseSensitive: i, ignoreDiacritics: o } = this.options;
    e = i ? e : e.toLowerCase(), e = o ? j(e) : e;
    let r = 0, c = [], l = 0;
    for (let a = 0, u = t.length; a < u; a += 1) {
      const h = t[a];
      c.length = 0, r = 0;
      for (let d = 0, p = h.length; d < p; d += 1) {
        const m = h[d], { isMatch: g, indices: A, score: y } = m.search(e);
        if (g) {
          if (r += 1, l += y, s) {
            const M = m.constructor.type;
            He.has(M) ? c = [...c, ...A] : c.push(A);
          }
        } else {
          l = 0, r = 0, c.length = 0;
          break;
        }
      }
      if (r) {
        let d = {
          isMatch: !0,
          score: l / r
        };
        return s && (d.indices = c), d;
      }
    }
    return {
      isMatch: !1,
      score: 1
    };
  }
}
const W = [];
function Ye(...n) {
  W.push(...n);
}
function K(n, e) {
  for (let t = 0, s = W.length; t < s; t += 1) {
    let i = W[t];
    if (i.condition(n, e))
      return new i(n, e);
  }
  return new ae(n, e);
}
const q = {
  AND: "$and",
  OR: "$or"
}, H = {
  PATH: "$path",
  PATTERN: "$val"
}, G = (n) => !!(n[q.AND] || n[q.OR]), Ve = (n) => !!n[H.PATH], Qe = (n) => !I(n) && ie(n) && !G(n), te = (n) => ({
  [q.AND]: Object.keys(n).map((e) => ({
    [e]: n[e]
  }))
});
function he(n, e, { auto: t = !0 } = {}) {
  const s = (i) => {
    let o = Object.keys(i);
    const r = Ve(i);
    if (!r && o.length > 1 && !G(i))
      return s(te(i));
    if (Qe(i)) {
      const l = r ? i[H.PATH] : o[0], a = r ? i[H.PATTERN] : i[l];
      if (!k(a))
        throw new Error(be(l));
      const u = {
        keyId: z(l),
        pattern: a
      };
      return t && (u.searcher = K(a, e)), u;
    }
    let c = {
      children: [],
      operator: o[0]
    };
    return o.forEach((l) => {
      const a = i[l];
      I(a) && a.forEach((u) => {
        c.children.push(s(u));
      });
    }), c;
  };
  return G(n) || (n = te(n)), s(n);
}
function Je(n, { ignoreFieldNorm: e = f.ignoreFieldNorm }) {
  n.forEach((t) => {
    let s = 1;
    t.matches.forEach(({ key: i, norm: o, score: r }) => {
      const c = i ? i.weight : null;
      s *= Math.pow(
        r === 0 && c ? Number.EPSILON : r,
        (c || 1) * (e ? 1 : o)
      );
    }), t.score = s;
  });
}
function Ze(n, e) {
  const t = n.matches;
  e.matches = [], F(t) && t.forEach((s) => {
    if (!F(s.indices) || !s.indices.length)
      return;
    const { indices: i, value: o } = s;
    let r = {
      indices: i,
      value: o
    };
    s.key && (r.key = s.key.src), s.idx > -1 && (r.refIndex = s.idx), e.matches.push(r);
  });
}
function Xe(n, e) {
  e.score = n.score;
}
function et(n, e, {
  includeMatches: t = f.includeMatches,
  includeScore: s = f.includeScore
} = {}) {
  const i = [];
  return t && i.push(Ze), s && i.push(Xe), n.map((o) => {
    const { idx: r } = o, c = {
      item: e[r],
      refIndex: r
    };
    return i.length && i.forEach((l) => {
      l(o, c);
    }), c;
  });
}
class R {
  constructor(e, t = {}, s) {
    this.options = { ...f, ...t }, this.options.useExtendedSearch, this._keyStore = new Fe(this.options.keys), this.setCollection(e, s);
  }
  setCollection(e, t) {
    if (this._docs = e, t && !(t instanceof Y))
      throw new Error(Ce);
    this._myIndex = t || oe(this.options.keys, this._docs, {
      getFn: this.options.getFn,
      fieldNormWeight: this.options.fieldNormWeight
    });
  }
  add(e) {
    F(e) && (this._docs.push(e), this._myIndex.add(e));
  }
  remove(e = () => !1) {
    const t = [];
    for (let s = 0, i = this._docs.length; s < i; s += 1) {
      const o = this._docs[s];
      e(o, s) && (this.removeAt(s), s -= 1, i -= 1, t.push(o));
    }
    return t;
  }
  removeAt(e) {
    this._docs.splice(e, 1), this._myIndex.removeAt(e);
  }
  getIndex() {
    return this._myIndex;
  }
  search(e, { limit: t = -1 } = {}) {
    const {
      includeMatches: s,
      includeScore: i,
      shouldSort: o,
      sortFn: r,
      ignoreFieldNorm: c
    } = this.options;
    let l = k(e) ? k(this._docs[0]) ? this._searchStringList(e) : this._searchObjectList(e) : this._searchLogical(e);
    return Je(l, { ignoreFieldNorm: c }), o && l.sort(r), se(t) && t > -1 && (l = l.slice(0, t)), et(l, this._docs, {
      includeMatches: s,
      includeScore: i
    });
  }
  _searchStringList(e) {
    const t = K(e, this.options), { records: s } = this._myIndex, i = [];
    return s.forEach(({ v: o, i: r, n: c }) => {
      if (!F(o))
        return;
      const { isMatch: l, score: a, indices: u } = t.searchIn(o);
      l && i.push({
        item: o,
        idx: r,
        matches: [{ score: a, value: o, norm: c, indices: u }]
      });
    }), i;
  }
  _searchLogical(e) {
    const t = he(e, this.options), s = (c, l, a) => {
      if (!c.children) {
        const { keyId: h, searcher: d } = c, p = this._findMatches({
          key: this._keyStore.get(h),
          value: this._myIndex.getValueForItemAtKeyId(l, h),
          searcher: d
        });
        return p && p.length ? [
          {
            idx: a,
            item: l,
            matches: p
          }
        ] : [];
      }
      const u = [];
      for (let h = 0, d = c.children.length; h < d; h += 1) {
        const p = c.children[h], m = s(p, l, a);
        if (m.length)
          u.push(...m);
        else if (c.operator === q.AND)
          return [];
      }
      return u;
    }, i = this._myIndex.records, o = {}, r = [];
    return i.forEach(({ $: c, i: l }) => {
      if (F(c)) {
        let a = s(t, c, l);
        a.length && (o[l] || (o[l] = { idx: l, item: c, matches: [] }, r.push(o[l])), a.forEach(({ matches: u }) => {
          o[l].matches.push(...u);
        }));
      }
    }), r;
  }
  _searchObjectList(e) {
    const t = K(e, this.options), { keys: s, records: i } = this._myIndex, o = [];
    return i.forEach(({ $: r, i: c }) => {
      if (!F(r))
        return;
      let l = [];
      s.forEach((a, u) => {
        l.push(
          ...this._findMatches({
            key: a,
            value: r[u],
            searcher: t
          })
        );
      }), l.length && o.push({
        idx: c,
        item: r,
        matches: l
      });
    }), o;
  }
  _findMatches({ key: e, value: t, searcher: s }) {
    if (!F(t))
      return [];
    let i = [];
    if (I(t))
      t.forEach(({ v: o, i: r, n: c }) => {
        if (!F(o))
          return;
        const { isMatch: l, score: a, indices: u } = s.searchIn(o);
        l && i.push({
          score: a,
          key: e,
          value: o,
          idx: r,
          norm: c,
          indices: u
        });
      });
    else {
      const { v: o, n: r } = t, { isMatch: c, score: l, indices: a } = s.searchIn(o);
      c && i.push({ score: l, key: e, value: o, norm: r, indices: a });
    }
    return i;
  }
}
R.version = "7.1.0";
R.createIndex = oe;
R.parseIndex = _e;
R.config = f;
R.parseQuery = he;
Ye(Ge);
function tt() {
  const n = document.querySelectorAll("[data-search-tool]");
  for (const r of n)
    r.addEventListener("click", async () => {
      const c = r.getAttribute("data-static-url") || "", l = r.getAttribute("data-dynamic-url") || "", a = c && !l ? "static" : l && !c ? "dynamic" : null;
      let u = !1;
      const {
        overlay: h,
        modal: d,
        input: p,
        results: m,
        searchIcon: g,
        spinner: A,
        message: y,
        dismissBtn: M,
        resultCount: E
      } = e();
      document.body.appendChild(h), document.body.appendChild(d), y.style.display = "none", E.style.display = "none", p.focus();
      let x = null, S = null;
      if (a === "static" && c) {
        g.style.display = "none", A.style.display = "block";
        try {
          S = await (await fetch(c)).json(), x = new R(S, {
            includeScore: !1,
            includeMatches: !0,
            useExtendedSearch: !0,
            minMatchCharLength: 2,
            distance: 1e4,
            threshold: 0.4,
            keys: [
              { name: "title", weight: 0.7 },
              { name: "content", weight: 0.3 }
            ]
          });
        } catch (b) {
          u = !0, y.style.display = "block", y.textContent = "⚠️ Failed to load search index, please refresh the page.", console.error("Static fetch failed:", b);
        } finally {
          A.style.display = "none", g.style.display = "block";
        }
      }
      async function T(b) {
        if (m.innerHTML = "", y.textContent = "", y.style.display = "none", E.textContent = "", E.style.display = "none", !b) {
          A.style.display = "none", g.style.display = "none";
          return;
        }
        if (u || (g.style.display = "none", A.style.display = "block"), a === "static" && x) {
          const w = x.search(b);
          w.length === 0 ? (y.style.display = "block", y.textContent = "No results found.") : (E.style.display = "block", E.textContent = `Found ${w.length} result(s).`, w.forEach((D) => {
            t(
              m,
              D.item,
              D.matches || [],
              D.score ?? null
            );
          })), A.style.display = "none", g.style.display = "block";
          return;
        }
        if (a === "dynamic" && l)
          try {
            const D = await (await fetch(l + encodeURIComponent(b))).json(), L = Array.isArray(D.results) ? D.results : [];
            L.length === 0 ? (y.style.display = "block", y.textContent = "No results found.") : (E.style.display = "block", E.textContent = `Found ${L.length} result(s).`, L.forEach((V) => {
              t(m, V);
            }));
          } catch (w) {
            y.style.display = "block", y.textContent = "🔎 Failed to fetch results.", console.error("Dynamic fetch failed:", w);
          } finally {
            A.style.display = "none", g.style.display = "block";
          }
      }
      let C = null;
      const v = 800;
      p.addEventListener("input", () => {
        const b = p.value.trim();
        if (!b) {
          C !== null && (clearTimeout(C), C = null), m.innerHTML = "", y.textContent = "", y.style.display = "none", E.textContent = "", E.style.display = "none", A.style.display = "none", g.style.display = "block";
          return;
        }
        C !== null && clearTimeout(C), C = window.setTimeout(() => {
          T(b);
        }, v);
      }), h.onclick = () => o(d, h), M.onclick = () => o(d, h), document.addEventListener("keydown", function b(w) {
        w.key === "Escape" && (o(d, h), document.removeEventListener("keydown", b));
      });
    });
  function e() {
    const r = document.createElement("div");
    r.className = "search-tool-overlay";
    const c = document.createElement("div");
    c.className = "search-tool-modal";
    const l = document.createElement("input");
    l.className = "search-tool-input", l.type = "text", l.placeholder = "Search...";
    const a = document.createElement("button");
    a.className = "search-tool-dismiss", a.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
        <path d="m251.33-204.67-46.66-46.66L433.33-480 204.67-708.67l46.66-46.66L480-526.67l228.67-228.66 46.66 46.66L526.67-480l228.66 228.67-46.66 46.66L480-433.33 251.33-204.67Z"/>
      </svg>`;
    const u = document.createElement("div");
    u.className = "search-tool-input-icon", u.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" height="35px" viewBox="0 -960 960 960" width="35px">
      <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
    </svg>`;
    const h = document.createElement("div");
    h.classList.add("search-tool-spinner", "search-tool-input-icon"), h.textContent = "", h.style.display = "none";
    const d = document.createElement("div");
    d.className = "search-tool-message";
    const p = document.createElement("div");
    p.className = "search-tool-result-count";
    const m = document.createElement("ul");
    return m.className = "search-tool-results", c.appendChild(a), c.appendChild(l), c.appendChild(u), c.appendChild(h), c.appendChild(d), c.appendChild(p), c.appendChild(m), {
      overlay: r,
      modal: c,
      input: l,
      results: m,
      searchIcon: u,
      spinner: h,
      message: d,
      dismissBtn: a,
      resultCount: p
    };
  }
  function t(r, c, l = [], a = null) {
    const u = document.createElement("li");
    u.className = "search-tool-result";
    const h = c.url ? document.createElement("a") : document.createElement("div");
    c.url && (h.href = c.url, h.target = "_blank", h.className = "search-tool-result-link");
    const d = document.createElement("strong"), p = document.createElement("div"), m = l.find((S) => S.key === "title"), g = l.find((S) => S.key === "content"), A = ne((m == null ? void 0 : m.indices) || []), y = c.title || "";
    A.length > 0 ? i(d, y, A) : d.textContent = y;
    const M = c.content || "", E = s(
      M,
      (g == null ? void 0 : g.indices) || [],
      200
    ), x = ne(E.adjustedIndices);
    if (x.length > 0 ? i(
      p,
      E.text,
      x
    ) : p.textContent = E.text, h.appendChild(d), h.appendChild(p), a !== null) {
      const S = document.createElement("div");
      S.style.fontSize = "0.8em", S.style.color = "gray", S.textContent = `Score: ${(a * 100).toFixed(1)}%`, h.appendChild(S);
    }
    u.appendChild(h), r.appendChild(u);
  }
  function s(r, c, l) {
    if (r.length <= l || c.length === 0)
      return {
        text: r.slice(0, l),
        adjustedIndices: c.filter(([M, E]) => M < l)
      };
    const [a, u] = c.reduce((M, E) => {
      const [x, S] = M, [T, C] = E;
      return C - T > S - x ? E : M;
    }), h = Math.floor((a + u) / 2), d = Math.max(0, h - Math.floor(l / 2)), p = Math.min(r.length, d + l), m = r.slice(d, p), g = a - d, A = u - d, y = g >= 0 && A < m.length ? [[g, A]] : [];
    return { text: m, adjustedIndices: y };
  }
  function i(r, c, l) {
    let a = 0;
    for (const [u, h] of l) {
      if (h - u + 1 < 2) continue;
      if (a < u) {
        const p = document.createTextNode(c.slice(a, u));
        r.appendChild(p);
      }
      const d = document.createElement("mark");
      d.textContent = c.slice(u, h + 1), r.appendChild(d), a = h + 1;
    }
    if (a < c.length) {
      const u = document.createTextNode(c.slice(a));
      r.appendChild(u);
    }
  }
  function o(r, c) {
    r.remove(), c.remove();
  }
}
function ne(n) {
  const e = [...n].sort((s, i) => s[0] - i[0]), t = [];
  for (const [s, i] of e) {
    const o = t[t.length - 1];
    !o || s > o[1] ? t.push([s, i]) : o[1] = Math.max(o[1], i);
  }
  return t;
}
function nt() {
  const n = document.querySelector(".stt-component");
  if (!n) return;
  const e = n.querySelector('[data-stt-action="toggle"]'), t = n.querySelector('[data-stt-action="dismiss"]'), s = n.querySelector('[data-stt-element="sidebar"]'), i = n.querySelector('[data-stt-element="overlay"]');
  function o() {
    s.classList.add("stt-drawer-open"), i.classList.add("stt-overlay-visible"), document.addEventListener("keydown", c);
  }
  function r() {
    s.classList.remove("stt-drawer-open"), i.classList.remove("stt-overlay-visible"), document.removeEventListener("keydown", c);
  }
  function c(l) {
    (l.key === "Escape" || l.key === "Esc") && r();
  }
  e == null || e.addEventListener("click", o), t == null || t.addEventListener("click", r), i == null || i.addEventListener("click", r);
}
function st() {
  it();
}
function it() {
  const n = window.location.origin + window.location.pathname;
  document.querySelectorAll(
    "nav.navigation-tabs[data-navigation-tabs-autoselector]"
  ).forEach((t) => {
    const s = t.querySelectorAll("a[href]");
    let i = 0;
    s.forEach((o) => {
      const r = o.getAttribute("href");
      if (!r) return;
      const c = new URL(
        r,
        window.location.origin + window.location.pathname
      ).href, l = n.endsWith("/") ? n.slice(0, -1) : n, a = c.endsWith("/") ? c.slice(0, -1) : c;
      if (l === a && (i++, o.classList.add("navigation-tabs--selected")), i > 1) {
        s.forEach((u) => u.classList.remove("navigation-tabs--selected"));
        return;
      }
    });
  });
}
function rt() {
  document.querySelectorAll("[data-resettable-file-input]").forEach((n) => {
    const e = document.createElement("button");
    e.className = "resettable-file-input-button", e.setAttribute("aria-label", "Remove all attachments"), e.type = "button", e.title = "Click to remove all attachments", e.textContent = "✖", n.className = "resettable-file-input-container", n.appendChild(e);
    const t = n.querySelector("input");
    t && e.addEventListener("click", () => {
      t.value = "";
    });
  });
}
function ct() {
  document.querySelectorAll("[data-tabs-button-name]").forEach((e) => {
    e.addEventListener("click", n);
  }), document.querySelectorAll("[data-tabs-name]").forEach((e) => {
    if (e.getAttribute("data-tabs-default") === "") {
      const s = e.getAttribute("data-tabs-name"), i = document.querySelector(
        `[data-tabs-button-name="${s}"]`
      );
      i == null || i.setAttribute("data-tabs-button-active", "");
    } else
      e.style.display = "none";
  });
  function n(e) {
    const t = e.currentTarget.getAttribute("data-tabs-button-name");
    if (!t) return;
    const s = e.currentTarget.getAttribute("data-tabs-group");
    if (!s) return;
    const i = document.querySelectorAll(
      `[data-tabs-group="${s}"][data-tabs-name]`
    );
    if (!i) return;
    i.forEach((r) => {
      r.getAttribute("data-tabs-name") === t ? r.style.display = "" : r.style.display = "none";
    }), document.querySelectorAll(
      `[data-tabs-group="${s}"][data-tabs-button-name]`
    ).forEach((r) => {
      r.getAttribute("data-tabs-button-name") === t ? r == null || r.setAttribute("data-tabs-button-active", "") : r == null || r.removeAttribute("data-tabs-button-active");
    });
  }
}
document.addEventListener("DOMContentLoaded", () => {
  de(), nt(), tt(), me(), st(), rt(), ct();
});
