function he() {
  de(), fe();
}
function de() {
  document.querySelectorAll(
    "input[data-clickable-item-list-filter]"
  ).forEach((e) => {
    const t = e.parentElement.querySelector(".clickable-item-list") || e.nextElementSibling;
    if (!t || !t.classList.contains("clickable-item-list")) {
      console.warn("No clickable-item-list found near filter input");
      return;
    }
    e.addEventListener("input", () => {
      const r = e.value.trim().toLowerCase(), s = [], i = [];
      for (i.push({ ul: t, parentLi: null }); i.length; ) {
        const { ul: o, parentLi: c } = i.pop(), u = Array.from(o.children).filter((a) => a.tagName === "LI");
        for (const a of u) {
          s.push({ li: a, parentLi: c });
          const l = a.querySelector(":scope > ul");
          l && i.push({ ul: l, parentLi: a });
        }
      }
      for (const o of s) {
        const c = o.li.textContent.toLowerCase();
        o.selfMatches = r === "" || c.includes(r), o.childrenMatch = !1;
      }
      for (let o = s.length - 1; o >= 0; o--) {
        const c = s[o], a = c.li.querySelector(":scope > ul");
        if (a) {
          const l = Array.from(a.children).filter(
            (h) => h.tagName === "LI"
          );
          c.childrenMatch = l.some((h) => {
            const d = s.find((f) => f.li === h);
            return d && (d.selfMatches || d.childrenMatch);
          });
        }
        if (c.parentLi) {
          const l = s.find((h) => h.li === c.parentLi);
          l && (c.selfMatches || c.childrenMatch) && (l.childrenMatch = !0);
        }
      }
      for (const o of s) {
        const c = o.li, u = c.querySelector(":scope > ul"), a = c.querySelector("details"), l = o.selfMatches || o.childrenMatch;
        c.style.display = l ? "" : "none", a && (l ? a.open = !0 : a.open = !1), o.selfMatches && u && Array.from(u.children).filter(
          (d) => d.tagName === "LI"
        ).forEach((d) => {
          d.style.display = "";
        });
      }
    });
  });
}
function fe() {
  const n = window.location.origin + window.location.pathname;
  document.querySelectorAll(
    "ul[data-clickable-item-list-autoselector]"
  ).forEach((t) => {
    const r = t.querySelectorAll("a[href]");
    let s = 0;
    r.forEach((i) => {
      const o = new URL(
        i.getAttribute("href"),
        window.location.origin + window.location.pathname
      ).href, c = n.endsWith("/") ? n.slice(0, -1) : n, u = o.endsWith("/") ? o.slice(0, -1) : o;
      if (c === u) {
        const a = i.closest("li");
        a && t.contains(a) && (a.classList.add("clickable-item-list--selected"), s++);
      }
      if (s > 1) {
        r.forEach((a) => a.classList.remove("clickable-item-list--selected"));
        return;
      }
    });
  });
}
function pe() {
  document.querySelectorAll("[data-copyable-snippet]").forEach((e) => {
    if (e.querySelector("code") && !e.querySelector(".copyable-snippet-button")) {
      const r = document.createElement("button");
      r.className = "copyable-snippet-button", r.setAttribute("aria-label", "Copy"), r.textContent = "📋", e.appendChild(r);
    }
  }), document.addEventListener("click", (e) => {
    const t = e.target.closest(".copyable-snippet-button");
    if (!t) return;
    const r = t.closest("[data-copyable-snippet]");
    if (!r) return;
    const s = r.querySelector("code");
    if (!s) return;
    const i = s.textContent;
    if (!i) return;
    const o = t.textContent;
    navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(i).then(() => {
      t.disabled = !0, t.textContent = "✅", setTimeout(() => {
        t.textContent = o, t.disabled = !1;
      }, 1e3);
    }).catch(() => n(i, t, o)) : n(i, t, o);
  });
  function n(e, t, r) {
    const s = document.createElement("textarea");
    s.value = e, s.style.position = "fixed", s.style.opacity = "0", document.body.appendChild(s), s.select();
    try {
      document.execCommand("copy") ? t.textContent = "✅" : t.textContent = "❌";
    } catch (i) {
      console.warn("Fallback copy failed:", i), t.textContent = "❌";
    }
    document.body.removeChild(s), setTimeout(() => t.textContent = r, 1e3);
  }
}
function L(n) {
  return Array.isArray ? Array.isArray(n) : re(n) === "[object Array]";
}
function ge(n) {
  if (typeof n == "string")
    return n;
  let e = n + "";
  return e == "0" && 1 / n == -1 / 0 ? "-0" : e;
}
function me(n) {
  return n == null ? "" : ge(n);
}
function D(n) {
  return typeof n == "string";
}
function ne(n) {
  return typeof n == "number";
}
function Ae(n) {
  return n === !0 || n === !1 || ye(n) && re(n) == "[object Boolean]";
}
function se(n) {
  return typeof n == "object";
}
function ye(n) {
  return se(n) && n !== null;
}
function S(n) {
  return n != null;
}
function P(n) {
  return !n.trim().length;
}
function re(n) {
  return n == null ? n === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(n);
}
const Ce = "Incorrect 'index' type", Ee = (n) => `Invalid value for key ${n}`, Me = (n) => `Pattern length exceeds max of ${n}.`, xe = (n) => `Missing ${n} property in key`, Fe = (n) => `Property 'weight' in key '${n}' must be a positive integer`, Q = Object.prototype.hasOwnProperty;
class Be {
  constructor(e) {
    this._keys = [], this._keyMap = {};
    let t = 0;
    e.forEach((r) => {
      let s = ie(r);
      this._keys.push(s), this._keyMap[s.id] = s, t += s.weight;
    }), this._keys.forEach((r) => {
      r.weight /= t;
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
function ie(n) {
  let e = null, t = null, r = null, s = 1, i = null;
  if (D(n) || L(n))
    r = n, e = J(n), t = z(n);
  else {
    if (!Q.call(n, "name"))
      throw new Error(xe("name"));
    const o = n.name;
    if (r = o, Q.call(n, "weight") && (s = n.weight, s <= 0))
      throw new Error(Fe(o));
    e = J(o), t = z(o), i = n.getFn;
  }
  return { path: e, id: t, weight: s, src: r, getFn: i };
}
function J(n) {
  return L(n) ? n : n.split(".");
}
function z(n) {
  return L(n) ? n.join(".") : n;
}
function Se(n, e) {
  let t = [], r = !1;
  const s = (i, o, c) => {
    if (S(i))
      if (!o[c])
        t.push(i);
      else {
        let u = o[c];
        const a = i[u];
        if (!S(a))
          return;
        if (c === o.length - 1 && (D(a) || ne(a) || Ae(a)))
          t.push(me(a));
        else if (L(a)) {
          r = !0;
          for (let l = 0, h = a.length; l < h; l += 1)
            s(a[l], o, c + 1);
        } else o.length && s(a, o, c + 1);
      }
  };
  return s(n, D(e) ? e.split(".") : e, 0), r ? t : t[0];
}
const be = {
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
  ...be,
  ...De,
  ...Le
};
const ve = /[^ ]+/g;
function ke(n = 1, e = 3) {
  const t = /* @__PURE__ */ new Map(), r = Math.pow(10, e);
  return {
    get(s) {
      const i = s.match(ve).length;
      if (t.has(i))
        return t.get(i);
      const o = 1 / Math.pow(i, 0.5 * n), c = parseFloat(Math.round(o * r) / r);
      return t.set(i, c), c;
    },
    clear() {
      t.clear();
    }
  };
}
class G {
  constructor({
    getFn: e = p.getFn,
    fieldNormWeight: t = p.fieldNormWeight
  } = {}) {
    this.norm = ke(t, 3), this.getFn = e, this.isCreated = !1, this.setIndexRecords();
  }
  setSources(e = []) {
    this.docs = e;
  }
  setIndexRecords(e = []) {
    this.records = e;
  }
  setKeys(e = []) {
    this.keys = e, this._keysMap = {}, e.forEach((t, r) => {
      this._keysMap[t.id] = r;
    });
  }
  create() {
    this.isCreated || !this.docs.length || (this.isCreated = !0, D(this.docs[0]) ? this.docs.forEach((e, t) => {
      this._addString(e, t);
    }) : this.docs.forEach((e, t) => {
      this._addObject(e, t);
    }), this.norm.clear());
  }
  // Adds a doc to the end of the index
  add(e) {
    const t = this.size();
    D(e) ? this._addString(e, t) : this._addObject(e, t);
  }
  // Removes the doc at the specified index of the index
  removeAt(e) {
    this.records.splice(e, 1);
    for (let t = e, r = this.size(); t < r; t += 1)
      this.records[t].i -= 1;
  }
  getValueForItemAtKeyId(e, t) {
    return e[this._keysMap[t]];
  }
  size() {
    return this.records.length;
  }
  _addString(e, t) {
    if (!S(e) || P(e))
      return;
    let r = {
      v: e,
      i: t,
      n: this.norm.get(e)
    };
    this.records.push(r);
  }
  _addObject(e, t) {
    let r = { i: t, $: {} };
    this.keys.forEach((s, i) => {
      let o = s.getFn ? s.getFn(e) : this.getFn(e, s.path);
      if (S(o)) {
        if (L(o)) {
          let c = [];
          const u = [{ nestedArrIndex: -1, value: o }];
          for (; u.length; ) {
            const { nestedArrIndex: a, value: l } = u.pop();
            if (S(l))
              if (D(l) && !P(l)) {
                let h = {
                  v: l,
                  i: a,
                  n: this.norm.get(l)
                };
                c.push(h);
              } else L(l) && l.forEach((h, d) => {
                u.push({
                  nestedArrIndex: d,
                  value: h
                });
              });
          }
          r.$[i] = c;
        } else if (D(o) && !P(o)) {
          let c = {
            v: o,
            n: this.norm.get(o)
          };
          r.$[i] = c;
        }
      }
    }), this.records.push(r);
  }
  toJSON() {
    return {
      keys: this.keys,
      records: this.records
    };
  }
}
function ce(n, e, { getFn: t = p.getFn, fieldNormWeight: r = p.fieldNormWeight } = {}) {
  const s = new G({ getFn: t, fieldNormWeight: r });
  return s.setKeys(n.map(ie)), s.setSources(e), s.create(), s;
}
function Ie(n, { getFn: e = p.getFn, fieldNormWeight: t = p.fieldNormWeight } = {}) {
  const { keys: r, records: s } = n, i = new G({ getFn: e, fieldNormWeight: t });
  return i.setKeys(r), i.setIndexRecords(s), i;
}
function T(n, {
  errors: e = 0,
  currentLocation: t = 0,
  expectedLocation: r = 0,
  distance: s = p.distance,
  ignoreLocation: i = p.ignoreLocation
} = {}) {
  const o = e / n.length;
  if (i)
    return o;
  const c = Math.abs(r - t);
  return s ? o + c / s : c ? 1 : o;
}
function _e(n = [], e = p.minMatchCharLength) {
  let t = [], r = -1, s = -1, i = 0;
  for (let o = n.length; i < o; i += 1) {
    let c = n[i];
    c && r === -1 ? r = i : !c && r !== -1 && (s = i - 1, s - r + 1 >= e && t.push([r, s]), r = -1);
  }
  return n[i - 1] && i - r >= e && t.push([r, i - 1]), t;
}
const I = 32;
function Ne(n, e, t, {
  location: r = p.location,
  distance: s = p.distance,
  threshold: i = p.threshold,
  findAllMatches: o = p.findAllMatches,
  minMatchCharLength: c = p.minMatchCharLength,
  includeMatches: u = p.includeMatches,
  ignoreLocation: a = p.ignoreLocation
} = {}) {
  if (e.length > I)
    throw new Error(Me(I));
  const l = e.length, h = n.length, d = Math.max(0, Math.min(r, h));
  let f = i, g = d;
  const A = c > 1 || u, m = A ? Array(h) : [];
  let x;
  for (; (x = n.indexOf(e, g)) > -1; ) {
    let E = T(e, {
      currentLocation: x,
      expectedLocation: d,
      distance: s,
      ignoreLocation: a
    });
    if (f = Math.min(E, f), g = x + l, A) {
      let B = 0;
      for (; B < l; )
        m[x + B] = 1, B += 1;
    }
  }
  g = -1;
  let y = [], M = 1, C = l + h;
  const b = 1 << l - 1;
  for (let E = 0; E < l; E += 1) {
    let B = 0, v = C;
    for (; B < v; )
      T(e, {
        errors: E,
        currentLocation: d + v,
        expectedLocation: d,
        distance: s,
        ignoreLocation: a
      }) <= f ? B = v : C = v, v = Math.floor((C - B) / 2 + B);
    C = v;
    let Y = Math.max(1, d - v + 1), j = o ? h : Math.min(d + v, h) + l, _ = Array(j + 2);
    _[j + 1] = (1 << E) - 1;
    for (let w = j; w >= Y; w -= 1) {
      let R = w - 1, V = t[n.charAt(R)];
      if (A && (m[R] = +!!V), _[w] = (_[w + 1] << 1 | 1) & V, E && (_[w] |= (y[w + 1] | y[w]) << 1 | 1 | y[w + 1]), _[w] & b && (M = T(e, {
        errors: E,
        currentLocation: R,
        expectedLocation: d,
        distance: s,
        ignoreLocation: a
      }), M <= f)) {
        if (f = M, g = R, g <= d)
          break;
        Y = Math.max(1, 2 * d - g);
      }
    }
    if (T(e, {
      errors: E + 1,
      currentLocation: d,
      expectedLocation: d,
      distance: s,
      ignoreLocation: a
    }) > f)
      break;
    y = _;
  }
  const F = {
    isMatch: g >= 0,
    // Count exact matches (those with a score of 0) to be "almost" exact
    score: Math.max(1e-3, M)
  };
  if (A) {
    const E = _e(m, c);
    E.length ? u && (F.indices = E) : F.isMatch = !1;
  }
  return F;
}
function Re(n) {
  let e = {};
  for (let t = 0, r = n.length; t < r; t += 1) {
    const s = n.charAt(t);
    e[s] = (e[s] || 0) | 1 << r - t - 1;
  }
  return e;
}
const $ = String.prototype.normalize ? (n) => n.normalize("NFD").replace(/[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]/g, "") : (n) => n;
class oe {
  constructor(e, {
    location: t = p.location,
    threshold: r = p.threshold,
    distance: s = p.distance,
    includeMatches: i = p.includeMatches,
    findAllMatches: o = p.findAllMatches,
    minMatchCharLength: c = p.minMatchCharLength,
    isCaseSensitive: u = p.isCaseSensitive,
    ignoreDiacritics: a = p.ignoreDiacritics,
    ignoreLocation: l = p.ignoreLocation
  } = {}) {
    if (this.options = {
      location: t,
      threshold: r,
      distance: s,
      includeMatches: i,
      findAllMatches: o,
      minMatchCharLength: c,
      isCaseSensitive: u,
      ignoreDiacritics: a,
      ignoreLocation: l
    }, e = u ? e : e.toLowerCase(), e = a ? $(e) : e, this.pattern = e, this.chunks = [], !this.pattern.length)
      return;
    const h = (f, g) => {
      this.chunks.push({
        pattern: f,
        alphabet: Re(f),
        startIndex: g
      });
    }, d = this.pattern.length;
    if (d > I) {
      let f = 0;
      const g = d % I, A = d - g;
      for (; f < A; )
        h(this.pattern.substr(f, I), f), f += I;
      if (g) {
        const m = d - I;
        h(this.pattern.substr(m), m);
      }
    } else
      h(this.pattern, 0);
  }
  searchIn(e) {
    const { isCaseSensitive: t, ignoreDiacritics: r, includeMatches: s } = this.options;
    if (e = t ? e : e.toLowerCase(), e = r ? $(e) : e, this.pattern === e) {
      let A = {
        isMatch: !0,
        score: 0
      };
      return s && (A.indices = [[0, e.length - 1]]), A;
    }
    const {
      location: i,
      distance: o,
      threshold: c,
      findAllMatches: u,
      minMatchCharLength: a,
      ignoreLocation: l
    } = this.options;
    let h = [], d = 0, f = !1;
    this.chunks.forEach(({ pattern: A, alphabet: m, startIndex: x }) => {
      const { isMatch: y, score: M, indices: C } = Ne(e, A, m, {
        location: i + x,
        distance: o,
        threshold: c,
        findAllMatches: u,
        minMatchCharLength: a,
        includeMatches: s,
        ignoreLocation: l
      });
      y && (f = !0), d += M, y && C && (h = [...h, ...C]);
    });
    let g = {
      isMatch: f,
      score: f ? d / this.chunks.length : 1
    };
    return f && s && (g.indices = h), g;
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
function X(n, e) {
  const t = n.match(e);
  return t ? t[1] : null;
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
    const t = e === this.pattern;
    return {
      isMatch: t,
      score: t ? 0 : 1,
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
    const r = e.indexOf(this.pattern) === -1;
    return {
      isMatch: r,
      score: r ? 0 : 1,
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
    const t = e.startsWith(this.pattern);
    return {
      isMatch: t,
      score: t ? 0 : 1,
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
    const t = !e.startsWith(this.pattern);
    return {
      isMatch: t,
      score: t ? 0 : 1,
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
    const t = e.endsWith(this.pattern);
    return {
      isMatch: t,
      score: t ? 0 : 1,
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
    const t = !e.endsWith(this.pattern);
    return {
      isMatch: t,
      score: t ? 0 : 1,
      indices: [0, e.length - 1]
    };
  }
}
class ue extends k {
  constructor(e, {
    location: t = p.location,
    threshold: r = p.threshold,
    distance: s = p.distance,
    includeMatches: i = p.includeMatches,
    findAllMatches: o = p.findAllMatches,
    minMatchCharLength: c = p.minMatchCharLength,
    isCaseSensitive: u = p.isCaseSensitive,
    ignoreDiacritics: a = p.ignoreDiacritics,
    ignoreLocation: l = p.ignoreLocation
  } = {}) {
    super(e), this._bitapSearch = new oe(e, {
      location: t,
      threshold: r,
      distance: s,
      includeMatches: i,
      findAllMatches: o,
      minMatchCharLength: c,
      isCaseSensitive: u,
      ignoreDiacritics: a,
      ignoreLocation: l
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
class ae extends k {
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
    let t = 0, r;
    const s = [], i = this.pattern.length;
    for (; (r = e.indexOf(this.pattern, t)) > -1; )
      t = r + i, s.push([r, t - 1]);
    const o = !!s.length;
    return {
      isMatch: o,
      score: o ? 0 : 1,
      indices: s
    };
  }
}
const W = [
  Te,
  ae,
  Oe,
  je,
  ze,
  Pe,
  $e,
  ue
], Z = W.length, We = / +(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/, Ue = "|";
function Ke(n, e = {}) {
  return n.split(Ue).map((t) => {
    let r = t.trim().split(We).filter((i) => i && !!i.trim()), s = [];
    for (let i = 0, o = r.length; i < o; i += 1) {
      const c = r[i];
      let u = !1, a = -1;
      for (; !u && ++a < Z; ) {
        const l = W[a];
        let h = l.isMultiMatch(c);
        h && (s.push(new l(h, e)), u = !0);
      }
      if (!u)
        for (a = -1; ++a < Z; ) {
          const l = W[a];
          let h = l.isSingleMatch(c);
          if (h) {
            s.push(new l(h, e));
            break;
          }
        }
    }
    return s;
  });
}
const qe = /* @__PURE__ */ new Set([ue.type, ae.type]);
class He {
  constructor(e, {
    isCaseSensitive: t = p.isCaseSensitive,
    ignoreDiacritics: r = p.ignoreDiacritics,
    includeMatches: s = p.includeMatches,
    minMatchCharLength: i = p.minMatchCharLength,
    ignoreLocation: o = p.ignoreLocation,
    findAllMatches: c = p.findAllMatches,
    location: u = p.location,
    threshold: a = p.threshold,
    distance: l = p.distance
  } = {}) {
    this.query = null, this.options = {
      isCaseSensitive: t,
      ignoreDiacritics: r,
      includeMatches: s,
      minMatchCharLength: i,
      findAllMatches: c,
      ignoreLocation: o,
      location: u,
      threshold: a,
      distance: l
    }, e = t ? e : e.toLowerCase(), e = r ? $(e) : e, this.pattern = e, this.query = Ke(this.pattern, this.options);
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
    const { includeMatches: r, isCaseSensitive: s, ignoreDiacritics: i } = this.options;
    e = s ? e : e.toLowerCase(), e = i ? $(e) : e;
    let o = 0, c = [], u = 0;
    for (let a = 0, l = t.length; a < l; a += 1) {
      const h = t[a];
      c.length = 0, o = 0;
      for (let d = 0, f = h.length; d < f; d += 1) {
        const g = h[d], { isMatch: A, indices: m, score: x } = g.search(e);
        if (A) {
          if (o += 1, u += x, r) {
            const y = g.constructor.type;
            qe.has(y) ? c = [...c, ...m] : c.push(m);
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
        return r && (d.indices = c), d;
      }
    }
    return {
      isMatch: !1,
      score: 1
    };
  }
}
const U = [];
function Ge(...n) {
  U.push(...n);
}
function K(n, e) {
  for (let t = 0, r = U.length; t < r; t += 1) {
    let s = U[t];
    if (s.condition(n, e))
      return new s(n, e);
  }
  return new oe(n, e);
}
const O = {
  AND: "$and",
  OR: "$or"
}, q = {
  PATH: "$path",
  PATTERN: "$val"
}, H = (n) => !!(n[O.AND] || n[O.OR]), Ye = (n) => !!n[q.PATH], Ve = (n) => !L(n) && se(n) && !H(n), ee = (n) => ({
  [O.AND]: Object.keys(n).map((e) => ({
    [e]: n[e]
  }))
});
function le(n, e, { auto: t = !0 } = {}) {
  const r = (s) => {
    let i = Object.keys(s);
    const o = Ye(s);
    if (!o && i.length > 1 && !H(s))
      return r(ee(s));
    if (Ve(s)) {
      const u = o ? s[q.PATH] : i[0], a = o ? s[q.PATTERN] : s[u];
      if (!D(a))
        throw new Error(Ee(u));
      const l = {
        keyId: z(u),
        pattern: a
      };
      return t && (l.searcher = K(a, e)), l;
    }
    let c = {
      children: [],
      operator: i[0]
    };
    return i.forEach((u) => {
      const a = s[u];
      L(a) && a.forEach((l) => {
        c.children.push(r(l));
      });
    }), c;
  };
  return H(n) || (n = ee(n)), r(n);
}
function Qe(n, { ignoreFieldNorm: e = p.ignoreFieldNorm }) {
  n.forEach((t) => {
    let r = 1;
    t.matches.forEach(({ key: s, norm: i, score: o }) => {
      const c = s ? s.weight : null;
      r *= Math.pow(
        o === 0 && c ? Number.EPSILON : o,
        (c || 1) * (e ? 1 : i)
      );
    }), t.score = r;
  });
}
function Je(n, e) {
  const t = n.matches;
  e.matches = [], S(t) && t.forEach((r) => {
    if (!S(r.indices) || !r.indices.length)
      return;
    const { indices: s, value: i } = r;
    let o = {
      indices: s,
      value: i
    };
    r.key && (o.key = r.key.src), r.idx > -1 && (o.refIndex = r.idx), e.matches.push(o);
  });
}
function Xe(n, e) {
  e.score = n.score;
}
function Ze(n, e, {
  includeMatches: t = p.includeMatches,
  includeScore: r = p.includeScore
} = {}) {
  const s = [];
  return t && s.push(Je), r && s.push(Xe), n.map((i) => {
    const { idx: o } = i, c = {
      item: e[o],
      refIndex: o
    };
    return s.length && s.forEach((u) => {
      u(i, c);
    }), c;
  });
}
class N {
  constructor(e, t = {}, r) {
    this.options = { ...p, ...t }, this.options.useExtendedSearch, this._keyStore = new Be(this.options.keys), this.setCollection(e, r);
  }
  setCollection(e, t) {
    if (this._docs = e, t && !(t instanceof G))
      throw new Error(Ce);
    this._myIndex = t || ce(this.options.keys, this._docs, {
      getFn: this.options.getFn,
      fieldNormWeight: this.options.fieldNormWeight
    });
  }
  add(e) {
    S(e) && (this._docs.push(e), this._myIndex.add(e));
  }
  remove(e = () => !1) {
    const t = [];
    for (let r = 0, s = this._docs.length; r < s; r += 1) {
      const i = this._docs[r];
      e(i, r) && (this.removeAt(r), r -= 1, s -= 1, t.push(i));
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
      includeMatches: r,
      includeScore: s,
      shouldSort: i,
      sortFn: o,
      ignoreFieldNorm: c
    } = this.options;
    let u = D(e) ? D(this._docs[0]) ? this._searchStringList(e) : this._searchObjectList(e) : this._searchLogical(e);
    return Qe(u, { ignoreFieldNorm: c }), i && u.sort(o), ne(t) && t > -1 && (u = u.slice(0, t)), Ze(u, this._docs, {
      includeMatches: r,
      includeScore: s
    });
  }
  _searchStringList(e) {
    const t = K(e, this.options), { records: r } = this._myIndex, s = [];
    return r.forEach(({ v: i, i: o, n: c }) => {
      if (!S(i))
        return;
      const { isMatch: u, score: a, indices: l } = t.searchIn(i);
      u && s.push({
        item: i,
        idx: o,
        matches: [{ score: a, value: i, norm: c, indices: l }]
      });
    }), s;
  }
  _searchLogical(e) {
    const t = le(e, this.options), r = (c, u, a) => {
      if (!c.children) {
        const { keyId: h, searcher: d } = c, f = this._findMatches({
          key: this._keyStore.get(h),
          value: this._myIndex.getValueForItemAtKeyId(u, h),
          searcher: d
        });
        return f && f.length ? [
          {
            idx: a,
            item: u,
            matches: f
          }
        ] : [];
      }
      const l = [];
      for (let h = 0, d = c.children.length; h < d; h += 1) {
        const f = c.children[h], g = r(f, u, a);
        if (g.length)
          l.push(...g);
        else if (c.operator === O.AND)
          return [];
      }
      return l;
    }, s = this._myIndex.records, i = {}, o = [];
    return s.forEach(({ $: c, i: u }) => {
      if (S(c)) {
        let a = r(t, c, u);
        a.length && (i[u] || (i[u] = { idx: u, item: c, matches: [] }, o.push(i[u])), a.forEach(({ matches: l }) => {
          i[u].matches.push(...l);
        }));
      }
    }), o;
  }
  _searchObjectList(e) {
    const t = K(e, this.options), { keys: r, records: s } = this._myIndex, i = [];
    return s.forEach(({ $: o, i: c }) => {
      if (!S(o))
        return;
      let u = [];
      r.forEach((a, l) => {
        u.push(
          ...this._findMatches({
            key: a,
            value: o[l],
            searcher: t
          })
        );
      }), u.length && i.push({
        idx: c,
        item: o,
        matches: u
      });
    }), i;
  }
  _findMatches({ key: e, value: t, searcher: r }) {
    if (!S(t))
      return [];
    let s = [];
    if (L(t))
      t.forEach(({ v: i, i: o, n: c }) => {
        if (!S(i))
          return;
        const { isMatch: u, score: a, indices: l } = r.searchIn(i);
        u && s.push({
          score: a,
          key: e,
          value: i,
          idx: o,
          norm: c,
          indices: l
        });
      });
    else {
      const { v: i, n: o } = t, { isMatch: c, score: u, indices: a } = r.searchIn(i);
      c && s.push({ score: u, key: e, value: i, norm: o, indices: a });
    }
    return s;
  }
}
N.version = "7.1.0";
N.createIndex = ce;
N.parseIndex = Ie;
N.config = p;
N.parseQuery = le;
Ge(He);
function et() {
  const n = document.querySelectorAll("[data-search-tool]");
  let e = !1;
  for (const c of n)
    c.addEventListener("click", async () => {
      const u = c.getAttribute("data-mode"), a = c.getAttribute("data-static-url"), l = c.getAttribute("data-dynamic-url"), {
        overlay: h,
        modal: d,
        input: f,
        results: g,
        spinner: A,
        message: m,
        dismissBtn: x,
        resultCount: y
      } = t();
      document.body.appendChild(h), document.body.appendChild(d), m.style.display = "none", y.style.display = "none", f.focus();
      let M = null, C = null;
      if (u === "static") {
        A.style.display = "block";
        try {
          C = await (await fetch(a)).json(), M = new N(C, {
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
          e = !0, m.style.display = "block", m.textContent = "⚠️ Failed to load search index, please refresh the page.", console.error("Static fetch failed:", b);
        } finally {
          A.style.display = "none";
        }
      }
      f.oninput = async function() {
        const b = f.value.trim();
        if (g.innerHTML = "", e !== !0 && (m.textContent = "", m.style.display = "none", A.style.display = "block"), !b) {
          m.style.display = "none", A.style.display = "none", y.textContent = "", y.style.display = "none";
          return;
        }
        if (u === "static" && M) {
          const F = M.search(b);
          F.length === 0 ? (m.style.display = "block", m.textContent = "No results found.", y.textContent = "", y.style.display = "none") : (m.style.display = "none", y.style.display = "block", y.textContent = `🔎 Found ${F.length} result(s).`, F.forEach((E) => {
            r(g, E.item, E.matches, E.score);
          })), A.style.display = "none";
        }
        if (u === "dynamic")
          try {
            const E = await (await fetch(l + encodeURIComponent(b))).json();
            E.length === 0 ? (m.textContent = "No results found.", y.textContent = "") : (y.textContent = `🔎 Found ${E.length} result(s).`, E.forEach(
              (B) => r(g, B.title || B.name)
            ));
          } catch (F) {
            m.textContent = "⚠️ Failed to fetch results.", console.error("Dynamic fetch failed:", F);
          } finally {
            A.style.display = "none";
          }
      }, h.onclick = () => o(d, h), x.onclick = () => o(d, h), document.addEventListener("keydown", function b(F) {
        F.key === "Escape" && (o(d, h), document.removeEventListener("keydown", b));
      });
    });
  function t() {
    const c = document.createElement("div");
    c.className = "search-tool-overlay";
    const u = document.createElement("div");
    u.className = "search-tool-modal";
    const a = document.createElement("input");
    a.className = "search-tool-input", a.type = "text", a.placeholder = "Search...";
    const l = document.createElement("button");
    l.className = "search-tool-dismiss", l.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
        <path d="m251.33-204.67-46.66-46.66L433.33-480 204.67-708.67l46.66-46.66L480-526.67l228.67-228.66 46.66 46.66L526.67-480l228.66 228.67-46.66 46.66L480-433.33 251.33-204.67Z"/>
      </svg>`;
    const h = document.createElement("div");
    h.className = "search-tool-spinner", h.textContent = "Loading...", h.style.display = "none";
    const d = document.createElement("div");
    d.className = "search-tool-message";
    const f = document.createElement("div");
    f.className = "search-tool-result-count";
    const g = document.createElement("ul");
    return g.className = "search-tool-results", u.appendChild(l), u.appendChild(a), u.appendChild(h), u.appendChild(d), u.appendChild(f), u.appendChild(g), {
      overlay: c,
      modal: u,
      input: a,
      results: g,
      spinner: h,
      message: d,
      dismissBtn: l,
      resultCount: f
    };
  }
  function r(c, u, a = [], l = null) {
    const h = document.createElement("li");
    h.className = "search-tool-result";
    const d = u.url ? document.createElement("a") : document.createElement("div");
    u.url && (d.href = u.url, d.target = "_blank", d.className = "search-tool-result-link");
    const f = document.createElement("strong"), g = document.createElement("div"), A = a.find((C) => C.key === "title"), m = a.find((C) => C.key === "content"), x = te((A == null ? void 0 : A.indices) || []);
    i(f, u.title || "", x);
    const y = s(
      u.content || "",
      (m == null ? void 0 : m.indices) || [],
      200
    ), M = te(y.adjustedIndices);
    if (i(
      g,
      y.text,
      M
    ), d.appendChild(f), d.appendChild(g), l !== null) {
      const C = document.createElement("div");
      C.style.fontSize = "0.8em", C.style.color = "gray", C.textContent = `Score: ${(l * 100).toFixed(1)}%`, d.appendChild(C);
    }
    h.appendChild(d), c.appendChild(h);
  }
  function s(c, u, a) {
    if (c.length <= a || u.length === 0)
      return {
        text: c.slice(0, a),
        adjustedIndices: u.filter(([M, C]) => M < a)
      };
    const [l, h] = u.reduce((M, C) => {
      const [b, F] = M, [E, B] = C;
      return B - E > F - b ? C : M;
    }), d = Math.floor((l + h) / 2), f = Math.max(0, d - Math.floor(a / 2)), g = Math.min(c.length, f + a), A = c.slice(f, g), m = l - f, x = h - f, y = m >= 0 && x < A.length ? [[m, x]] : [];
    return { text: A, adjustedIndices: y };
  }
  function i(c, u, a) {
    let l = 0;
    for (const [h, d] of a) {
      if (d - h + 1 < 2) continue;
      if (l < h) {
        const g = document.createTextNode(u.slice(l, h));
        c.appendChild(g);
      }
      const f = document.createElement("mark");
      f.textContent = u.slice(h, d + 1), c.appendChild(f), l = d + 1;
    }
    if (l < u.length) {
      const h = document.createTextNode(u.slice(l));
      c.appendChild(h);
    }
  }
  function o(c, u) {
    c.remove(), u.remove();
  }
}
function te(n) {
  const e = [...n].sort((r, s) => r[0] - s[0]), t = [];
  for (const [r, s] of e) {
    const i = t[t.length - 1];
    !i || r > i[1] ? t.push([r, s]) : i[1] = Math.max(i[1], s);
  }
  return t;
}
function tt() {
  const n = document.querySelector(".stt-component");
  if (!n) return;
  const e = n.querySelector('[data-stt-action="toggle"]'), t = n.querySelector('[data-stt-action="dismiss"]'), r = n.querySelector('[data-stt-element="sidebar"]'), s = n.querySelector('[data-stt-element="overlay"]');
  function i() {
    r.classList.add("stt-drawer-open"), s.classList.add("stt-overlay-visible"), document.addEventListener("keydown", c);
  }
  function o() {
    r.classList.remove("stt-drawer-open"), s.classList.remove("stt-overlay-visible"), document.removeEventListener("keydown", c);
  }
  function c(u) {
    (u.key === "Escape" || u.key === "Esc") && o();
  }
  e == null || e.addEventListener("click", i), t == null || t.addEventListener("click", o), s == null || s.addEventListener("click", o);
}
function nt() {
  st();
}
function st() {
  const n = window.location.origin + window.location.pathname;
  document.querySelectorAll(
    "nav.navigation-tabs[data-navigation-tabs-autoselector]"
  ).forEach((t) => {
    const r = t.querySelectorAll("a[href]");
    let s = 0;
    r.forEach((i) => {
      const o = i.getAttribute("href");
      if (!o) return;
      const c = new URL(
        o,
        window.location.origin + window.location.pathname
      ).href, u = n.endsWith("/") ? n.slice(0, -1) : n, a = c.endsWith("/") ? c.slice(0, -1) : c;
      if (u === a && (s++, i.classList.add("navigation-tabs--selected")), s > 1) {
        r.forEach((l) => l.classList.remove("navigation-tabs--selected"));
        return;
      }
    });
  });
}
document.addEventListener("DOMContentLoaded", () => {
  he(), tt(), et(), pe(), nt();
});
