// // src/stores/searchCriteriaStore.js
// import { create } from "zustand";

// /** NOTE
//  * Store now supports BOTH:
//  *  - Legacy aggregate fields (numbers/arrays): adults, children, childrenAges[]
//  *  - Canonical per-room CSV fields (strings):  adultsCSV, childrenCSV, childrenAgesCSV
//  *
//  * setCriteria is careful:
//  *  - If you pass strings (CSV) -> they go to *CSV* fields and do NOT mutate legacy fields.
//  *  - If you pass numbers/arrays (aggregate) -> they update legacy fields only (no padding with defaults).
//  *  - Nights recomputed only from dates.
//  *
//  * Default child age is NOT used to "pad" in the store anymore.
//  * Padding (default=8) should happen ONLY right before supplier API (ensureAgesForApi).
//  */

// // ---------- helpers ----------
// const clampInt = (v, lo = 0, hi = 17) => {
//   const n = Number(v);
//   if (!Number.isFinite(n)) return null;
//   return Math.max(lo, Math.min(hi, Math.round(n)));
// };

// const asCsv = (v) => String(v ?? "").trim();
// const splitCsv = (s, sep = ",") =>
//   String(s ?? "")
//     .split(sep)
//     .map((t) => t.trim())
//     .filter((t) => t.length > 0);

// // ---------- store ----------
// export const useSearchCriteriaStore = create((set, get) => ({
//   // Core destination/dates
//   city: "",
//   cityCode: "",
//   checkInDate: null,   // "YYYY-MM-DD"
//   checkOutDate: null,  // "YYYY-MM-DD"
//   nights: 1,

//   // Canonical per-room CSV (authoritative for our new flow)
//   adultsCSV: "2",           // e.g. "2,2"
//   childrenCSV: "0",         // e.g. "1,0"
//   childrenAgesCSV: "",      // e.g. "9|10,12"
//   rooms: 1,

//   // Legacy aggregate (kept for old widgets; not auto-derived from CSV)
//   adults: 2,
//   children: 0,
//   childrenAges: [],         // number[] (0–17), no auto-padding here

//   // Results refetch trigger
//   nonce: 0,
//   bumpNonce: () => set({ nonce: get().nonce + 1 }),

//   /** Smart, non-invasive setter.
//    *  - CSV strings update only CSV fields (and do not touch legacy).
//    *  - Numeric/array values update only legacy fields (and do not touch CSV).
//    *  - No default-age padding happens here.
//    */
//   setCriteria: (partial = {}) =>
//     set((s) => {
//       const next = { ...s };

//       // ---- destination / dates ----
//       if ("city" in partial) next.city = String(partial.city || "");
//       if ("cityCode" in partial) next.cityCode = partial.cityCode || "";

//       if ("checkInDate" in partial) next.checkInDate = partial.checkInDate || null;
//       if ("checkOutDate" in partial) next.checkOutDate = partial.checkOutDate || null;

//       // recompute nights if both dates exist
//       try {
//         const a = next.checkInDate ? new Date(next.checkInDate) : null;
//         const b = next.checkOutDate ? new Date(next.checkOutDate) : null;
//         if (a && b && !isNaN(+a) && !isNaN(+b)) {
//           const ms = b - a;
//           next.nights = Math.max(1, Math.round(ms / 86400000));
//         }
//       } catch {}

//       if ("nights" in partial && Number.isFinite(Number(partial.nights))) {
//         next.nights = Math.max(1, Number(partial.nights));
//       }

//       if ("rooms" in partial) {
//         const R = Math.max(1, Number(partial.rooms) || 1);
//         next.rooms = R;
//       }

//       // ---- CSV branch (authoritative for new flow) ----
//       if ("adultsCSV" in partial) next.adultsCSV = asCsv(partial.adultsCSV);
//       // If caller passed `adults` but it's a CSV string (contains comma or is a string),
//       // treat it as CSV to avoid corrupting aggregate.
//       if ("adults" in partial && typeof partial.adults === "string") {
//         next.adultsCSV = asCsv(partial.adults);
//       }

//       if ("childrenCSV" in partial) next.childrenCSV = asCsv(partial.childrenCSV);
//       if ("children" in partial && typeof partial.children === "string") {
//         next.childrenCSV = asCsv(partial.children);
//       }

