// // src/utils/searchCache.js
// const MAX_ENTRIES = 5;             // պահիր մինչև 5 փնտրում
// const TTL_MS = 5 * 60 * 1000;      // 5 րոպե

// const _map = new Map();            // key -> { data, ts }

// export function makeAvailKey({ cityId, arrivalDate, nights, rooms, adults, children, childrenAges, provider = "goglobal" }) {
//   return [
//     String(cityId || ""),
//     String(arrivalDate || ""),
//     String(nights || ""),
//     String(rooms || ""),
//     String(adults || ""),
//     String(children || ""),
//     String(childrenAges || ""),
//     provider,
//   ].join("|");
// }

// export function getAvailFromCache(key) {
//   const e = _map.get(key);
//   if (!e) return null;
//   if (Date.now() - e.ts > TTL_MS) {
//     _map.delete(key);
//     return null;
//   }
//   // LRU touch
//   _map.delete(key);
//   _map.set(key, e);
//   return e.data; // hotels array (raw)
// }

// export function setAvailToCache(key, data) {
//   _map.set(key, { data, ts: Date.now() });
//   // trim LRU
//   while (_map.size > MAX_ENTRIES) {
//     const oldest = _map.keys().next().value;
//     _map.delete(oldest);
//   }
// }

// export function clearAvailCache() {
//   _map.clear();
// }

// src/utils/searchCache.js
const MAX_ENTRIES = 5;             // պահիր մինչև 5 փնտրում
const TTL_MS = 5 * 60 * 1000;      // 5 րոպե
const KEY = "availabilityCache/v1"; // sessionStorage persist key

let _map = new Map();              // key -> { data, ts }

// --- persist helpers ---
function persist() {
  try {
    if (typeof window === "undefined") return;
    const entries = [];
    for (const [key, val] of _map.entries()) {
      entries.push({ key, ts: val.ts, data: val.data });
    }
    sessionStorage.setItem(KEY, JSON.stringify({ entries }));
  } catch {/* ignore */}
}

function hydrate() {
  try {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return;
    const obj = JSON.parse(raw);
    const entries = Array.isArray(obj?.entries) ? obj.entries : [];
    const now = Date.now();
    _map = new Map();
    for (const e of entries) {
      if (!e || !e.key) continue;
      if (now - (Number(e.ts) || 0) > TTL_MS) continue; // drop expired
      _map.set(e.key, { data: e.data, ts: Number(e.ts) || now });
    }
  } catch {/* ignore */}
}
// hydrate once
try { hydrate(); } catch {/* ignore */}

// --- public API (unchanged) ---
export function makeAvailKey({
  cityId, arrivalDate, nights, rooms, adults, children, childrenAges, provider = "goglobal"
}) {
  return [
    String(cityId || ""),
    String(arrivalDate || ""),
    String(nights || ""),
    String(rooms || ""),
    String(adults || ""),
    String(children || ""),
    String(childrenAges || ""),
    provider,
  ].join("|");
}

export function getAvailFromCache(key) {
  const e = _map.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > TTL_MS) {
    _map.delete(key);
    persist();
    return null;
  }
  // LRU touch
  _map.delete(key);
  _map.set(key, e);
  persist();
  return e.data; // hotels array (raw)
}

export function setAvailToCache(key, data) {
  _map.set(key, { data, ts: Date.now() });
  // trim LRU
  while (_map.size > MAX_ENTRIES) {
    const oldest = _map.keys().next().value;
    _map.delete(oldest);
  }
  persist();
}

export function clearAvailCache() {
  _map.clear();
  persist();
}