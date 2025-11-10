function he() {
  de(), fe();
}
function de() {
  document.querySelectorAll(
    "input[data-clickable-item-list-filter]"
  ).forEach((e) => {
    const n = e.parentElement.querySelector(".clickable-item-list") || e.nextElementSibling;
    if (!n || !n.classList.contains("clickable-item-list")) {
      console.warn("No clickable-item-list found near filter input");
      return;
    }
    e.addEventListener("input", () => {
      const s = e.value.trim().toLowerCase(), i = [], r = [];
      for (r.push({ ul: n, parentLi: null }); r.length; ) {
        const { ul: o, parentLi: c } = r.pop(), u = Array.from(o.children).filter((l) => l.tagName === "LI");
        for (const l of u) {
          i.push({ li: l, parentLi: c });
          const a = l.querySelector(":scope > ul");
          a && r.push({ ul: a, parentLi: l });
        }
      }
      for (const o of i) {
        const c = o.li.textContent.toLowerCase();
        o.selfMatches = s === "" || c.includes(s), o.childrenMatch = !1;
      }
      for (let o = i.length - 1; o >= 0; o--) {
        const c = i[o], l = c.li.querySelector(":scope > ul");
        if (l) {
          const a = Array.from(l.children).filter(
            (h) => h.tagName === "LI"
          );
          c.childrenMatch = a.some((h) => {
            const d = i.find((f) => f.li === h);
            return d && (d.selfMatches || d.childrenMatch);
          });
        }
        if (c.parentLi) {
          const a = i.find((h) => h.li === c.parentLi);
          a && (c.selfMatches || c.childrenMatch) && (a.childrenMatch = !0);
        }
      }
      for (const o of i) {
        const c = o.li, u = c.querySelector(":scope > ul"), l = c.querySelector("details"), a = o.selfMatches || o.childrenMatch;
        c.style.display = a ? "" : "none", l && (a ? l.open = !0 : l.open = !1), o.selfMatches && u && Array.from(u.children).filter(
          (d) => d.tagName === "LI"
        ).forEach((d) => {
          d.style.display = "";
        });
      }
    });
  });
}
function fe() {
  const t = window.location.origin + window.location.pathname;
  document.querySelectorAll(
    "ul[data-clickable-item-list-autoselector]"
  ).forEach((n) => {
    const s = n.querySelectorAll("a[href]");
    let i = 0;
    s.forEach((r) => {
      const o = new URL(
        r.getAttribute("href"),
        window.location.origin + window.location.pathname
      ).href, c = t.endsWith("/") ? t.slice(0, -1) : t, u = o.endsWith("/") ? o.slice(0, -1) : o;
      if (c === u) {
        const l = r.closest("li");
        l && n.contains(l) && (l.classList.add("clickable-item-list--selected"), i++);
      }
      if (i > 1) {
        s.forEach((l) => l.classList.remove("clickable-item-list--selected"));
        return;
      }
    });
  });
}
function pe() {
  document.querySelectorAll("[data-copyable-snippet]").forEach((n) => {
    if (n.querySelector("code") && !n.querySelector(".copyable-snippet-button")) {
      const i = document.createElement("button");
      i.className = "copyable-snippet-button", i.setAttribute("aria-label", "Copy"), i.textContent = "📋", n.appendChild(i), i.addEventListener("click", t);
    }
  });
  function t(n) {
    const s = n.target.closest(".copyable-snippet-button");
    if (!s) return;
    const i = s.closest("[data-copyable-snippet]");
    if (!i) return;
    const r = i.querySelector("code");
    if (!r) return;
    const o = r.textContent;
    if (!o) return;
    const c = s.textContent;
    navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(o).then(() => {
      s.disabled = !0, s.textContent = "✅", setTimeout(() => {
        s.textContent = c, s.disabled = !1;
      }, 1e3);
    }).catch(() => e(o, s, c)) : e(o, s, c);
  }
  function e(n, s, i) {
    const r = document.createElement("textarea");
    r.value = n, r.style.position = "fixed", r.style.opacity = "0", document.body.appendChild(r), r.select();
    try {
      document.execCommand("copy") ? s.textContent = "✅" : s.textContent = "❌";
    } catch (o) {
      console.warn("Fallback copy failed:", o), s.textContent = "❌";
    }
    document.body.removeChild(r), setTimeout(() => s.textContent = i, 1e3);
  }
}
function L(t) {
  return Array.isArray ? Array.isArray(t) : ie(t) === "[object Array]";
}
function me(t) {
  if (typeof t == "string")
    return t;
  let e = t + "";
  return e == "0" && 1 / t == -1 / 0 ? "-0" : e;
}
function ge(t) {
  return t == null ? "" : me(t);
}
function D(t) {
  return typeof t == "string";
}
function ne(t) {
  return typeof t == "number";
}
function Ae(t) {
  return t === !0 || t === !1 || ye(t) && ie(t) == "[object Boolean]";
}
function se(t) {
  return typeof t == "object";
}
function ye(t) {
  return se(t) && t !== null;
}
function S(t) {
  return t != null;
}
function P(t) {
  return !t.trim().length;
}
function ie(t) {
  return t == null ? t === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(t);
}
const Ce = "Incorrect 'index' type", Ee = (t) => `Invalid value for key ${t}`, Me = (t) => `Pattern length exceeds max of ${t}.`, xe = (t) => `Missing ${t} property in key`, be = (t) => `Property 'weight' in key '${t}' must be a positive integer`, Q = Object.prototype.hasOwnProperty;
class Fe {
  constructor(e) {
    this._keys = [], this._keyMap = {};
    let n = 0;
    e.forEach((s) => {
      let i = re(s);
      this._keys.push(i), this._keyMap[i.id] = i, n += i.weight;
    }), this._keys.forEach((s) => {
      s.weight /= n;
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
function re(t) {
  let e = null, n = null, s = null, i = 1, r = null;
  if (D(t) || L(t))
    s = t, e = J(t), n = z(t);
  else {
    if (!Q.call(t, "name"))
      throw new Error(xe("name"));
    const o = t.name;
    if (s = o, Q.call(t, "weight") && (i = t.weight, i <= 0))
      throw new Error(be(o));
    e = J(o), n = z(o), r = t.getFn;
  }
  return { path: e, id: n, weight: i, src: s, getFn: r };
}
function J(t) {
  return L(t) ? t : t.split(".");
}
function z(t) {
  return L(t) ? t.join(".") : t;
}
function Se(t, e) {
  let n = [], s = !1;
  const i = (r, o, c) => {
    if (S(r))
      if (!o[c])
        n.push(r);
      else {
        let u = o[c];
        const l = r[u];
        if (!S(l))
          return;
        if (c === o.length - 1 && (D(l) || ne(l) || Ae(l)))
          n.push(ge(l));
        else if (L(l)) {
          s = !0;
          for (let a = 0, h = l.length; a < h; a += 1)
            i(l[a], o, c + 1);
        } else o.length && i(l, o, c + 1);
      }
  };
  return i(t, D(e) ? e.split(".") : e, 0), s ? n : n[0];
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
}, we = {
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
  sortFn: (t, e) => t.score === e.score ? t.idx < e.idx ? -1 : 1 : t.score < e.score ? -1 : 1
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
  getFn: Se,
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
var p = {
  ...we,
  ...Be,
  ...De,
  ...Le
};
const ve = /[^ ]+/g;
function ke(t = 1, e = 3) {
  const n = /* @__PURE__ */ new Map(), s = Math.pow(10, e);
  return {
    get(i) {
      const r = i.match(ve).length;
      if (n.has(r))
        return n.get(r);
      const o = 1 / Math.pow(r, 0.5 * t), c = parseFloat(Math.round(o * s) / s);
      return n.set(r, c), c;
    },
    clear() {
      n.clear();
    }
  };
}
class G {
  constructor({
    getFn: e = p.getFn,
    fieldNormWeight: n = p.fieldNormWeight
  } = {}) {
    this.norm = ke(n, 3), this.getFn = e, this.isCreated = !1, this.setIndexRecords();
  }
  setSources(e = []) {
    this.docs = e;
  }
  setIndexRecords(e = []) {
    this.records = e;
  }
  setKeys(e = []) {
    this.keys = e, this._keysMap = {}, e.forEach((n, s) => {
      this._keysMap[n.id] = s;
    });
  }
  create() {
    this.isCreated || !this.docs.length || (this.isCreated = !0, D(this.docs[0]) ? this.docs.forEach((e, n) => {
      this._addString(e, n);
    }) : this.docs.forEach((e, n) => {
      this._addObject(e, n);
    }), this.norm.clear());
  }
  // Adds a doc to the end of the index
  add(e) {
    const n = this.size();
    D(e) ? this._addString(e, n) : this._addObject(e, n);
  }
  // Removes the doc at the specified index of the index
  removeAt(e) {
    this.records.splice(e, 1);
    for (let n = e, s = this.size(); n < s; n += 1)
      this.records[n].i -= 1;
  }
  getValueForItemAtKeyId(e, n) {
    return e[this._keysMap[n]];
  }
  size() {
    return this.records.length;
  }
  _addString(e, n) {
    if (!S(e) || P(e))
      return;
    let s = {
      v: e,
      i: n,
      n: this.norm.get(e)
    };
    this.records.push(s);
  }
  _addObject(e, n) {
    let s = { i: n, $: {} };
    this.keys.forEach((i, r) => {
      let o = i.getFn ? i.getFn(e) : this.getFn(e, i.path);
      if (S(o)) {
        if (L(o)) {
          let c = [];
          const u = [{ nestedArrIndex: -1, value: o }];
          for (; u.length; ) {
            const { nestedArrIndex: l, value: a } = u.pop();
            if (S(a))
              if (D(a) && !P(a)) {
                let h = {
                  v: a,
                  i: l,
                  n: this.norm.get(a)
                };
                c.push(h);
              } else L(a) && a.forEach((h, d) => {
                u.push({
                  nestedArrIndex: d,
                  value: h
                });
              });
          }
          s.$[r] = c;
        } else if (D(o) && !P(o)) {
          let c = {
            v: o,
            n: this.norm.get(o)
          };
          s.$[r] = c;
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
function ce(t, e, { getFn: n = p.getFn, fieldNormWeight: s = p.fieldNormWeight } = {}) {
  const i = new G({ getFn: n, fieldNormWeight: s });
  return i.setKeys(t.map(re)), i.setSources(e), i.create(), i;
}
function Ie(t, { getFn: e = p.getFn, fieldNormWeight: n = p.fieldNormWeight } = {}) {
  const { keys: s, records: i } = t, r = new G({ getFn: e, fieldNormWeight: n });
  return r.setKeys(s), r.setIndexRecords(i), r;
}
function T(t, {
  errors: e = 0,
  currentLocation: n = 0,
  expectedLocation: s = 0,
  distance: i = p.distance,
  ignoreLocation: r = p.ignoreLocation
} = {}) {
  const o = e / t.length;
  if (r)
    return o;
  const c = Math.abs(s - n);
  return i ? o + c / i : c ? 1 : o;
}
function _e(t = [], e = p.minMatchCharLength) {
  let n = [], s = -1, i = -1, r = 0;
  for (let o = t.length; r < o; r += 1) {
    let c = t[r];
    c && s === -1 ? s = r : !c && s !== -1 && (i = r - 1, i - s + 1 >= e && n.push([s, i]), s = -1);
  }
  return t[r - 1] && r - s >= e && n.push([s, r - 1]), n;
}
const I = 32;
function Ne(t, e, n, {
  location: s = p.location,
  distance: i = p.distance,
  threshold: r = p.threshold,
  findAllMatches: o = p.findAllMatches,
  minMatchCharLength: c = p.minMatchCharLength,
  includeMatches: u = p.includeMatches,
  ignoreLocation: l = p.ignoreLocation
} = {}) {
  if (e.length > I)
    throw new Error(Me(I));
  const a = e.length, h = t.length, d = Math.max(0, Math.min(s, h));
  let f = r, m = d;
  const A = c > 1 || u, g = A ? Array(h) : [];
  let x;
  for (; (x = t.indexOf(e, m)) > -1; ) {
    let E = T(e, {
      currentLocation: x,
      expectedLocation: d,
      distance: i,
      ignoreLocation: l
    });
    if (f = Math.min(E, f), m = x + a, A) {
      let F = 0;
      for (; F < a; )
        g[x + F] = 1, F += 1;
    }
  }
  m = -1;
  let y = [], M = 1, C = a + h;
  const B = 1 << a - 1;
  for (let E = 0; E < a; E += 1) {
    let F = 0, v = C;
    for (; F < v; )
      T(e, {
        errors: E,
        currentLocation: d + v,
        expectedLocation: d,
        distance: i,
        ignoreLocation: l
      }) <= f ? F = v : C = v, v = Math.floor((C - F) / 2 + F);
    C = v;
    let Y = Math.max(1, d - v + 1), j = o ? h : Math.min(d + v, h) + a, _ = Array(j + 2);
    _[j + 1] = (1 << E) - 1;
    for (let w = j; w >= Y; w -= 1) {
      let R = w - 1, V = n[t.charAt(R)];
      if (A && (g[R] = +!!V), _[w] = (_[w + 1] << 1 | 1) & V, E && (_[w] |= (y[w + 1] | y[w]) << 1 | 1 | y[w + 1]), _[w] & B && (M = T(e, {
        errors: E,
        currentLocation: R,
        expectedLocation: d,
        distance: i,
        ignoreLocation: l
      }), M <= f)) {
        if (f = M, m = R, m <= d)
          break;
        Y = Math.max(1, 2 * d - m);
      }
    }
    if (T(e, {
      errors: E + 1,
      currentLocation: d,
      expectedLocation: d,
      distance: i,
      ignoreLocation: l
    }) > f)
      break;
    y = _;
  }
  const b = {
    isMatch: m >= 0,
    // Count exact matches (those with a score of 0) to be "almost" exact
    score: Math.max(1e-3, M)
  };
  if (A) {
    const E = _e(g, c);
    E.length ? u && (b.indices = E) : b.isMatch = !1;
  }
  return b;
}
function Re(t) {
  let e = {};
  for (let n = 0, s = t.length; n < s; n += 1) {
    const i = t.charAt(n);
    e[i] = (e[i] || 0) | 1 << s - n - 1;
  }
  return e;
}
const $ = String.prototype.normalize ? ((t) => t.normalize("NFD").replace(/[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]/g, "")) : ((t) => t);
class oe {
  constructor(e, {
    location: n = p.location,
    threshold: s = p.threshold,
    distance: i = p.distance,
    includeMatches: r = p.includeMatches,
    findAllMatches: o = p.findAllMatches,
    minMatchCharLength: c = p.minMatchCharLength,
    isCaseSensitive: u = p.isCaseSensitive,
    ignoreDiacritics: l = p.ignoreDiacritics,
    ignoreLocation: a = p.ignoreLocation
  } = {}) {
    if (this.options = {
      location: n,
      threshold: s,
      distance: i,
      includeMatches: r,
      findAllMatches: o,
      minMatchCharLength: c,
      isCaseSensitive: u,
      ignoreDiacritics: l,
      ignoreLocation: a
    }, e = u ? e : e.toLowerCase(), e = l ? $(e) : e, this.pattern = e, this.chunks = [], !this.pattern.length)
      return;
    const h = (f, m) => {
      this.chunks.push({
        pattern: f,
        alphabet: Re(f),
        startIndex: m
      });
    }, d = this.pattern.length;
    if (d > I) {
      let f = 0;
      const m = d % I, A = d - m;
      for (; f < A; )
        h(this.pattern.substr(f, I), f), f += I;
      if (m) {
        const g = d - I;
        h(this.pattern.substr(g), g);
      }
    } else
      h(this.pattern, 0);
  }
  searchIn(e) {
    const { isCaseSensitive: n, ignoreDiacritics: s, includeMatches: i } = this.options;
    if (e = n ? e : e.toLowerCase(), e = s ? $(e) : e, this.pattern === e) {
      let A = {
        isMatch: !0,
        score: 0
      };
      return i && (A.indices = [[0, e.length - 1]]), A;
    }
    const {
      location: r,
      distance: o,
      threshold: c,
      findAllMatches: u,
      minMatchCharLength: l,
      ignoreLocation: a
    } = this.options;
    let h = [], d = 0, f = !1;
    this.chunks.forEach(({ pattern: A, alphabet: g, startIndex: x }) => {
      const { isMatch: y, score: M, indices: C } = Ne(e, A, g, {
        location: r + x,
        distance: o,
        threshold: c,
        findAllMatches: u,
        minMatchCharLength: l,
        includeMatches: i,
        ignoreLocation: a
      });
      y && (f = !0), d += M, y && C && (h = [...h, ...C]);
    });
    let m = {
      isMatch: f,
      score: f ? d / this.chunks.length : 1
    };
    return f && i && (m.indices = h), m;
  }
}
class k {
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
function X(t, e) {
  const n = t.match(e);
  return n ? n[1] : null;
}
class Te extends k {
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
    const n = e === this.pattern;
    return {
      isMatch: n,
      score: n ? 0 : 1,
      indices: [0, this.pattern.length - 1]
    };
  }
}
class $e extends k {
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
class Oe extends k {
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
    const n = e.startsWith(this.pattern);
    return {
      isMatch: n,
      score: n ? 0 : 1,
      indices: [0, this.pattern.length - 1]
    };
  }
}
class je extends k {
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
    const n = !e.startsWith(this.pattern);
    return {
      isMatch: n,
      score: n ? 0 : 1,
      indices: [0, e.length - 1]
    };
  }
}
class Pe extends k {
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
    const n = e.endsWith(this.pattern);
    return {
      isMatch: n,
      score: n ? 0 : 1,
      indices: [e.length - this.pattern.length, e.length - 1]
    };
  }
}
class ze extends k {
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
    const n = !e.endsWith(this.pattern);
    return {
      isMatch: n,
      score: n ? 0 : 1,
      indices: [0, e.length - 1]
    };
  }
}
class ue extends k {
  constructor(e, {
    location: n = p.location,
    threshold: s = p.threshold,
    distance: i = p.distance,
    includeMatches: r = p.includeMatches,
    findAllMatches: o = p.findAllMatches,
    minMatchCharLength: c = p.minMatchCharLength,
    isCaseSensitive: u = p.isCaseSensitive,
    ignoreDiacritics: l = p.ignoreDiacritics,
    ignoreLocation: a = p.ignoreLocation
  } = {}) {
    super(e), this._bitapSearch = new oe(e, {
      location: n,
      threshold: s,
      distance: i,
      includeMatches: r,
      findAllMatches: o,
      minMatchCharLength: c,
      isCaseSensitive: u,
      ignoreDiacritics: l,
      ignoreLocation: a
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
class le extends k {
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
    let n = 0, s;
    const i = [], r = this.pattern.length;
    for (; (s = e.indexOf(this.pattern, n)) > -1; )
      n = s + r, i.push([s, n - 1]);
    const o = !!i.length;
    return {
      isMatch: o,
      score: o ? 0 : 1,
      indices: i
    };
  }
}
const W = [
  Te,
  le,
  Oe,
  je,
  ze,
  Pe,
  $e,
  ue
], Z = W.length, We = / +(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/, Ue = "|";
function Ke(t, e = {}) {
  return t.split(Ue).map((n) => {
    let s = n.trim().split(We).filter((r) => r && !!r.trim()), i = [];
    for (let r = 0, o = s.length; r < o; r += 1) {
      const c = s[r];
      let u = !1, l = -1;
      for (; !u && ++l < Z; ) {
        const a = W[l];
        let h = a.isMultiMatch(c);
        h && (i.push(new a(h, e)), u = !0);
      }
      if (!u)
        for (l = -1; ++l < Z; ) {
          const a = W[l];
          let h = a.isSingleMatch(c);
          if (h) {
            i.push(new a(h, e));
            break;
          }
        }
    }
    return i;
  });
}
const qe = /* @__PURE__ */ new Set([ue.type, le.type]);
class He {
  constructor(e, {
    isCaseSensitive: n = p.isCaseSensitive,
    ignoreDiacritics: s = p.ignoreDiacritics,
    includeMatches: i = p.includeMatches,
    minMatchCharLength: r = p.minMatchCharLength,
    ignoreLocation: o = p.ignoreLocation,
    findAllMatches: c = p.findAllMatches,
    location: u = p.location,
    threshold: l = p.threshold,
    distance: a = p.distance
  } = {}) {
    this.query = null, this.options = {
      isCaseSensitive: n,
      ignoreDiacritics: s,
      includeMatches: i,
      minMatchCharLength: r,
      findAllMatches: c,
      ignoreLocation: o,
      location: u,
      threshold: l,
      distance: a
    }, e = n ? e : e.toLowerCase(), e = s ? $(e) : e, this.pattern = e, this.query = Ke(this.pattern, this.options);
  }
  static condition(e, n) {
    return n.useExtendedSearch;
  }
  searchIn(e) {
    const n = this.query;
    if (!n)
      return {
        isMatch: !1,
        score: 1
      };
    const { includeMatches: s, isCaseSensitive: i, ignoreDiacritics: r } = this.options;
    e = i ? e : e.toLowerCase(), e = r ? $(e) : e;
    let o = 0, c = [], u = 0;
    for (let l = 0, a = n.length; l < a; l += 1) {
      const h = n[l];
      c.length = 0, o = 0;
      for (let d = 0, f = h.length; d < f; d += 1) {
        const m = h[d], { isMatch: A, indices: g, score: x } = m.search(e);
        if (A) {
          if (o += 1, u += x, s) {
            const y = m.constructor.type;
            qe.has(y) ? c = [...c, ...g] : c.push(g);
          }
        } else {
          u = 0, o = 0, c.length = 0;
          break;
        }
      }
      if (o) {
        let d = {
          isMatch: !0,
          score: u / o
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
const U = [];
function Ge(...t) {
  U.push(...t);
}
function K(t, e) {
  for (let n = 0, s = U.length; n < s; n += 1) {
    let i = U[n];
    if (i.condition(t, e))
      return new i(t, e);
  }
  return new oe(t, e);
}
const O = {
  AND: "$and",
  OR: "$or"
}, q = {
  PATH: "$path",
  PATTERN: "$val"
}, H = (t) => !!(t[O.AND] || t[O.OR]), Ye = (t) => !!t[q.PATH], Ve = (t) => !L(t) && se(t) && !H(t), ee = (t) => ({
  [O.AND]: Object.keys(t).map((e) => ({
    [e]: t[e]
  }))
});
function ae(t, e, { auto: n = !0 } = {}) {
  const s = (i) => {
    let r = Object.keys(i);
    const o = Ye(i);
    if (!o && r.length > 1 && !H(i))
      return s(ee(i));
    if (Ve(i)) {
      const u = o ? i[q.PATH] : r[0], l = o ? i[q.PATTERN] : i[u];
      if (!D(l))
        throw new Error(Ee(u));
      const a = {
        keyId: z(u),
        pattern: l
      };
      return n && (a.searcher = K(l, e)), a;
    }
    let c = {
      children: [],
      operator: r[0]
    };
    return r.forEach((u) => {
      const l = i[u];
      L(l) && l.forEach((a) => {
        c.children.push(s(a));
      });
    }), c;
  };
  return H(t) || (t = ee(t)), s(t);
}
function Qe(t, { ignoreFieldNorm: e = p.ignoreFieldNorm }) {
  t.forEach((n) => {
    let s = 1;
    n.matches.forEach(({ key: i, norm: r, score: o }) => {
      const c = i ? i.weight : null;
      s *= Math.pow(
        o === 0 && c ? Number.EPSILON : o,
        (c || 1) * (e ? 1 : r)
      );
    }), n.score = s;
  });
}
function Je(t, e) {
  const n = t.matches;
  e.matches = [], S(n) && n.forEach((s) => {
    if (!S(s.indices) || !s.indices.length)
      return;
    const { indices: i, value: r } = s;
    let o = {
      indices: i,
      value: r
    };
    s.key && (o.key = s.key.src), s.idx > -1 && (o.refIndex = s.idx), e.matches.push(o);
  });
}
function Xe(t, e) {
  e.score = t.score;
}
function Ze(t, e, {
  includeMatches: n = p.includeMatches,
  includeScore: s = p.includeScore
} = {}) {
  const i = [];
  return n && i.push(Je), s && i.push(Xe), t.map((r) => {
    const { idx: o } = r, c = {
      item: e[o],
      refIndex: o
    };
    return i.length && i.forEach((u) => {
      u(r, c);
    }), c;
  });
}
class N {
  constructor(e, n = {}, s) {
    this.options = { ...p, ...n }, this.options.useExtendedSearch, this._keyStore = new Fe(this.options.keys), this.setCollection(e, s);
  }
  setCollection(e, n) {
    if (this._docs = e, n && !(n instanceof G))
      throw new Error(Ce);
    this._myIndex = n || ce(this.options.keys, this._docs, {
      getFn: this.options.getFn,
      fieldNormWeight: this.options.fieldNormWeight
    });
  }
  add(e) {
    S(e) && (this._docs.push(e), this._myIndex.add(e));
  }
  remove(e = () => !1) {
    const n = [];
    for (let s = 0, i = this._docs.length; s < i; s += 1) {
      const r = this._docs[s];
      e(r, s) && (this.removeAt(s), s -= 1, i -= 1, n.push(r));
    }
    return n;
  }
  removeAt(e) {
    this._docs.splice(e, 1), this._myIndex.removeAt(e);
  }
  getIndex() {
    return this._myIndex;
  }
  search(e, { limit: n = -1 } = {}) {
    const {
      includeMatches: s,
      includeScore: i,
      shouldSort: r,
      sortFn: o,
      ignoreFieldNorm: c
    } = this.options;
    let u = D(e) ? D(this._docs[0]) ? this._searchStringList(e) : this._searchObjectList(e) : this._searchLogical(e);
    return Qe(u, { ignoreFieldNorm: c }), r && u.sort(o), ne(n) && n > -1 && (u = u.slice(0, n)), Ze(u, this._docs, {
      includeMatches: s,
      includeScore: i
    });
  }
  _searchStringList(e) {
    const n = K(e, this.options), { records: s } = this._myIndex, i = [];
    return s.forEach(({ v: r, i: o, n: c }) => {
      if (!S(r))
        return;
      const { isMatch: u, score: l, indices: a } = n.searchIn(r);
      u && i.push({
        item: r,
        idx: o,
        matches: [{ score: l, value: r, norm: c, indices: a }]
      });
    }), i;
  }
  _searchLogical(e) {
    const n = ae(e, this.options), s = (c, u, l) => {
      if (!c.children) {
        const { keyId: h, searcher: d } = c, f = this._findMatches({
          key: this._keyStore.get(h),
          value: this._myIndex.getValueForItemAtKeyId(u, h),
          searcher: d
        });
        return f && f.length ? [
          {
            idx: l,
            item: u,
            matches: f
          }
        ] : [];
      }
      const a = [];
      for (let h = 0, d = c.children.length; h < d; h += 1) {
        const f = c.children[h], m = s(f, u, l);
        if (m.length)
          a.push(...m);
        else if (c.operator === O.AND)
          return [];
      }
      return a;
    }, i = this._myIndex.records, r = {}, o = [];
    return i.forEach(({ $: c, i: u }) => {
      if (S(c)) {
        let l = s(n, c, u);
        l.length && (r[u] || (r[u] = { idx: u, item: c, matches: [] }, o.push(r[u])), l.forEach(({ matches: a }) => {
          r[u].matches.push(...a);
        }));
      }
    }), o;
  }
  _searchObjectList(e) {
    const n = K(e, this.options), { keys: s, records: i } = this._myIndex, r = [];
    return i.forEach(({ $: o, i: c }) => {
      if (!S(o))
        return;
      let u = [];
      s.forEach((l, a) => {
        u.push(
          ...this._findMatches({
            key: l,
            value: o[a],
            searcher: n
          })
        );
      }), u.length && r.push({
        idx: c,
        item: o,
        matches: u
      });
    }), r;
  }
  _findMatches({ key: e, value: n, searcher: s }) {
    if (!S(n))
      return [];
    let i = [];
    if (L(n))
      n.forEach(({ v: r, i: o, n: c }) => {
        if (!S(r))
          return;
        const { isMatch: u, score: l, indices: a } = s.searchIn(r);
        u && i.push({
          score: l,
          key: e,
          value: r,
          idx: o,
          norm: c,
          indices: a
        });
      });
    else {
      const { v: r, n: o } = n, { isMatch: c, score: u, indices: l } = s.searchIn(r);
      c && i.push({ score: u, key: e, value: r, norm: o, indices: l });
    }
    return i;
  }
}
N.version = "7.1.0";
N.createIndex = ce;
N.parseIndex = Ie;
N.config = p;
N.parseQuery = ae;
Ge(He);
function et() {
  const t = document.querySelectorAll("[data-search-tool]");
  let e = !1;
  for (const c of t)
    c.addEventListener("click", async () => {
      const u = c.getAttribute("data-mode"), l = c.getAttribute("data-static-url"), a = c.getAttribute("data-dynamic-url"), {
        overlay: h,
        modal: d,
        input: f,
        results: m,
        spinner: A,
        message: g,
        dismissBtn: x,
        resultCount: y
      } = n();
      document.body.appendChild(h), document.body.appendChild(d), g.style.display = "none", y.style.display = "none", f.focus();
      let M = null, C = null;
      if (u === "static") {
        A.style.display = "block";
        try {
          C = await (await fetch(l)).json(), M = new N(C, {
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
        } catch (B) {
          e = !0, g.style.display = "block", g.textContent = "⚠️ Failed to load search index, please refresh the page.", console.error("Static fetch failed:", B);
        } finally {
          A.style.display = "none";
        }
      }
      f.oninput = async function() {
        const B = f.value.trim();
        if (m.innerHTML = "", e !== !0 && (g.textContent = "", g.style.display = "none", A.style.display = "block"), !B) {
          g.style.display = "none", A.style.display = "none", y.textContent = "", y.style.display = "none";
          return;
        }
        if (u === "static" && M) {
          const b = M.search(B);
          b.length === 0 ? (g.style.display = "block", g.textContent = "No results found.", y.textContent = "", y.style.display = "none") : (g.style.display = "none", y.style.display = "block", y.textContent = `🔎 Found ${b.length} result(s).`, b.forEach((E) => {
            s(m, E.item, E.matches, E.score);
          })), A.style.display = "none";
        }
        if (u === "dynamic")
          try {
            const E = await (await fetch(a + encodeURIComponent(B))).json();
            E.length === 0 ? (g.textContent = "No results found.", y.textContent = "") : (y.textContent = `🔎 Found ${E.length} result(s).`, E.forEach(
              (F) => s(m, F.title || F.name)
            ));
          } catch (b) {
            g.textContent = "⚠️ Failed to fetch results.", console.error("Dynamic fetch failed:", b);
          } finally {
            A.style.display = "none";
          }
      }, h.onclick = () => o(d, h), x.onclick = () => o(d, h), document.addEventListener("keydown", function B(b) {
        b.key === "Escape" && (o(d, h), document.removeEventListener("keydown", B));
      });
    });
  function n() {
    const c = document.createElement("div");
    c.className = "search-tool-overlay";
    const u = document.createElement("div");
    u.className = "search-tool-modal";
    const l = document.createElement("input");
    l.className = "search-tool-input", l.type = "text", l.placeholder = "Search...";
    const a = document.createElement("button");
    a.className = "search-tool-dismiss", a.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
        <path d="m251.33-204.67-46.66-46.66L433.33-480 204.67-708.67l46.66-46.66L480-526.67l228.67-228.66 46.66 46.66L526.67-480l228.66 228.67-46.66 46.66L480-433.33 251.33-204.67Z"/>
      </svg>`;
    const h = document.createElement("div");
    h.className = "search-tool-spinner", h.textContent = "Loading...", h.style.display = "none";
    const d = document.createElement("div");
    d.className = "search-tool-message";
    const f = document.createElement("div");
    f.className = "search-tool-result-count";
    const m = document.createElement("ul");
    return m.className = "search-tool-results", u.appendChild(a), u.appendChild(l), u.appendChild(h), u.appendChild(d), u.appendChild(f), u.appendChild(m), {
      overlay: c,
      modal: u,
      input: l,
      results: m,
      spinner: h,
      message: d,
      dismissBtn: a,
      resultCount: f
    };
  }
  function s(c, u, l = [], a = null) {
    const h = document.createElement("li");
    h.className = "search-tool-result";
    const d = u.url ? document.createElement("a") : document.createElement("div");
    u.url && (d.href = u.url, d.target = "_blank", d.className = "search-tool-result-link");
    const f = document.createElement("strong"), m = document.createElement("div"), A = l.find((C) => C.key === "title"), g = l.find((C) => C.key === "content"), x = te((A == null ? void 0 : A.indices) || []);
    r(f, u.title || "", x);
    const y = i(
      u.content || "",
      (g == null ? void 0 : g.indices) || [],
      200
    ), M = te(y.adjustedIndices);
    if (r(
      m,
      y.text,
      M
    ), d.appendChild(f), d.appendChild(m), a !== null) {
      const C = document.createElement("div");
      C.style.fontSize = "0.8em", C.style.color = "gray", C.textContent = `Score: ${(a * 100).toFixed(1)}%`, d.appendChild(C);
    }
    h.appendChild(d), c.appendChild(h);
  }
  function i(c, u, l) {
    if (c.length <= l || u.length === 0)
      return {
        text: c.slice(0, l),
        adjustedIndices: u.filter(([M, C]) => M < l)
      };
    const [a, h] = u.reduce((M, C) => {
      const [B, b] = M, [E, F] = C;
      return F - E > b - B ? C : M;
    }), d = Math.floor((a + h) / 2), f = Math.max(0, d - Math.floor(l / 2)), m = Math.min(c.length, f + l), A = c.slice(f, m), g = a - f, x = h - f, y = g >= 0 && x < A.length ? [[g, x]] : [];
    return { text: A, adjustedIndices: y };
  }
  function r(c, u, l) {
    let a = 0;
    for (const [h, d] of l) {
      if (d - h + 1 < 2) continue;
      if (a < h) {
        const m = document.createTextNode(u.slice(a, h));
        c.appendChild(m);
      }
      const f = document.createElement("mark");
      f.textContent = u.slice(h, d + 1), c.appendChild(f), a = d + 1;
    }
    if (a < u.length) {
      const h = document.createTextNode(u.slice(a));
      c.appendChild(h);
    }
  }
  function o(c, u) {
    c.remove(), u.remove();
  }
}
function te(t) {
  const e = [...t].sort((s, i) => s[0] - i[0]), n = [];
  for (const [s, i] of e) {
    const r = n[n.length - 1];
    !r || s > r[1] ? n.push([s, i]) : r[1] = Math.max(r[1], i);
  }
  return n;
}
function tt() {
  const t = document.querySelector(".stt-component");
  if (!t) return;
  const e = t.querySelector('[data-stt-action="toggle"]'), n = t.querySelector('[data-stt-action="dismiss"]'), s = t.querySelector('[data-stt-element="sidebar"]'), i = t.querySelector('[data-stt-element="overlay"]');
  function r() {
    s.classList.add("stt-drawer-open"), i.classList.add("stt-overlay-visible"), document.addEventListener("keydown", c);
  }
  function o() {
    s.classList.remove("stt-drawer-open"), i.classList.remove("stt-overlay-visible"), document.removeEventListener("keydown", c);
  }
  function c(u) {
    (u.key === "Escape" || u.key === "Esc") && o();
  }
  e == null || e.addEventListener("click", r), n == null || n.addEventListener("click", o), i == null || i.addEventListener("click", o);
}
function nt() {
  st();
}
function st() {
  const t = window.location.origin + window.location.pathname;
  document.querySelectorAll(
    "nav.navigation-tabs[data-navigation-tabs-autoselector]"
  ).forEach((n) => {
    const s = n.querySelectorAll("a[href]");
    let i = 0;
    s.forEach((r) => {
      const o = r.getAttribute("href");
      if (!o) return;
      const c = new URL(
        o,
        window.location.origin + window.location.pathname
      ).href, u = t.endsWith("/") ? t.slice(0, -1) : t, l = c.endsWith("/") ? c.slice(0, -1) : c;
      if (u === l && (i++, r.classList.add("navigation-tabs--selected")), i > 1) {
        s.forEach((a) => a.classList.remove("navigation-tabs--selected"));
        return;
      }
    });
  });
}
function it() {
  document.querySelectorAll("[data-resettable-file-input]").forEach((t) => {
    const e = document.createElement("button");
    e.className = "resettable-file-input-button", e.setAttribute("aria-label", "Remove all attachments"), e.type = "button", e.title = "Click to remove all attachments", e.textContent = "✖", t.className = "resettable-file-input-container", t.appendChild(e);
    const n = t.querySelector("input");
    n && e.addEventListener("click", () => {
      n.value = "";
    });
  });
}
document.addEventListener("DOMContentLoaded", () => {
  he(), tt(), et(), pe(), nt(), it();
});
