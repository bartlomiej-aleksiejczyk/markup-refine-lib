function initClickableItemList(root = document) {
  handleFilters(root);
  handleAutoSelector$1(root);
}
function handleFilters(root) {
  root.querySelectorAll("input[data-mr-clickable-list-filter]").forEach((input) => {
    var _a;
    if (input.dataset.mrClickableFilterInitialized === "true") return;
    const nearbyList = ((_a = input.parentElement) == null ? void 0 : _a.querySelector("[data-mr-clickable-list]")) || (input.nextElementSibling instanceof HTMLElement && input.nextElementSibling.matches("[data-mr-clickable-list]") ? input.nextElementSibling : null);
    if (!nearbyList) {
      console.warn("No Markup Refine clickable list found near filter input");
      return;
    }
    input.dataset.mrClickableFilterInitialized = "true";
    input.addEventListener("input", () => filterList(nearbyList, input.value));
  });
}
function filterList(list, rawFilter) {
  const filterText = rawFilter.trim().toLowerCase();
  const allLis = [];
  const stack = [
    { ul: list, parentLi: null }
  ];
  while (stack.length) {
    const current = stack.pop();
    if (!current) break;
    const { ul, parentLi } = current;
    const lis = Array.from(ul.children).filter(
      (element) => element instanceof HTMLLIElement
    );
    for (const li of lis) {
      allLis.push({ li, parentLi });
      const nestedList = li.querySelector(":scope > ul");
      if (nestedList) stack.push({ ul: nestedList, parentLi: li });
    }
  }
  for (const entry of allLis) {
    const text = (entry.li.textContent ?? "").toLowerCase();
    entry.selfMatches = filterText === "" || text.includes(filterText);
    entry.childrenMatch = false;
  }
  for (let index = allLis.length - 1; index >= 0; index--) {
    const entry = allLis[index];
    const nestedList = entry.li.querySelector(":scope > ul");
    if (nestedList) {
      const immediateChildren = Array.from(nestedList.children).filter(
        (element) => element instanceof HTMLLIElement
      );
      entry.childrenMatch = immediateChildren.some((childLi) => {
        const childEntry = allLis.find((candidate) => candidate.li === childLi);
        return Boolean(childEntry && (childEntry.selfMatches || childEntry.childrenMatch));
      });
    }
    if (entry.parentLi) {
      const parentEntry = allLis.find((candidate) => candidate.li === entry.parentLi);
      if (parentEntry && (entry.selfMatches || entry.childrenMatch)) {
        parentEntry.childrenMatch = true;
      }
    }
  }
  for (const entry of allLis) {
    const nestedList = entry.li.querySelector(":scope > ul");
    const details = entry.li.querySelector("details");
    const show = Boolean(entry.selfMatches || entry.childrenMatch);
    entry.li.hidden = !show;
    if (details && filterText) details.open = show;
    if (entry.selfMatches && nestedList) {
      Array.from(nestedList.children).filter((element) => element instanceof HTMLLIElement).forEach((childLi) => {
        childLi.hidden = false;
      });
    }
  }
}
function handleAutoSelector$1(root = document) {
  const currentUrl = normalizeUrl$1(window.location.href);
  root.querySelectorAll("ul[data-mr-clickable-list-autoselect]").forEach((list) => {
    if (list.dataset.mrClickableAutoselectInitialized === "true") return;
    list.dataset.mrClickableAutoselectInitialized = "true";
    const anchors = Array.from(list.querySelectorAll("a[href]"));
    const matching = anchors.filter((anchor) => normalizeUrl$1(anchor.href) === currentUrl);
    anchors.forEach((anchor) => anchor.removeAttribute("aria-current"));
    if (matching.length === 1) matching[0].setAttribute("aria-current", "page");
  });
}
function normalizeUrl$1(url) {
  const parsed = new URL(url, window.location.href);
  const pathname = parsed.pathname.length > 1 ? parsed.pathname.replace(/\/$/, "") : parsed.pathname;
  return `${parsed.origin}${pathname}`;
}
function initCopyableSnippet(root = document) {
  root.querySelectorAll("[data-mr-copyable]").forEach((pre) => {
    if (pre.dataset.mrCopyableInitialized === "true") return;
    const code = pre.querySelector("code");
    if (!code) return;
    pre.dataset.mrCopyableInitialized = "true";
    if (pre.querySelector("[data-mr-copy-action]")) return;
    const button = document.createElement("button");
    button.className = "mr-copy-button";
    button.setAttribute("data-mr-copy-action", "");
    button.setAttribute("aria-label", "Copy code");
    button.type = "button";
    button.textContent = "📋";
    pre.appendChild(button);
    button.addEventListener("click", () => copySnippet(pre, button));
  });
}
async function copySnippet(pre, button) {
  const code = pre.querySelector("code");
  const text = code == null ? void 0 : code.textContent;
  if (!text) return;
  const originalText = button.textContent;
  const originalLabel = button.getAttribute("aria-label") ?? "Copy code";
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(text);
    showCopyResult(button, true, originalText, originalLabel);
  } catch {
    showCopyResult(button, fallbackCopy(text), originalText, originalLabel);
  }
}
function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    return document.execCommand("copy");
  } catch (error) {
    console.warn("Fallback copy failed:", error);
    return false;
  } finally {
    textarea.remove();
  }
}
function showCopyResult(button, success, originalText, originalLabel) {
  button.disabled = true;
  button.textContent = success ? "✅" : "❌";
  button.setAttribute("aria-label", success ? "Copied" : "Copy failed");
  window.setTimeout(() => {
    button.textContent = originalText;
    button.setAttribute("aria-label", originalLabel);
    button.disabled = false;
  }, 1e3);
}
function isArray(value) {
  return !Array.isArray ? getTag(value) === "[object Array]" : Array.isArray(value);
}
function baseToString(value) {
  if (typeof value == "string") {
    return value;
  }
  let result = value + "";
  return result == "0" && 1 / value == -Infinity ? "-0" : result;
}
function toString(value) {
  return value == null ? "" : baseToString(value);
}
function isString(value) {
  return typeof value === "string";
}
function isNumber(value) {
  return typeof value === "number";
}
function isBoolean(value) {
  return value === true || value === false || isObjectLike(value) && getTag(value) == "[object Boolean]";
}
function isObject(value) {
  return typeof value === "object";
}
function isObjectLike(value) {
  return isObject(value) && value !== null;
}
function isDefined(value) {
  return value !== void 0 && value !== null;
}
function isBlank(value) {
  return !value.trim().length;
}
function getTag(value) {
  return value == null ? value === void 0 ? "[object Undefined]" : "[object Null]" : Object.prototype.toString.call(value);
}
const INCORRECT_INDEX_TYPE = "Incorrect 'index' type";
const LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY = (key) => `Invalid value for key ${key}`;
const PATTERN_LENGTH_TOO_LARGE = (max) => `Pattern length exceeds max of ${max}.`;
const MISSING_KEY_PROPERTY = (name) => `Missing ${name} property in key`;
const INVALID_KEY_WEIGHT_VALUE = (key) => `Property 'weight' in key '${key}' must be a positive integer`;
const hasOwn = Object.prototype.hasOwnProperty;
class KeyStore {
  constructor(keys) {
    this._keys = [];
    this._keyMap = {};
    let totalWeight = 0;
    keys.forEach((key) => {
      let obj = createKey(key);
      this._keys.push(obj);
      this._keyMap[obj.id] = obj;
      totalWeight += obj.weight;
    });
    this._keys.forEach((key) => {
      key.weight /= totalWeight;
    });
  }
  get(keyId) {
    return this._keyMap[keyId];
  }
  keys() {
    return this._keys;
  }
  toJSON() {
    return JSON.stringify(this._keys);
  }
}
function createKey(key) {
  let path = null;
  let id = null;
  let src = null;
  let weight = 1;
  let getFn = null;
  if (isString(key) || isArray(key)) {
    src = key;
    path = createKeyPath(key);
    id = createKeyId(key);
  } else {
    if (!hasOwn.call(key, "name")) {
      throw new Error(MISSING_KEY_PROPERTY("name"));
    }
    const name = key.name;
    src = name;
    if (hasOwn.call(key, "weight")) {
      weight = key.weight;
      if (weight <= 0) {
        throw new Error(INVALID_KEY_WEIGHT_VALUE(name));
      }
    }
    path = createKeyPath(name);
    id = createKeyId(name);
    getFn = key.getFn;
  }
  return { path, id, weight, src, getFn };
}
function createKeyPath(key) {
  return isArray(key) ? key : key.split(".");
}
function createKeyId(key) {
  return isArray(key) ? key.join(".") : key;
}
function get(obj, path) {
  let list = [];
  let arr = false;
  const deepGet = (obj2, path2, index) => {
    if (!isDefined(obj2)) {
      return;
    }
    if (!path2[index]) {
      list.push(obj2);
    } else {
      let key = path2[index];
      const value = obj2[key];
      if (!isDefined(value)) {
        return;
      }
      if (index === path2.length - 1 && (isString(value) || isNumber(value) || isBoolean(value))) {
        list.push(toString(value));
      } else if (isArray(value)) {
        arr = true;
        for (let i = 0, len = value.length; i < len; i += 1) {
          deepGet(value[i], path2, index + 1);
        }
      } else if (path2.length) {
        deepGet(value, path2, index + 1);
      }
    }
  };
  deepGet(obj, isString(path) ? path.split(".") : path, 0);
  return arr ? list : list[0];
}
const MatchOptions = {
  // Whether the matches should be included in the result set. When `true`, each record in the result
  // set will include the indices of the matched characters.
  // These can consequently be used for highlighting purposes.
  includeMatches: false,
  // When `true`, the matching function will continue to the end of a search pattern even if
  // a perfect match has already been located in the string.
  findAllMatches: false,
  // Minimum number of characters that must be matched before a result is considered a match
  minMatchCharLength: 1
};
const BasicOptions = {
  // When `true`, the algorithm continues searching to the end of the input even if a perfect
  // match is found before the end of the same input.
  isCaseSensitive: false,
  // When `true`, the algorithm will ignore diacritics (accents) in comparisons
  ignoreDiacritics: false,
  // When true, the matching function will continue to the end of a search pattern even if
  includeScore: false,
  // List of properties that will be searched. This also supports nested properties.
  keys: [],
  // Whether to sort the result list, by score
  shouldSort: true,
  // Default sort function: sort by ascending score, ascending index
  sortFn: (a, b) => a.score === b.score ? a.idx < b.idx ? -1 : 1 : a.score < b.score ? -1 : 1
};
const FuzzyOptions = {
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
};
const AdvancedOptions = {
  // When `true`, it enables the use of unix-like search commands
  useExtendedSearch: false,
  // The get function to use when fetching an object's properties.
  // The default will search nested paths *ie foo.bar.baz*
  getFn: get,
  // When `true`, search will ignore `location` and `distance`, so it won't matter
  // where in the string the pattern appears.
  // More info: https://fusejs.io/concepts/scoring-theory.html#fuzziness-score
  ignoreLocation: false,
  // When `true`, the calculation for the relevance score (used for sorting) will
  // ignore the field-length norm.
  // More info: https://fusejs.io/concepts/scoring-theory.html#field-length-norm
  ignoreFieldNorm: false,
  // The weight to determine how much field length norm effects scoring.
  fieldNormWeight: 1
};
var Config = {
  ...BasicOptions,
  ...MatchOptions,
  ...FuzzyOptions,
  ...AdvancedOptions
};
const SPACE = /[^ ]+/g;
function norm(weight = 1, mantissa = 3) {
  const cache = /* @__PURE__ */ new Map();
  const m = Math.pow(10, mantissa);
  return {
    get(value) {
      const numTokens = value.match(SPACE).length;
      if (cache.has(numTokens)) {
        return cache.get(numTokens);
      }
      const norm2 = 1 / Math.pow(numTokens, 0.5 * weight);
      const n = parseFloat(Math.round(norm2 * m) / m);
      cache.set(numTokens, n);
      return n;
    },
    clear() {
      cache.clear();
    }
  };
}
class FuseIndex {
  constructor({
    getFn = Config.getFn,
    fieldNormWeight = Config.fieldNormWeight
  } = {}) {
    this.norm = norm(fieldNormWeight, 3);
    this.getFn = getFn;
    this.isCreated = false;
    this.setIndexRecords();
  }
  setSources(docs = []) {
    this.docs = docs;
  }
  setIndexRecords(records = []) {
    this.records = records;
  }
  setKeys(keys = []) {
    this.keys = keys;
    this._keysMap = {};
    keys.forEach((key, idx) => {
      this._keysMap[key.id] = idx;
    });
  }
  create() {
    if (this.isCreated || !this.docs.length) {
      return;
    }
    this.isCreated = true;
    if (isString(this.docs[0])) {
      this.docs.forEach((doc, docIndex) => {
        this._addString(doc, docIndex);
      });
    } else {
      this.docs.forEach((doc, docIndex) => {
        this._addObject(doc, docIndex);
      });
    }
    this.norm.clear();
  }
  // Adds a doc to the end of the index
  add(doc) {
    const idx = this.size();
    if (isString(doc)) {
      this._addString(doc, idx);
    } else {
      this._addObject(doc, idx);
    }
  }
  // Removes the doc at the specified index of the index
  removeAt(idx) {
    this.records.splice(idx, 1);
    for (let i = idx, len = this.size(); i < len; i += 1) {
      this.records[i].i -= 1;
    }
  }
  getValueForItemAtKeyId(item, keyId) {
    return item[this._keysMap[keyId]];
  }
  size() {
    return this.records.length;
  }
  _addString(doc, docIndex) {
    if (!isDefined(doc) || isBlank(doc)) {
      return;
    }
    let record = {
      v: doc,
      i: docIndex,
      n: this.norm.get(doc)
    };
    this.records.push(record);
  }
  _addObject(doc, docIndex) {
    let record = { i: docIndex, $: {} };
    this.keys.forEach((key, keyIndex) => {
      let value = key.getFn ? key.getFn(doc) : this.getFn(doc, key.path);
      if (!isDefined(value)) {
        return;
      }
      if (isArray(value)) {
        let subRecords = [];
        const stack = [{ nestedArrIndex: -1, value }];
        while (stack.length) {
          const { nestedArrIndex, value: value2 } = stack.pop();
          if (!isDefined(value2)) {
            continue;
          }
          if (isString(value2) && !isBlank(value2)) {
            let subRecord = {
              v: value2,
              i: nestedArrIndex,
              n: this.norm.get(value2)
            };
            subRecords.push(subRecord);
          } else if (isArray(value2)) {
            value2.forEach((item, k) => {
              stack.push({
                nestedArrIndex: k,
                value: item
              });
            });
          } else ;
        }
        record.$[keyIndex] = subRecords;
      } else if (isString(value) && !isBlank(value)) {
        let subRecord = {
          v: value,
          n: this.norm.get(value)
        };
        record.$[keyIndex] = subRecord;
      }
    });
    this.records.push(record);
  }
  toJSON() {
    return {
      keys: this.keys,
      records: this.records
    };
  }
}
function createIndex(keys, docs, { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
  const myIndex = new FuseIndex({ getFn, fieldNormWeight });
  myIndex.setKeys(keys.map(createKey));
  myIndex.setSources(docs);
  myIndex.create();
  return myIndex;
}
function parseIndex(data, { getFn = Config.getFn, fieldNormWeight = Config.fieldNormWeight } = {}) {
  const { keys, records } = data;
  const myIndex = new FuseIndex({ getFn, fieldNormWeight });
  myIndex.setKeys(keys);
  myIndex.setIndexRecords(records);
  return myIndex;
}
function computeScore$1(pattern, {
  errors = 0,
  currentLocation = 0,
  expectedLocation = 0,
  distance = Config.distance,
  ignoreLocation = Config.ignoreLocation
} = {}) {
  const accuracy = errors / pattern.length;
  if (ignoreLocation) {
    return accuracy;
  }
  const proximity = Math.abs(expectedLocation - currentLocation);
  if (!distance) {
    return proximity ? 1 : accuracy;
  }
  return accuracy + proximity / distance;
}
function convertMaskToIndices(matchmask = [], minMatchCharLength = Config.minMatchCharLength) {
  let indices = [];
  let start = -1;
  let end = -1;
  let i = 0;
  for (let len = matchmask.length; i < len; i += 1) {
    let match = matchmask[i];
    if (match && start === -1) {
      start = i;
    } else if (!match && start !== -1) {
      end = i - 1;
      if (end - start + 1 >= minMatchCharLength) {
        indices.push([start, end]);
      }
      start = -1;
    }
  }
  if (matchmask[i - 1] && i - start >= minMatchCharLength) {
    indices.push([start, i - 1]);
  }
  return indices;
}
const MAX_BITS = 32;
function search(text, pattern, patternAlphabet, {
  location = Config.location,
  distance = Config.distance,
  threshold = Config.threshold,
  findAllMatches = Config.findAllMatches,
  minMatchCharLength = Config.minMatchCharLength,
  includeMatches = Config.includeMatches,
  ignoreLocation = Config.ignoreLocation
} = {}) {
  if (pattern.length > MAX_BITS) {
    throw new Error(PATTERN_LENGTH_TOO_LARGE(MAX_BITS));
  }
  const patternLen = pattern.length;
  const textLen = text.length;
  const expectedLocation = Math.max(0, Math.min(location, textLen));
  let currentThreshold = threshold;
  let bestLocation = expectedLocation;
  const computeMatches = minMatchCharLength > 1 || includeMatches;
  const matchMask = computeMatches ? Array(textLen) : [];
  let index;
  while ((index = text.indexOf(pattern, bestLocation)) > -1) {
    let score = computeScore$1(pattern, {
      currentLocation: index,
      expectedLocation,
      distance,
      ignoreLocation
    });
    currentThreshold = Math.min(score, currentThreshold);
    bestLocation = index + patternLen;
    if (computeMatches) {
      let i = 0;
      while (i < patternLen) {
        matchMask[index + i] = 1;
        i += 1;
      }
    }
  }
  bestLocation = -1;
  let lastBitArr = [];
  let finalScore = 1;
  let binMax = patternLen + textLen;
  const mask = 1 << patternLen - 1;
  for (let i = 0; i < patternLen; i += 1) {
    let binMin = 0;
    let binMid = binMax;
    while (binMin < binMid) {
      const score2 = computeScore$1(pattern, {
        errors: i,
        currentLocation: expectedLocation + binMid,
        expectedLocation,
        distance,
        ignoreLocation
      });
      if (score2 <= currentThreshold) {
        binMin = binMid;
      } else {
        binMax = binMid;
      }
      binMid = Math.floor((binMax - binMin) / 2 + binMin);
    }
    binMax = binMid;
    let start = Math.max(1, expectedLocation - binMid + 1);
    let finish = findAllMatches ? textLen : Math.min(expectedLocation + binMid, textLen) + patternLen;
    let bitArr = Array(finish + 2);
    bitArr[finish + 1] = (1 << i) - 1;
    for (let j = finish; j >= start; j -= 1) {
      let currentLocation = j - 1;
      let charMatch = patternAlphabet[text.charAt(currentLocation)];
      if (computeMatches) {
        matchMask[currentLocation] = +!!charMatch;
      }
      bitArr[j] = (bitArr[j + 1] << 1 | 1) & charMatch;
      if (i) {
        bitArr[j] |= (lastBitArr[j + 1] | lastBitArr[j]) << 1 | 1 | lastBitArr[j + 1];
      }
      if (bitArr[j] & mask) {
        finalScore = computeScore$1(pattern, {
          errors: i,
          currentLocation,
          expectedLocation,
          distance,
          ignoreLocation
        });
        if (finalScore <= currentThreshold) {
          currentThreshold = finalScore;
          bestLocation = currentLocation;
          if (bestLocation <= expectedLocation) {
            break;
          }
          start = Math.max(1, 2 * expectedLocation - bestLocation);
        }
      }
    }
    const score = computeScore$1(pattern, {
      errors: i + 1,
      currentLocation: expectedLocation,
      expectedLocation,
      distance,
      ignoreLocation
    });
    if (score > currentThreshold) {
      break;
    }
    lastBitArr = bitArr;
  }
  const result = {
    isMatch: bestLocation >= 0,
    // Count exact matches (those with a score of 0) to be "almost" exact
    score: Math.max(1e-3, finalScore)
  };
  if (computeMatches) {
    const indices = convertMaskToIndices(matchMask, minMatchCharLength);
    if (!indices.length) {
      result.isMatch = false;
    } else if (includeMatches) {
      result.indices = indices;
    }
  }
  return result;
}
function createPatternAlphabet(pattern) {
  let mask = {};
  for (let i = 0, len = pattern.length; i < len; i += 1) {
    const char = pattern.charAt(i);
    mask[char] = (mask[char] || 0) | 1 << len - i - 1;
  }
  return mask;
}
const stripDiacritics = String.prototype.normalize ? ((str) => str.normalize("NFD").replace(/[\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F]/g, "")) : ((str) => str);
class BitapSearch {
  constructor(pattern, {
    location = Config.location,
    threshold = Config.threshold,
    distance = Config.distance,
    includeMatches = Config.includeMatches,
    findAllMatches = Config.findAllMatches,
    minMatchCharLength = Config.minMatchCharLength,
    isCaseSensitive = Config.isCaseSensitive,
    ignoreDiacritics = Config.ignoreDiacritics,
    ignoreLocation = Config.ignoreLocation
  } = {}) {
    this.options = {
      location,
      threshold,
      distance,
      includeMatches,
      findAllMatches,
      minMatchCharLength,
      isCaseSensitive,
      ignoreDiacritics,
      ignoreLocation
    };
    pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
    pattern = ignoreDiacritics ? stripDiacritics(pattern) : pattern;
    this.pattern = pattern;
    this.chunks = [];
    if (!this.pattern.length) {
      return;
    }
    const addChunk = (pattern2, startIndex) => {
      this.chunks.push({
        pattern: pattern2,
        alphabet: createPatternAlphabet(pattern2),
        startIndex
      });
    };
    const len = this.pattern.length;
    if (len > MAX_BITS) {
      let i = 0;
      const remainder = len % MAX_BITS;
      const end = len - remainder;
      while (i < end) {
        addChunk(this.pattern.substr(i, MAX_BITS), i);
        i += MAX_BITS;
      }
      if (remainder) {
        const startIndex = len - MAX_BITS;
        addChunk(this.pattern.substr(startIndex), startIndex);
      }
    } else {
      addChunk(this.pattern, 0);
    }
  }
  searchIn(text) {
    const { isCaseSensitive, ignoreDiacritics, includeMatches } = this.options;
    text = isCaseSensitive ? text : text.toLowerCase();
    text = ignoreDiacritics ? stripDiacritics(text) : text;
    if (this.pattern === text) {
      let result2 = {
        isMatch: true,
        score: 0
      };
      if (includeMatches) {
        result2.indices = [[0, text.length - 1]];
      }
      return result2;
    }
    const {
      location,
      distance,
      threshold,
      findAllMatches,
      minMatchCharLength,
      ignoreLocation
    } = this.options;
    let allIndices = [];
    let totalScore = 0;
    let hasMatches = false;
    this.chunks.forEach(({ pattern, alphabet, startIndex }) => {
      const { isMatch, score, indices } = search(text, pattern, alphabet, {
        location: location + startIndex,
        distance,
        threshold,
        findAllMatches,
        minMatchCharLength,
        includeMatches,
        ignoreLocation
      });
      if (isMatch) {
        hasMatches = true;
      }
      totalScore += score;
      if (isMatch && indices) {
        allIndices = [...allIndices, ...indices];
      }
    });
    let result = {
      isMatch: hasMatches,
      score: hasMatches ? totalScore / this.chunks.length : 1
    };
    if (hasMatches && includeMatches) {
      result.indices = allIndices;
    }
    return result;
  }
}
class BaseMatch {
  constructor(pattern) {
    this.pattern = pattern;
  }
  static isMultiMatch(pattern) {
    return getMatch(pattern, this.multiRegex);
  }
  static isSingleMatch(pattern) {
    return getMatch(pattern, this.singleRegex);
  }
  search() {
  }
}
function getMatch(pattern, exp) {
  const matches = pattern.match(exp);
  return matches ? matches[1] : null;
}
class ExactMatch extends BaseMatch {
  constructor(pattern) {
    super(pattern);
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
  search(text) {
    const isMatch = text === this.pattern;
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, this.pattern.length - 1]
    };
  }
}
class InverseExactMatch extends BaseMatch {
  constructor(pattern) {
    super(pattern);
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
  search(text) {
    const index = text.indexOf(this.pattern);
    const isMatch = index === -1;
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, text.length - 1]
    };
  }
}
class PrefixExactMatch extends BaseMatch {
  constructor(pattern) {
    super(pattern);
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
  search(text) {
    const isMatch = text.startsWith(this.pattern);
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, this.pattern.length - 1]
    };
  }
}
class InversePrefixExactMatch extends BaseMatch {
  constructor(pattern) {
    super(pattern);
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
  search(text) {
    const isMatch = !text.startsWith(this.pattern);
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, text.length - 1]
    };
  }
}
class SuffixExactMatch extends BaseMatch {
  constructor(pattern) {
    super(pattern);
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
  search(text) {
    const isMatch = text.endsWith(this.pattern);
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [text.length - this.pattern.length, text.length - 1]
    };
  }
}
class InverseSuffixExactMatch extends BaseMatch {
  constructor(pattern) {
    super(pattern);
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
  search(text) {
    const isMatch = !text.endsWith(this.pattern);
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices: [0, text.length - 1]
    };
  }
}
class FuzzyMatch extends BaseMatch {
  constructor(pattern, {
    location = Config.location,
    threshold = Config.threshold,
    distance = Config.distance,
    includeMatches = Config.includeMatches,
    findAllMatches = Config.findAllMatches,
    minMatchCharLength = Config.minMatchCharLength,
    isCaseSensitive = Config.isCaseSensitive,
    ignoreDiacritics = Config.ignoreDiacritics,
    ignoreLocation = Config.ignoreLocation
  } = {}) {
    super(pattern);
    this._bitapSearch = new BitapSearch(pattern, {
      location,
      threshold,
      distance,
      includeMatches,
      findAllMatches,
      minMatchCharLength,
      isCaseSensitive,
      ignoreDiacritics,
      ignoreLocation
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
  search(text) {
    return this._bitapSearch.searchIn(text);
  }
}
class IncludeMatch extends BaseMatch {
  constructor(pattern) {
    super(pattern);
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
  search(text) {
    let location = 0;
    let index;
    const indices = [];
    const patternLen = this.pattern.length;
    while ((index = text.indexOf(this.pattern, location)) > -1) {
      location = index + patternLen;
      indices.push([index, location - 1]);
    }
    const isMatch = !!indices.length;
    return {
      isMatch,
      score: isMatch ? 0 : 1,
      indices
    };
  }
}
const searchers = [
  ExactMatch,
  IncludeMatch,
  PrefixExactMatch,
  InversePrefixExactMatch,
  InverseSuffixExactMatch,
  SuffixExactMatch,
  InverseExactMatch,
  FuzzyMatch
];
const searchersLen = searchers.length;
const SPACE_RE = / +(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/;
const OR_TOKEN = "|";
function parseQuery(pattern, options = {}) {
  return pattern.split(OR_TOKEN).map((item) => {
    let query = item.trim().split(SPACE_RE).filter((item2) => item2 && !!item2.trim());
    let results = [];
    for (let i = 0, len = query.length; i < len; i += 1) {
      const queryItem = query[i];
      let found = false;
      let idx = -1;
      while (!found && ++idx < searchersLen) {
        const searcher = searchers[idx];
        let token = searcher.isMultiMatch(queryItem);
        if (token) {
          results.push(new searcher(token, options));
          found = true;
        }
      }
      if (found) {
        continue;
      }
      idx = -1;
      while (++idx < searchersLen) {
        const searcher = searchers[idx];
        let token = searcher.isSingleMatch(queryItem);
        if (token) {
          results.push(new searcher(token, options));
          break;
        }
      }
    }
    return results;
  });
}
const MultiMatchSet = /* @__PURE__ */ new Set([FuzzyMatch.type, IncludeMatch.type]);
class ExtendedSearch {
  constructor(pattern, {
    isCaseSensitive = Config.isCaseSensitive,
    ignoreDiacritics = Config.ignoreDiacritics,
    includeMatches = Config.includeMatches,
    minMatchCharLength = Config.minMatchCharLength,
    ignoreLocation = Config.ignoreLocation,
    findAllMatches = Config.findAllMatches,
    location = Config.location,
    threshold = Config.threshold,
    distance = Config.distance
  } = {}) {
    this.query = null;
    this.options = {
      isCaseSensitive,
      ignoreDiacritics,
      includeMatches,
      minMatchCharLength,
      findAllMatches,
      ignoreLocation,
      location,
      threshold,
      distance
    };
    pattern = isCaseSensitive ? pattern : pattern.toLowerCase();
    pattern = ignoreDiacritics ? stripDiacritics(pattern) : pattern;
    this.pattern = pattern;
    this.query = parseQuery(this.pattern, this.options);
  }
  static condition(_, options) {
    return options.useExtendedSearch;
  }
  searchIn(text) {
    const query = this.query;
    if (!query) {
      return {
        isMatch: false,
        score: 1
      };
    }
    const { includeMatches, isCaseSensitive, ignoreDiacritics } = this.options;
    text = isCaseSensitive ? text : text.toLowerCase();
    text = ignoreDiacritics ? stripDiacritics(text) : text;
    let numMatches = 0;
    let allIndices = [];
    let totalScore = 0;
    for (let i = 0, qLen = query.length; i < qLen; i += 1) {
      const searchers2 = query[i];
      allIndices.length = 0;
      numMatches = 0;
      for (let j = 0, pLen = searchers2.length; j < pLen; j += 1) {
        const searcher = searchers2[j];
        const { isMatch, indices, score } = searcher.search(text);
        if (isMatch) {
          numMatches += 1;
          totalScore += score;
          if (includeMatches) {
            const type = searcher.constructor.type;
            if (MultiMatchSet.has(type)) {
              allIndices = [...allIndices, ...indices];
            } else {
              allIndices.push(indices);
            }
          }
        } else {
          totalScore = 0;
          numMatches = 0;
          allIndices.length = 0;
          break;
        }
      }
      if (numMatches) {
        let result = {
          isMatch: true,
          score: totalScore / numMatches
        };
        if (includeMatches) {
          result.indices = allIndices;
        }
        return result;
      }
    }
    return {
      isMatch: false,
      score: 1
    };
  }
}
const registeredSearchers = [];
function register(...args) {
  registeredSearchers.push(...args);
}
function createSearcher(pattern, options) {
  for (let i = 0, len = registeredSearchers.length; i < len; i += 1) {
    let searcherClass = registeredSearchers[i];
    if (searcherClass.condition(pattern, options)) {
      return new searcherClass(pattern, options);
    }
  }
  return new BitapSearch(pattern, options);
}
const LogicalOperator = {
  AND: "$and",
  OR: "$or"
};
const KeyType = {
  PATH: "$path",
  PATTERN: "$val"
};
const isExpression = (query) => !!(query[LogicalOperator.AND] || query[LogicalOperator.OR]);
const isPath = (query) => !!query[KeyType.PATH];
const isLeaf = (query) => !isArray(query) && isObject(query) && !isExpression(query);
const convertToExplicit = (query) => ({
  [LogicalOperator.AND]: Object.keys(query).map((key) => ({
    [key]: query[key]
  }))
});
function parse(query, options, { auto = true } = {}) {
  const next = (query2) => {
    let keys = Object.keys(query2);
    const isQueryPath = isPath(query2);
    if (!isQueryPath && keys.length > 1 && !isExpression(query2)) {
      return next(convertToExplicit(query2));
    }
    if (isLeaf(query2)) {
      const key = isQueryPath ? query2[KeyType.PATH] : keys[0];
      const pattern = isQueryPath ? query2[KeyType.PATTERN] : query2[key];
      if (!isString(pattern)) {
        throw new Error(LOGICAL_SEARCH_INVALID_QUERY_FOR_KEY(key));
      }
      const obj = {
        keyId: createKeyId(key),
        pattern
      };
      if (auto) {
        obj.searcher = createSearcher(pattern, options);
      }
      return obj;
    }
    let node = {
      children: [],
      operator: keys[0]
    };
    keys.forEach((key) => {
      const value = query2[key];
      if (isArray(value)) {
        value.forEach((item) => {
          node.children.push(next(item));
        });
      }
    });
    return node;
  };
  if (!isExpression(query)) {
    query = convertToExplicit(query);
  }
  return next(query);
}
function computeScore(results, { ignoreFieldNorm = Config.ignoreFieldNorm }) {
  results.forEach((result) => {
    let totalScore = 1;
    result.matches.forEach(({ key, norm: norm2, score }) => {
      const weight = key ? key.weight : null;
      totalScore *= Math.pow(
        score === 0 && weight ? Number.EPSILON : score,
        (weight || 1) * (ignoreFieldNorm ? 1 : norm2)
      );
    });
    result.score = totalScore;
  });
}
function transformMatches(result, data) {
  const matches = result.matches;
  data.matches = [];
  if (!isDefined(matches)) {
    return;
  }
  matches.forEach((match) => {
    if (!isDefined(match.indices) || !match.indices.length) {
      return;
    }
    const { indices, value } = match;
    let obj = {
      indices,
      value
    };
    if (match.key) {
      obj.key = match.key.src;
    }
    if (match.idx > -1) {
      obj.refIndex = match.idx;
    }
    data.matches.push(obj);
  });
}
function transformScore(result, data) {
  data.score = result.score;
}
function format(results, docs, {
  includeMatches = Config.includeMatches,
  includeScore = Config.includeScore
} = {}) {
  const transformers = [];
  if (includeMatches) transformers.push(transformMatches);
  if (includeScore) transformers.push(transformScore);
  return results.map((result) => {
    const { idx } = result;
    const data = {
      item: docs[idx],
      refIndex: idx
    };
    if (transformers.length) {
      transformers.forEach((transformer) => {
        transformer(result, data);
      });
    }
    return data;
  });
}
class Fuse {
  constructor(docs, options = {}, index) {
    this.options = { ...Config, ...options };
    if (this.options.useExtendedSearch && false) ;
    this._keyStore = new KeyStore(this.options.keys);
    this.setCollection(docs, index);
  }
  setCollection(docs, index) {
    this._docs = docs;
    if (index && !(index instanceof FuseIndex)) {
      throw new Error(INCORRECT_INDEX_TYPE);
    }
    this._myIndex = index || createIndex(this.options.keys, this._docs, {
      getFn: this.options.getFn,
      fieldNormWeight: this.options.fieldNormWeight
    });
  }
  add(doc) {
    if (!isDefined(doc)) {
      return;
    }
    this._docs.push(doc);
    this._myIndex.add(doc);
  }
  remove(predicate = () => false) {
    const results = [];
    for (let i = 0, len = this._docs.length; i < len; i += 1) {
      const doc = this._docs[i];
      if (predicate(doc, i)) {
        this.removeAt(i);
        i -= 1;
        len -= 1;
        results.push(doc);
      }
    }
    return results;
  }
  removeAt(idx) {
    this._docs.splice(idx, 1);
    this._myIndex.removeAt(idx);
  }
  getIndex() {
    return this._myIndex;
  }
  search(query, { limit = -1 } = {}) {
    const {
      includeMatches,
      includeScore,
      shouldSort,
      sortFn,
      ignoreFieldNorm
    } = this.options;
    let results = isString(query) ? isString(this._docs[0]) ? this._searchStringList(query) : this._searchObjectList(query) : this._searchLogical(query);
    computeScore(results, { ignoreFieldNorm });
    if (shouldSort) {
      results.sort(sortFn);
    }
    if (isNumber(limit) && limit > -1) {
      results = results.slice(0, limit);
    }
    return format(results, this._docs, {
      includeMatches,
      includeScore
    });
  }
  _searchStringList(query) {
    const searcher = createSearcher(query, this.options);
    const { records } = this._myIndex;
    const results = [];
    records.forEach(({ v: text, i: idx, n: norm2 }) => {
      if (!isDefined(text)) {
        return;
      }
      const { isMatch, score, indices } = searcher.searchIn(text);
      if (isMatch) {
        results.push({
          item: text,
          idx,
          matches: [{ score, value: text, norm: norm2, indices }]
        });
      }
    });
    return results;
  }
  _searchLogical(query) {
    const expression = parse(query, this.options);
    const evaluate = (node, item, idx) => {
      if (!node.children) {
        const { keyId, searcher } = node;
        const matches = this._findMatches({
          key: this._keyStore.get(keyId),
          value: this._myIndex.getValueForItemAtKeyId(item, keyId),
          searcher
        });
        if (matches && matches.length) {
          return [
            {
              idx,
              item,
              matches
            }
          ];
        }
        return [];
      }
      const res = [];
      for (let i = 0, len = node.children.length; i < len; i += 1) {
        const child = node.children[i];
        const result = evaluate(child, item, idx);
        if (result.length) {
          res.push(...result);
        } else if (node.operator === LogicalOperator.AND) {
          return [];
        }
      }
      return res;
    };
    const records = this._myIndex.records;
    const resultMap = {};
    const results = [];
    records.forEach(({ $: item, i: idx }) => {
      if (isDefined(item)) {
        let expResults = evaluate(expression, item, idx);
        if (expResults.length) {
          if (!resultMap[idx]) {
            resultMap[idx] = { idx, item, matches: [] };
            results.push(resultMap[idx]);
          }
          expResults.forEach(({ matches }) => {
            resultMap[idx].matches.push(...matches);
          });
        }
      }
    });
    return results;
  }
  _searchObjectList(query) {
    const searcher = createSearcher(query, this.options);
    const { keys, records } = this._myIndex;
    const results = [];
    records.forEach(({ $: item, i: idx }) => {
      if (!isDefined(item)) {
        return;
      }
      let matches = [];
      keys.forEach((key, keyIndex) => {
        matches.push(
          ...this._findMatches({
            key,
            value: item[keyIndex],
            searcher
          })
        );
      });
      if (matches.length) {
        results.push({
          idx,
          item,
          matches
        });
      }
    });
    return results;
  }
  _findMatches({ key, value, searcher }) {
    if (!isDefined(value)) {
      return [];
    }
    let matches = [];
    if (isArray(value)) {
      value.forEach(({ v: text, i: idx, n: norm2 }) => {
        if (!isDefined(text)) {
          return;
        }
        const { isMatch, score, indices } = searcher.searchIn(text);
        if (isMatch) {
          matches.push({
            score,
            key,
            value: text,
            idx,
            norm: norm2,
            indices
          });
        }
      });
    } else {
      const { v: text, n: norm2 } = value;
      const { isMatch, score, indices } = searcher.searchIn(text);
      if (isMatch) {
        matches.push({ score, key, value: text, norm: norm2, indices });
      }
    }
    return matches;
  }
}
Fuse.version = "7.1.0";
Fuse.createIndex = createIndex;
Fuse.parseIndex = parseIndex;
Fuse.config = Config;
{
  Fuse.parseQuery = parse;
}
{
  register(ExtendedSearch);
}
function initSearchTool(root = document) {
  root.querySelectorAll("[data-mr-search]").forEach((trigger) => {
    if (trigger.dataset.mrSearchInitialized === "true") return;
    trigger.dataset.mrSearchInitialized = "true";
    trigger.addEventListener("click", () => openSearch(trigger));
  });
}
async function openSearch(trigger) {
  const staticUrl = trigger.getAttribute("data-mr-search-static-url") || "";
  const dynamicUrl = trigger.getAttribute("data-mr-search-dynamic-url") || "";
  const mode = staticUrl && !dynamicUrl ? "static" : dynamicUrl && !staticUrl ? "dynamic" : null;
  if (!mode) {
    console.warn(
      "Markup Refine search needs exactly one of data-mr-search-static-url or data-mr-search-dynamic-url."
    );
    return;
  }
  const existing = document.querySelector(
    'dialog[data-mr-search-part="dialog"][open]'
  );
  if (existing) return;
  const {
    dialog,
    input,
    results,
    searchIcon,
    spinner,
    message,
    dismissButton,
    resultCount
  } = createSearchDialog();
  document.body.appendChild(dialog);
  dialog.showModal();
  input.focus();
  let fuse = null;
  let loadingFailed = false;
  const close = () => {
    if (dialog.open) dialog.close();
  };
  dialog.addEventListener("close", () => {
    dialog.remove();
    trigger.focus();
  }, { once: true });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) close();
  });
  dismissButton.addEventListener("click", close);
  if (mode === "static") {
    setLoading(true, searchIcon, spinner);
    try {
      const response = await fetch(staticUrl);
      if (!response.ok) throw new Error(`Search index request failed with ${response.status}`);
      const dataset = await response.json();
      fuse = new Fuse(dataset, {
        includeScore: false,
        includeMatches: true,
        useExtendedSearch: true,
        minMatchCharLength: 2,
        distance: 1e4,
        threshold: 0.4,
        keys: [
          { name: "title", weight: 0.7 },
          { name: "content", weight: 0.3 }
        ]
      });
    } catch (error) {
      loadingFailed = true;
      message.hidden = false;
      message.textContent = "⚠️ Failed to load search index, please refresh the page.";
      console.error("Static search index fetch failed:", error);
    } finally {
      setLoading(false, searchIcon, spinner);
    }
  }
  let debounceId = null;
  const debounceMs = 800;
  input.addEventListener("input", () => {
    const query = input.value.trim();
    if (debounceId !== null) {
      clearTimeout(debounceId);
      debounceId = null;
    }
    if (!query) {
      clearSearchUi(results, message, resultCount);
      setLoading(false, searchIcon, spinner);
      return;
    }
    debounceId = window.setTimeout(() => {
      void performSearch(query);
    }, debounceMs);
  });
  async function performSearch(query) {
    clearSearchUi(results, message, resultCount);
    if (!loadingFailed) setLoading(true, searchIcon, spinner);
    if (mode === "static" && fuse) {
      const searchResults = fuse.search(query);
      renderResultSummary(searchResults.length, message, resultCount);
      searchResults.forEach((result) => {
        appendResult(results, result.item, result.matches || [], result.score ?? null);
      });
      setLoading(false, searchIcon, spinner);
      return;
    }
    if (mode === "dynamic") {
      try {
        const response = await fetch(dynamicUrl + encodeURIComponent(query));
        if (!response.ok) throw new Error(`Search request failed with ${response.status}`);
        const data = await response.json();
        const dynamicResults = Array.isArray(data.results) ? data.results : [];
        renderResultSummary(dynamicResults.length, message, resultCount);
        dynamicResults.forEach((item) => appendResult(results, item));
      } catch (error) {
        message.hidden = false;
        message.textContent = "🔎 Failed to fetch results.";
        console.error("Dynamic search failed:", error);
      } finally {
        setLoading(false, searchIcon, spinner);
      }
    }
  }
  function appendResult(container, item, matches = [], score = null) {
    const li = document.createElement("li");
    li.className = "mr-search__result";
    li.setAttribute("data-mr-search-part", "result");
    let wrapper;
    if (item.url) {
      const anchor = document.createElement("a");
      anchor.href = item.url;
      anchor.target = "_blank";
      anchor.className = "mr-search__result-link";
      anchor.setAttribute("data-mr-search-part", "result-link");
      wrapper = anchor;
    } else {
      wrapper = document.createElement("div");
    }
    const titleEl = document.createElement("strong");
    const contentEl = document.createElement("div");
    const titleMatch = matches.find((m) => m.key === "title");
    const contentMatch = matches.find((m) => m.key === "content");
    const mergedTitleIndices = mergeRanges((titleMatch == null ? void 0 : titleMatch.indices) || []);
    const titleText = item.title || "";
    if (mergedTitleIndices.length > 0) {
      renderHighlightedText(titleEl, titleText, mergedTitleIndices);
    } else {
      titleEl.textContent = titleText;
    }
    const fullContent = item.content || "";
    const truncated = truncateToMatch(
      fullContent,
      (contentMatch == null ? void 0 : contentMatch.indices) || [],
      200
    );
    const mergedTruncatedTextIndices = mergeRanges(truncated.adjustedIndices);
    if (mergedTruncatedTextIndices.length > 0) {
      renderHighlightedText(
        contentEl,
        truncated.text,
        mergedTruncatedTextIndices
      );
    } else {
      contentEl.textContent = truncated.text;
    }
    wrapper.appendChild(titleEl);
    wrapper.appendChild(contentEl);
    if (score !== null) {
      const scoreEl = document.createElement("div");
      scoreEl.style.fontSize = "0.8em";
      scoreEl.style.color = "gray";
      scoreEl.textContent = `Score: ${(score * 100).toFixed(1)}%`;
      wrapper.appendChild(scoreEl);
    }
    li.appendChild(wrapper);
    container.appendChild(li);
  }
  function truncateToMatch(text, indices, maxLen) {
    if (text.length <= maxLen || indices.length === 0) {
      return {
        text: text.slice(0, maxLen),
        adjustedIndices: indices.filter(([s, e]) => s < maxLen)
      };
    }
    const [matchStart, matchEnd] = indices.reduce((longest, current) => {
      const [s1, e1] = longest;
      const [s2, e2] = current;
      return e2 - s2 > e1 - s1 ? current : longest;
    });
    const matchCenter = Math.floor((matchStart + matchEnd) / 2);
    const start = Math.max(0, matchCenter - Math.floor(maxLen / 2));
    const end = Math.min(text.length, start + maxLen);
    const sliced = text.slice(start, end);
    const adjustedStart = matchStart - start;
    const adjustedEnd = matchEnd - start;
    const adjustedIndices = adjustedStart >= 0 && adjustedEnd < sliced.length ? [[adjustedStart, adjustedEnd]] : [];
    return { text: sliced, adjustedIndices };
  }
  function renderHighlightedText(parent, text, indices) {
    let lastIndex = 0;
    for (const [start, end] of indices) {
      if (end - start + 1 < 2) continue;
      if (lastIndex < start) {
        const span = document.createTextNode(text.slice(lastIndex, start));
        parent.appendChild(span);
      }
      const mark = document.createElement("mark");
      mark.textContent = text.slice(start, end + 1);
      parent.appendChild(mark);
      lastIndex = end + 1;
    }
    if (lastIndex < text.length) {
      const span = document.createTextNode(text.slice(lastIndex));
      parent.appendChild(span);
    }
  }
}
function createSearchDialog() {
  const dialog = document.createElement("dialog");
  dialog.className = "mr-search";
  dialog.setAttribute("data-mr-search-part", "dialog");
  dialog.setAttribute("aria-label", "Search");
  const input = document.createElement("input");
  input.className = "mr-search__input";
  input.setAttribute("data-mr-search-part", "input");
  input.type = "search";
  input.placeholder = "Search...";
  input.autocomplete = "off";
  input.autofocus = true;
  input.setAttribute("aria-label", "Search query");
  const dismissButton = document.createElement("button");
  dismissButton.className = "mr-search__dismiss";
  dismissButton.setAttribute("data-mr-search-part", "dismiss");
  dismissButton.setAttribute("aria-label", "Close search");
  dismissButton.type = "button";
  dismissButton.innerHTML = `
    <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px">
      <path d="m251.33-204.67-46.66-46.66L433.33-480 204.67-708.67l46.66-46.66L480-526.67l228.67-228.66 46.66 46.66L526.67-480l228.66 228.67-46.66 46.66L480-433.33 251.33-204.67Z"/>
    </svg>`;
  const searchIcon = document.createElement("div");
  searchIcon.className = "mr-search__icon";
  searchIcon.setAttribute("data-mr-search-part", "icon");
  searchIcon.setAttribute("aria-hidden", "true");
  searchIcon.innerHTML = `
    <svg aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" height="35px" viewBox="0 -960 960 960" width="35px">
      <path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/>
    </svg>`;
  const spinner = document.createElement("div");
  spinner.classList.add("mr-search__spinner", "mr-search__icon");
  spinner.setAttribute("data-mr-search-part", "spinner");
  spinner.setAttribute("aria-hidden", "true");
  spinner.hidden = true;
  const message = document.createElement("div");
  message.className = "mr-search__message";
  message.setAttribute("data-mr-search-part", "message");
  message.setAttribute("role", "status");
  message.setAttribute("aria-live", "polite");
  message.hidden = true;
  const resultCount = document.createElement("div");
  resultCount.className = "mr-search__count";
  resultCount.setAttribute("data-mr-search-part", "count");
  resultCount.setAttribute("role", "status");
  resultCount.setAttribute("aria-live", "polite");
  resultCount.hidden = true;
  const results = document.createElement("ul");
  results.className = "mr-search__results";
  results.setAttribute("data-mr-search-part", "results");
  dialog.append(dismissButton, input, searchIcon, spinner, message, resultCount, results);
  return { dialog, input, results, searchIcon, spinner, message, dismissButton, resultCount };
}
function clearSearchUi(results, message, resultCount) {
  results.replaceChildren();
  message.textContent = "";
  message.hidden = true;
  resultCount.textContent = "";
  resultCount.hidden = true;
}
function setLoading(loading, searchIcon, spinner) {
  searchIcon.hidden = loading;
  spinner.hidden = !loading;
}
function renderResultSummary(count, message, resultCount) {
  if (count === 0) {
    message.hidden = false;
    message.textContent = "No results found.";
    return;
  }
  resultCount.hidden = false;
  resultCount.textContent = `Found ${count} result(s).`;
}
function mergeRanges(ranges) {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (!last || start > last[1]) {
      merged.push([start, end]);
    } else {
      last[1] = Math.max(last[1], end);
    }
  }
  return merged;
}
function initApplicationShell(root = document) {
  root.querySelectorAll("[data-mr-shell]").forEach((shell, index) => {
    if (shell.dataset.mrShellInitialized === "true") return;
    const toggle = shell.querySelector('[data-mr-shell-action="toggle"]');
    const dismiss = shell.querySelector('[data-mr-shell-action="dismiss"]');
    const sidebar = shell.querySelector('[data-mr-shell-part="sidebar"]');
    const overlay = shell.querySelector('[data-mr-shell-part="overlay"]');
    if (!sidebar || !overlay) return;
    shell.dataset.mrShellInitialized = "true";
    shell.dataset.mrState = "closed";
    overlay.hidden = true;
    if (!sidebar.id) sidebar.id = `mr-shell-sidebar-${index + 1}`;
    if (toggle) {
      toggle.type = "button";
      toggle.setAttribute("aria-controls", sidebar.id);
      toggle.setAttribute("aria-expanded", "false");
    }
    if (dismiss) {
      dismiss.type = "button";
      if (!dismiss.hasAttribute("aria-label")) dismiss.setAttribute("aria-label", "Close navigation");
    }
    const openSidebar = () => {
      shell.dataset.mrState = "open";
      overlay.hidden = false;
      toggle == null ? void 0 : toggle.setAttribute("aria-expanded", "true");
      dismiss == null ? void 0 : dismiss.focus();
      document.addEventListener("keydown", handleEscape);
    };
    const closeSidebar = (restoreFocus = true) => {
      shell.dataset.mrState = "closed";
      overlay.hidden = true;
      toggle == null ? void 0 : toggle.setAttribute("aria-expanded", "false");
      document.removeEventListener("keydown", handleEscape);
      if (restoreFocus) toggle == null ? void 0 : toggle.focus();
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") closeSidebar();
    };
    toggle == null ? void 0 : toggle.addEventListener("click", openSidebar);
    dismiss == null ? void 0 : dismiss.addEventListener("click", () => closeSidebar());
    overlay.addEventListener("click", () => closeSidebar());
  });
}
function initNavbarComponents(root = document) {
  handleAutoSelector(root);
}
function handleAutoSelector(root = document) {
  const currentUrl = normalizeUrl(window.location.href);
  root.querySelectorAll("[data-mr-nav-tabs-autoselect]").forEach((list) => {
    if (list.dataset.mrNavAutoselectInitialized === "true") return;
    list.dataset.mrNavAutoselectInitialized = "true";
    const anchors = Array.from(list.querySelectorAll("a[href]"));
    const matching = anchors.filter((anchor) => normalizeUrl(anchor.href) === currentUrl);
    anchors.forEach((anchor) => anchor.removeAttribute("aria-current"));
    if (matching.length === 1) matching[0].setAttribute("aria-current", "page");
  });
}
function normalizeUrl(url) {
  const parsed = new URL(url, window.location.href);
  const pathname = parsed.pathname.length > 1 ? parsed.pathname.replace(/\/$/, "") : parsed.pathname;
  return `${parsed.origin}${pathname}`;
}
function initResettableFileInput(root = document) {
  root.querySelectorAll("[data-mr-resettable-file]").forEach((container) => {
    if (container.dataset.mrResettableFileInitialized === "true") return;
    const input = container.querySelector('input[type="file"]');
    if (!input) return;
    container.dataset.mrResettableFileInitialized = "true";
    container.classList.add("mr-file-input");
    if (container.querySelector("[data-mr-file-reset]")) return;
    const button = document.createElement("button");
    button.className = "mr-file-input__reset";
    button.setAttribute("data-mr-file-reset", "");
    button.setAttribute("aria-label", "Remove all attachments");
    button.type = "button";
    button.title = "Click to remove all attachments";
    button.textContent = "✖";
    container.appendChild(button);
    button.addEventListener("click", () => {
      input.value = "";
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.focus();
    });
  });
}
const TAB_INITIALIZED = "mrTabInitialized";
function initNavigationTabs(root = document) {
  const buttons = Array.from(root.querySelectorAll("[data-mr-tab]"));
  const groups = new Set(buttons.map(getGroupKey));
  for (const group of groups) initializeGroup(root, group);
}
function initializeGroup(root, group) {
  const buttons = getGroupButtons(root, group);
  const panels = getGroupPanels(root, group);
  if (!buttons.length || !panels.length) return;
  buttons.forEach((button, index) => {
    configureTab(button, panels, group, index);
    if (button.dataset[TAB_INITIALIZED] !== "true") {
      button.dataset[TAB_INITIALIZED] = "true";
      button.addEventListener("click", () => activateTab(root, group, button));
      button.addEventListener("keydown", (event) => handleTabKeydown(event, root, group, button));
    }
  });
  panels.forEach((panel, index) => configurePanel(panel, buttons, group, index));
  const selected = buttons.find((button) => button.getAttribute("aria-selected") === "true");
  const authoredDefault = panels.find((panel) => panel.hasAttribute("data-mr-tabs-default"));
  const defaultButton = authoredDefault ? buttons.find((button) => getTabName(button) === getPanelName(authoredDefault)) : null;
  activateTab(root, group, selected ?? defaultButton ?? buttons[0], false);
}
function configureTab(button, panels, group, index) {
  const name = getTabName(button);
  if (!name) return;
  button.setAttribute("role", "tab");
  if (button instanceof HTMLButtonElement && !button.hasAttribute("type")) button.type = "button";
  const panel = panels.find((candidate) => getPanelName(candidate) === name);
  if (!panel) return;
  if (!button.id) button.id = makeId("mr-tab", group, name, index);
  if (!panel.id) panel.id = makeId("mr-panel", group, name, index);
  button.setAttribute("aria-controls", panel.id);
}
function configurePanel(panel, buttons, group, index) {
  const name = getPanelName(panel);
  if (!name) return;
  panel.setAttribute("role", "tabpanel");
  const button = buttons.find((candidate) => getTabName(candidate) === name);
  if (!button) return;
  if (!button.id) button.id = makeId("mr-tab", group, name, index);
  if (!panel.id) panel.id = makeId("mr-panel", group, name, index);
  panel.setAttribute("aria-labelledby", button.id);
}
function activateTab(root, group, activeButton, moveFocus = false) {
  const activeName = getTabName(activeButton);
  if (!activeName) return;
  const buttons = getGroupButtons(root, group);
  const panels = getGroupPanels(root, group);
  buttons.forEach((button) => {
    const selected = button === activeButton;
    button.setAttribute("aria-selected", selected ? "true" : "false");
    button.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((panel) => {
    panel.hidden = getPanelName(panel) !== activeName;
  });
  if (moveFocus) activeButton.focus();
}
function handleTabKeydown(event, root, group, current) {
  const buttons = getGroupButtons(root, group);
  const index = buttons.indexOf(current);
  if (index < 0) return;
  let nextIndex = null;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (index + 1) % buttons.length;
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (index - 1 + buttons.length) % buttons.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = buttons.length - 1;
  }
  if (nextIndex === null) return;
  event.preventDefault();
  activateTab(root, group, buttons[nextIndex], true);
}
function getGroupButtons(root, group) {
  return Array.from(root.querySelectorAll("[data-mr-tab]")).filter(
    (button) => getGroupKey(button) === group
  );
}
function getGroupPanels(root, group) {
  return Array.from(root.querySelectorAll("[data-mr-panel]")).filter(
    (panel) => getGroupKey(panel) === group
  );
}
function getTabName(element) {
  return element.getAttribute("data-mr-tab");
}
function getPanelName(element) {
  return element.getAttribute("data-mr-panel");
}
function getGroupKey(element) {
  return element.getAttribute("data-mr-tabs-group") || "__default";
}
function makeId(prefix, group, name, index) {
  const safe = `${group}-${name}`.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${prefix}-${safe || index}`;
}
function initMarkupRefineBehaviors(root) {
  const target = root ?? (typeof document !== "undefined" ? document : null);
  if (!target) return;
  initClickableItemList(target);
  initApplicationShell(target);
  initSearchTool(target);
  initCopyableSnippet(target);
  initNavbarComponents(target);
  initResettableFileInput(target);
  initNavigationTabs(target);
}
function initializeDocument() {
  initMarkupRefineBehaviors(document);
}
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeDocument, { once: true });
  } else {
    initializeDocument();
  }
}
export {
  initMarkupRefineBehaviors
};
//# sourceMappingURL=markup-refine-lib-behaviors.js.map
