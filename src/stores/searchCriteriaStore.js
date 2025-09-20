// src/stores/searchCriteriaStore.js
import { create } from "zustand";

// helpers
function clampAge(v, def = 5) {
  const n = Number(v);
  if (!Number.isFinite(n)) return def;
  return Math.max(0, Math.min(17, Math.round(n)));
}
function normalizeAges(count, arr) {
  const c = Math.max(0, Number(count) || 0);
  const src = Array.isArray(arr) ? arr : [];
  const out = new Array(c);
  for (let i = 0; i < c; i++) out[i] = clampAge(src[i]);
  return out;
}

export const useSearchCriteriaStore = create((set, get) => ({
  // Core
  city: "",
  cityCode: "",
  checkInDate: null,
  checkOutDate: null,
  nights: 1,

  // Occupancy
  adults: 2,
  children: 0,
  childrenAges: [],   // 0–17
  rooms: 1,

  // search trigger (որ ResultsView-ը վստահաբար re-fetch անի)
  nonce: 0,
  bumpNonce: () => set({ nonce: get().nonce + 1 }),

  // Generic setter (auto-fix nights when both dates exist)
  setCriteria: (partial) =>
    set((s) => {
      const next = { ...s, ...partial };

      // keep ages consistent with children count
      if (partial && Object.prototype.hasOwnProperty.call(partial, "children")) {
        next.children = Math.max(0, Number(partial.children) || 0);
        next.childrenAges = normalizeAges(next.children, next.childrenAges);
      }
      if (partial && Object.prototype.hasOwnProperty.call(partial, "childrenAges")) {
        next.childrenAges = normalizeAges(next.children, partial.childrenAges);
      }

      try {
        const a = next.checkInDate ? new Date(next.checkInDate) : null;
        const b = next.checkOutDate ? new Date(next.checkOutDate) : null;
        if (a && b && !isNaN(+a) && !isNaN(+b)) {
          const ms = b - a;
          next.nights = Math.max(1, Math.round(ms / 86400000));
        }
      } catch {}
      return next;
    }),

  // Occupancy helpers
  setAdults: (n) => set({ adults: Math.max(1, Number(n) || 1) }),
  setRooms: (n) => set({ rooms: Math.max(1, Number(n) || 1) }),

  setChildrenCount: (count) =>
    set((s) => {
      const children = Math.max(0, Number(count) || 0);
      return {
        children,
        childrenAges: normalizeAges(children, s.childrenAges),
      };
    }),

  setChildAge: (index, age) =>
    set((s) => {
      const idx = Number(index) || 0;
      const arr = s.childrenAges.slice();
      if (idx >= 0 && idx < Math.max(0, s.children)) {
        arr[idx] = clampAge(age);
      }
      return { childrenAges: arr };
    }),

  setChildrenAges: (ages) =>
    set((s) => ({
      childrenAges: normalizeAges(s.children, ages),
    })),
}));