//       if ("childrenAgesCSV" in partial) {
//         next.childrenAgesCSV = asCsv(partial.childrenAgesCSV);
//       }
//       if ("childrenAges" in partial && typeof partial.childrenAges === "string") {
//         // String provided -> this is CSV by convention; keep it as-is.
//         next.childrenAgesCSV = asCsv(partial.childrenAges);
//       }

//       // ---- Legacy branch (used only if *numeric/array* values are provided) ----
//       if ("adults" in partial && typeof partial.adults !== "string") {
//         const n = Math.max(1, Number(partial.adults) || 1);
//         next.adults = n;
//       }

//       if ("children" in partial && typeof partial.children !== "string") {
//         const c = Math.max(0, Number(partial.children) || 0);
//         next.children = c;
//         // do NOT pad with defaults; preserve existing indices only
//         const arr = Array.isArray(next.childrenAges) ? next.childrenAges.slice(0, c) : [];
//         next.childrenAges = arr;
//       }

//       if (
//         "childrenAges" in partial &&
//         Array.isArray(partial.childrenAges) &&
//         typeof partial.childrenAges !== "string"
//       ) {
//         // clamp each provided value; no padding
//         const src = partial.childrenAges;
//         const out = [];
//         for (let i = 0; i < src.length; i++) {
//           const v = clampInt(src[i], 0, 17);
//           if (v !== null) out.push(v);
//         }
//         next.childrenAges = out;
//       }

//       return next;
//     }),

//   // ---- Legacy helpers (kept for back-compat; NO default padding) ----
//   setAdults: (n) =>
//     set((s) => ({ adults: Math.max(1, Number(n) || s.adults || 1) })),

//   setRooms: (n) =>
//     set((s) => ({ rooms: Math.max(1, Number(n) || s.rooms || 1) })),

//   setChildrenCount: (count) =>
//     set((s) => {
//       const c = Math.max(0, Number(count) || 0);
//       return { children: c, childrenAges: (s.childrenAges || []).slice(0, c) };
//     }),

//   setChildAge: (index, age) =>
//     set((s) => {
//       const idx = Math.max(0, Number(index) || 0);
//       const arr = Array.isArray(s.childrenAges) ? s.childrenAges.slice() : [];
//       if (idx < arr.length) {
//         const v = clampInt(age, 0, 17);
//         if (v !== null) arr[idx] = v;
//       }
//       return { childrenAges: arr };
//     }),

//   setChildrenAges: (ages) =>
//     set(() => {
//       if (!Array.isArray(ages)) return {};
//       const out = [];
//       for (let i = 0; i < ages.length; i++) {
//         const v = clampInt(ages[i], 0, 17);
//         if (v !== null) out.push(v);
//       }
//       return { childrenAges: out };
//     }),
// }));

// src/stores/searchCriteriaStore.js
import { create } from "zustand";

const DEFAULT_CHILD_AGE = 8;

// helpers
const isCsv = (v) => typeof v === "string" && /[,|]/.test(v);
const clampAge = (v, def = DEFAULT_CHILD_AGE) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(0, Math.min(17, Math.round(n)));
};

function normalizeAges(count, arr) {
  const c = Math.max(0, Number(count) || 0);
  const src = Array.isArray(arr) ? arr : [];
  const out = new Array(c);
  for (let i = 0; i < c; i++) out[i] = clampAge(src[i], DEFAULT_CHILD_AGE);
  return out;
}

