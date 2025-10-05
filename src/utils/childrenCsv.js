// src/utils/childrenCsv.js

/** ──────────────────────────────────────────────────────────────
 *  Canonical per-room CSV format (supplier-ready)
 *    adultsCSV:         "2,1"                 // per-room adults (1..6)
 *    childrenCSV:       "1,2"                 // per-room children counts (0..6)
 *    childrenAgesCSV:   "5|9,11"              // rooms by '|', ages inside by ','
 *  ────────────────────────────────────────────────────────────── */

export const ROOMS_SEP = "|";
export const AGES_SEP = ",";

/* ---------------- small utils ---------------- */
const clampInt = (n, min, max, fallback = 0) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, Math.round(x)));
};

const splitCSV = (s, sep = ",") =>
  String(s ?? "")
    .split(sep)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

/* ---------------- parse helpers ---------------- */
export function parseChildrenCountsCSV(childrenCSV = "") {
  // "1,2" -> [1,2]
  return splitCSV(childrenCSV, ",").map((n) => clampInt(n, 0, 6, 0));
}

export function parseChildrenAgesCSV(childrenAgesCSV = "") {
  // "5|9,11" -> [[5],[9,11]]
  const rooms = String(childrenAgesCSV ?? "").split(ROOMS_SEP);
  return rooms.map((seg) =>
    splitCSV(seg, AGES_SEP)
      .map((a) => clampInt(a, 0, 17, null))
      .filter((v) => v !== null)
  );
}

/** ընդունենք ցանկացած մուտք և դարձնենք հարթ թվատոքենների ցուցակ */
export function toFlatAgeTokens(val) {
  // ընդունում է թե "5|9,11", թե "5,9|11", թե նույնիսկ "5 ; 9 | 11"
  const flat = String(val ?? "")
    .replace(/[^\d,|]/g, "") // թողնում ենք միայն թվեր/սեպարատորներ
    .replace(/\|/g, ",") // room-sep → item-sep
    .replace(/,+/g, ",") // բազմակի comma → single
    .replace(/^,|,$/g, ""); // trim commas
  return splitCSV(flat, ",");
}

/** childrenCSV + flat ages -> canonical agesCSV ("5|9,11") */
export function buildAgesByRooms(
  childrenCSV = "",
  flatAgeTokens = [],
  defaultAge = 8
) {
  const perRoomCounts = parseChildrenCountsCSV(childrenCSV);
  const need = perRoomCounts.reduce((s, n) => s + n, 0);

  // sanitize tokens
  const clean = flatAgeTokens
    .map((n) => {
      const v = clampInt(n, 0, 17, null);
      return v === null ? null : String(v);
    })
    .filter((v) => v !== null);

  // լրացնել/կտրել անհրաժեշտ քանակին
  while (clean.length < need) clean.push(String(defaultAge));
  if (clean.length > need) clean.length = need;

  // բաժանել ըստ սենյակների
  let i = 0;
  const rooms = perRoomCounts.map((cnt) => {
    const chunk = clean.slice(i, i + cnt);
    i += cnt;
    return chunk.join(AGES_SEP);
  });

  return rooms.join(ROOMS_SEP);
}

/* ---------------- normalizers ---------------- */
export function normalizeChildrenCSV(children) {
  // number | string | array -> "1,2"
  if (Array.isArray(children)) {
    return children.map((n) => clampInt(n, 0, 6, 0)).join(",");
  }
  if (typeof children === "number") return String(clampInt(children, 0, 6, 0)); // legacy single-room
  // string → leave raw here; it will be parsed & clamped downstream
  return String(children || "").trim();
}

export function normalizeAgesCSV(ages) {
  // ընդունում է string | array | array-of-arrays
  // եթե array-of-arrays է՝ [[5],[9,11]] -> "5|9,11"
  // եթե single-room array է՝ [5,9]     -> "5,9"
  if (Array.isArray(ages)) {
    if (ages.length && Array.isArray(ages[0])) {
      return ages
        .map((arr) => arr.map((a) => clampInt(a, 0, 17, 8)).join(AGES_SEP))
        .join(ROOMS_SEP);
    }
    return ages.map((a) => clampInt(a, 0, 17, 8)).join(AGES_SEP);
  }
  return String(ages || "").trim();
}

/* ---------------- validators ---------------- */
export function shapeMatches(childrenCSV = "", agesCSV = "") {
  const counts = parseChildrenCountsCSV(childrenCSV);
  const ages = parseChildrenAgesCSV(agesCSV);
  if (ages.length !== counts.length) return false;
  for (let i = 0; i < counts.length; i++) {
    if ((ages[i]?.length || 0) !== (counts[i] || 0)) return false;
  }
  return true;
}

export function validateChildrenSpec({ rooms, childrenCSV, childrenAgesCSV }) {
  const R = clampInt(rooms, 1, 9, 1);
  const counts = parseChildrenCountsCSV(childrenCSV);
  const ages = parseChildrenAgesCSV(childrenAgesCSV);
  if (counts.length !== R) return false;
  if (ages.length !== R) return false;
  for (let i = 0; i < R; i++) {
    if ((ages[i]?.length || 0) !== (counts[i] || 0)) return false;
  }
  return true;
}

