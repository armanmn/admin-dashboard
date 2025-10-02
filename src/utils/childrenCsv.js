// src/utils/childrenCsv.js

/** ──────────────────────────────────────────────────────────────
 *  Canonical format (supplier-ready)
 *    childrenCSV:       "1,2"                 // per-room children counts
 *    childrenAgesCSV:   "5|9,11"              // rooms by '|', ages inside by ','
 *  ────────────────────────────────────────────────────────────── */

export const ROOMS_SEP = "|";
export const AGES_SEP  = ",";

/* ---------------- small utils ---------------- */
const clampInt = (n, min, max, fallback = 0) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, Math.round(x)));
};

const splitCSV = (s, sep = ",") =>
  String(s ?? "")
    .split(sep)
    .map(t => t.trim())
    .filter(t => t.length > 0);

/* ---------------- parse helpers ---------------- */
export function parseChildrenCountsCSV(childrenCSV = "") {
  // "1,2" -> [1,2]
  return splitCSV(childrenCSV, ",").map(n => clampInt(n, 0, 6, 0));
}

export function parseChildrenAgesCSV(childrenAgesCSV = "") {
  // "5|9,11" -> [[5],[9,11]]
  const rooms = String(childrenAgesCSV ?? "").split(ROOMS_SEP);
  return rooms.map(seg =>
    splitCSV(seg, AGES_SEP)
      .map(a => clampInt(a, 0, 17, null))
      .filter(v => v !== null)
  );
}

/** ընդունենք ցանկացած մուտք և դարձնենք հարթ թվատոքենների ցուցակ */
export function toFlatAgeTokens(val) {
  // ընդունում է թե "5|9,11", թե "5,9|11", թե նույնիսկ "5 ; 9 | 11"
  const flat = String(val ?? "")
    .replace(/[^\d,|]/g, "") // թողնում ենք միայն թվեր/սեպարատորներ
    .replace(/\|/g, ",")     // room-sep → item-sep
    .replace(/,+/g, ",")     // բազմակի comma → single
    .replace(/^,|,$/g, "");  // trim commas
  return splitCSV(flat, ",");
}

/** childrenCSV + flat ages -> canonical agesCSV ("5|9,11") */
export function buildAgesByRooms(childrenCSV = "", flatAgeTokens = [], defaultAge = 8) {
  const perRoomCounts = parseChildrenCountsCSV(childrenCSV);
  const need = perRoomCounts.reduce((s, n) => s + n, 0);

  // sanitize tokens
  const clean = flatAgeTokens
    .map(n => {
      const v = clampInt(n, 0, 17, null);
      return v === null ? null : String(v);
    })
    .filter(v => v !== null);

  // լրացնել/կտրել անհրաժեշտ քանակին
  while (clean.length < need) clean.push(String(defaultAge));
  if (clean.length > need) clean.length = need;

  // բաժանել ըստ սենյակների
  let i = 0;
  const rooms = perRoomCounts.map(cnt => {
    const chunk = clean.slice(i, i + cnt);
    i += cnt;
    return chunk.join(AGES_SEP);
  });

  return rooms.join(ROOMS_SEP);
}

/* ---------------- normalizers ---------------- */
export function normalizeChildrenCSV(children) {
  // ընդունում է number | string | array -> վերադարձնում է "1,2"
  if (Array.isArray(children)) return children.join(",");
  if (typeof children === "number") return String(children || 0); // legacy single-room
  return String(children || "").trim();
}

export function normalizeAgesCSV(ages) {
  // ընդունում է string | array | array-of-arrays
  // եթե array-of-arrays է՝ [[5],[9,11]] -> "5|9,11"
  // եթե single-room array է՝ [5,9]     -> "5,9"
  if (Array.isArray(ages)) {
    if (ages.length && Array.isArray(ages[0])) {
      return ages
        .map(arr => arr.map(a => clampInt(a, 0, 17, 8)).join(AGES_SEP))
        .join(ROOMS_SEP);
    }
    return ages.map(a => clampInt(a, 0, 17, 8)).join(AGES_SEP);
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
  const agesCsvIn   = normalizeAgesCSV(childrenAges);

  let agesCsv = computeAgesCSV(childrenCsv, agesCsvIn);
  if (!shapeMatches(childrenCsv, agesCsv)) {
    // final safety
    agesCsv = computeAgesCSV(childrenCsv, agesCsvIn);
  }

  if (typeof window !== "undefined") {
    console.log("[childrenCsv] IN ->", { children, childrenAges });
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