// small util to sum CSV counts ("1,0,2" => 3)
const sumCsvCounts = (csv) =>
  String(csv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .reduce((a, b) => a + (Number(b) || 0), 0);

export const useSearchCriteriaStore = create((set, get) => ({
  // Core
  city: "",
  cityCode: "",
  checkInDate: null,
  checkOutDate: null,
  nights: 1,

  // Legacy aggregate model
  adults: 2,
  children: 0,
  childrenAges: [], // array (legacy)
  rooms: 1,

  // NEW: canonical CSV mirrors (քո FE-ի համար՝ առանց normalize)
  adultsCSV: "2",        // e.g. "2,2"
  childrenCSV: "0",      // e.g. "1,0"
  childrenAgesCSV: "",   // e.g. "5|9,11"

  // search trigger
  nonce: 0,
  bumpNonce: () => set({ nonce: get().nonce + 1 }),

  setCriteria: (partial) =>
    set((s) => {
      const next = { ...s, ...partial };

      // --- ADULTS ---
      if (typeof partial.adults === "string" && isCsv(partial.adults)) {
        // CSV adults
        next.adultsCSV = partial.adults;
      } else if (Object.prototype.hasOwnProperty.call(partial, "adults")) {
        // numeric single-room / legacy
        const n = Math.max(1, Number(partial.adults) || 1);
        next.adults = n;
        next.adultsCSV = String(n);
      }

      // --- CHILDREN ---
      if (typeof partial.children === "string" && isCsv(partial.children)) {
        // CSV children (DON'T normalize ages array here)
        next.childrenCSV = partial.children;
        next.children = sumCsvCounts(partial.children); // keep legacy total in sync
      } else if (Object.prototype.hasOwnProperty.call(partial, "children")) {
        // numeric legacy path
        const n = Math.max(0, Number(partial.children) || 0);
        next.children = n;
        next.childrenAges = normalizeAges(n, next.childrenAges);
        // mirror to CSV for consistency (single-room semantics)
        next.childrenCSV = String(n);
      }

      // --- CHILDREN AGES ---
      if (typeof partial.childrenAges === "string") {
        // by-rooms CSV like "5|9,11" (KEEP AS-IS)
        next.childrenAgesCSV = partial.childrenAges.trim();
      } else if (
        Object.prototype.hasOwnProperty.call(partial, "childrenAges")
      ) {
        // legacy array path
        next.childrenAges = normalizeAges(next.children, partial.childrenAges);
      }

      // --- ROOMS ---
      if (Object.prototype.hasOwnProperty.call(partial, "rooms")) {
        next.rooms = Math.max(1, Number(partial.rooms) || 1);
      }

      // Recompute nights if both dates exist
      try {
        const a = next.checkInDate ? new Date(next.checkInDate) : null;
        const b = next.checkOutDate ? new Date(next.checkOutDate) : null;
        if (a && b && !isNaN(+a) && !isNaN(+b)) {
          next.nights = Math.max(1, Math.round((b - a) / 86400000));
        }
      } catch {}

      return next;
    }),

  // Optional explicit setter for CSV guests (եթե ուզես՝ օգտագործիր)
  setCsvGuests: ({ rooms, adultsCSV, childrenCSV, childrenAgesCSV }) =>
    set((s) => ({
      rooms: Math.max(1, Number(rooms) || 1),
      adultsCSV: String(adultsCSV ?? s.adultsCSV),
      childrenCSV: String(childrenCSV ?? s.childrenCSV),
      childrenAgesCSV: String(childrenAgesCSV ?? s.childrenAgesCSV),
      // keep legacy totals loosely in sync (optional)
      adults: String(adultsCSV ?? s.adultsCSV)
        .split(",")
        .reduce((sum, x) => sum + (Number(x) || 0), 0),
      children: sumCsvCounts(childrenCSV ?? s.childrenCSV),
    })),

  // Legacy helpers (թողնում եմ, բայց հիմա CSV-ները չեն խանգարի)
  setAdults: (n) =>
    set({
      adults: Math.max(1, Number(n) || 1),
      adultsCSV: String(Math.max(1, Number(n) || 1)),
    }),
  setRooms: (n) => set({ rooms: Math.max(1, Number(n) || 1) }),

  setChildrenCount: (count) =>
    set((s) => {
      const children = Math.max(0, Number(count) || 0);
      return {
        children,
        childrenAges: normalizeAges(children, s.childrenAges),
        childrenCSV: String(children),
      };
    }),

  setChildAge: (index, age) =>
    set((s) => {
      const idx = Number(index) || 0;
      const arr = s.childrenAges.slice();
      if (idx >= 0 && idx < Math.max(0, s.children)) {
        arr[idx] = clampAge(age, DEFAULT_CHILD_AGE);
      }
      return { childrenAges: arr };
    }),

  setChildrenAges: (ages) =>
    set((s) => ({
      childrenAges: normalizeAges(s.children, ages),
    })),
}));