/* ---------------- high-level builders ---------------- */
export function computeAgesCSV(childrenCSV = "", childrenAgesCSV = "") {
  // Builds canonical "by-rooms" ages; fills ONLY missing tokens with defaultAge(=8)
  const flat = toFlatAgeTokens(childrenAgesCSV);
  return buildAgesByRooms(childrenCSV, flat, 8);
}

/**
 * Գլխավոր normalizer–ը հուկերի/կոմպոնենտների համար.
 * input:
 *  - children: number|string|array
 *  - childrenAges: string|array (կամ legacy՝ մի սենյակի ages array)
 * output:
 *  - { children: "1,2", childrenAges: "5|9,11" }
 */
export function buildChildrenParamsFromCSV(children, childrenAges) {
  const childrenCsv = normalizeChildrenCSV(children);
  const agesCsvIn = normalizeAgesCSV(childrenAges);

  let agesCsv = computeAgesCSV(childrenCsv, agesCsvIn);
  if (!shapeMatches(childrenCsv, agesCsv)) {
    // final safety
    agesCsv = computeAgesCSV(childrenCsv, agesCsvIn);
  }

  if (typeof window !== "undefined") {
    // eslint-disable-next-line no-console
    console.log("[childrenCsv] IN ->", { children, childrenAges });
    // eslint-disable-next-line no-console
    console.log("[childrenCsv] OUT ->", { childrenCsv, agesCsv });
  }

  return { children: childrenCsv, childrenAges: agesCsv };
}

/* convenient aggregate export (optional) */
export const childrenUtils = {
  ROOMS_SEP,
  AGES_SEP,
  parseChildrenCountsCSV,
  parseChildrenAgesCSV,
  toFlatAgeTokens,
  buildAgesByRooms,
  normalizeChildrenCSV,
  normalizeAgesCSV,
  shapeMatches,
  validateChildrenSpec,
  computeAgesCSV,
  buildChildrenParamsFromCSV,
};

// ---------- NEW: rooms detection from signals ----------
export function detectRoomsFromSignals(
  adultsCSV,
  childrenCSV,
  childrenAgesCSV,
  fallbackRooms
) {
  const aLen = String(adultsCSV || "")
    .split(",")
    .filter(Boolean).length;
  const cLen = String(childrenCSV || "")
    .split(",")
    .filter(Boolean).length;

  // smarter ages-based detection: count groups only if there is at least one age token somewhere
  const agesGroups = parseChildrenAgesCSV(childrenAgesCSV);
  const hasAnyAge = agesGroups.some((g) => (g?.length || 0) > 0);
  const gLen = hasAnyAge ? agesGroups.length : 0;

  const R = Math.max(
    1,
    Number(fallbackRooms || 0) || 0,
    aLen || 0,
    cLen || 0,
    gLen || 0
  );
  return R;
}

// ---------- NEW: normalize adults CSV to R rooms ----------
export function normalizeAdultsCSV(adultsCSV, R) {
  const parts = String(adultsCSV || "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map((n) => clampInt(n, 1, 6, 2));
  const out = Array.from({ length: R }, (_, i) => parts[i] ?? parts[0] ?? 2);
  return out.join(",");
}

// ---------- NEW: ensure ages for API (fills with default=8 if missing) ----------
export function ensureAgesForApi(childrenCSV, childrenAgesCSV, defaultAge = 8) {
  const perRoomCounts = parseChildrenCountsCSV(childrenCSV); // ["1,2"] -> [1,2]
  const needed = perRoomCounts.reduce((s, n) => s + n, 0);
  if (needed === 0) return ""; // no kids => no ages

  // canonicalize into "by-rooms" form first
  let agesCanon = computeAgesCSV(childrenCSV, childrenAgesCSV); // fills ONLY missing
  // re-parse to array-of-arrays
  let groups = parseChildrenAgesCSV(agesCanon);

  // pad/crop per room just in case
  groups = groups.map((g, i) => {
    const want = perRoomCounts[i] || 0;
    const arr = (g || []).slice(0, want);
    while (arr.length < want) arr.push(defaultAge);
    return arr;
  });

  return groups.map((arr) => arr.join(",")).join("|");
}

// Keep ages canonical ONLY if there are any tokens; otherwise return ""
export function computeAgesCSVIfAnyTokens(
  childrenCSV = "",
  childrenAgesCSV = "",
  defaultAge = 8
) {
  const flat = toFlatAgeTokens(childrenAgesCSV);
  if (flat.length === 0) return "";
  return buildAgesByRooms(childrenCSV, flat, defaultAge);
}

// ---------- NEW: single high-level "canon" guests normalizer ----------
export function canonGuests({
  rooms,
  adultsCSV,
  childrenCSV,
  childrenAgesCSV,
}) {
  const R = detectRoomsFromSignals(
    adultsCSV,
    childrenCSV,
    childrenAgesCSV,
    rooms
  );
  const a = normalizeAdultsCSV(adultsCSV, R);
  const c = normalizeChildrenCSV(childrenCSV);

  // ❗️Do NOT invent ages for UI/store. If no tokens → ""
  const ages = computeAgesCSVIfAnyTokens(c, childrenAgesCSV, 8);
  return { rooms: R, adultsCSV: a, childrenCSV: c, childrenAgesCSV: ages };
}
