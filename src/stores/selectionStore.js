"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

const INITIAL_STATE = {
  // selection cart items
  // { key, offerProof, searchCode, roomName, board, refundable, platformCutoffUtc, price:{amount,currency}, qty }
  items: [],
};

export const useSelectionStore = create(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      // --- mutations ---
      setQty: (key, qty) => {
        const items = get().items.slice();
        const i = items.findIndex((x) => x.key === key);

        if (qty <= 0) {
          if (i >= 0) items.splice(i, 1);
          return set({ items });
        }

        if (i >= 0) {
          items[i] = { ...items[i], qty };
          return set({ items });
        }

        // first time must come via upsertItem with full payload
        return;
      },

      upsertItem: (payload) => {
        const items = get().items.slice();
        const i = items.findIndex((x) => x.key === payload.key);

        if ((payload.qty ?? 0) <= 0) {
          if (i >= 0) items.splice(i, 1);
          return set({ items });
        }

        if (i >= 0) items[i] = { ...items[i], ...payload };
        else items.push(payload);

        set({ items });
      },

      remove: (key) => set({ items: get().items.filter((x) => x.key !== key) }),

      clear: () => set({ items: [] }),

      // ✅ brand-new: hard reset to INITIAL_STATE (աղբահանություն նաև հին դաշտերից)
      reset: () => set({ ...INITIAL_STATE }, true), // second arg = replace, so stale keys are dropped

      // --- derived helpers ---
      hasNonRefundable: () => get().items.some((x) => x.refundable === false),

      earliestPlatformCutoff: () => {
        const ts = get()
          .items.map((x) =>
            x.platformCutoffUtc ? +new Date(x.platformCutoffUtc) : null
          )
          .filter(Boolean);
        if (!ts.length) return null;
        return new Date(Math.min(...ts)).toISOString();
      },
    }),
    {
      name: "bookingSelection",
      version: 2,
      partialize: (s) => ({ items: s.items }), // միայն items պահի
      migrate: (persisted, ver) => {
        if (!persisted) return { items: [] };
        if (ver < 2) return { items: persisted.items || [] };
        return { items: persisted.items || [] };
      },
    }
  )
);
