// import { create } from "zustand";

// export const useSelectionStore = create((set, get) => ({
//   items: [],

//   has: (key) => {
//     if (!key) return false;
//     return get().items.some((i) => i.key === key);
//   },

//   addItem: (item) =>
//     set((state) => {
//       if (!item?.key) return state;
//       if (state.items.some((i) => i.key === item.key)) return state;
//       return { items: [...state.items, { ...item, qty: item.qty ?? 1 }] };
//     }),

//   removeItem: (key) =>
//     set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

//   toggleItem: (item) => {
//     const k = item?.key;
//     if (!k) return;
//     const has = get().has(k);
//     if (has) get().removeItem(k);
//     else get().addItem(item);
//   },

//   setQty: (key, qty) =>
//     set((state) => ({
//       items: state.items.map((i) =>
//         i.key === key
//           ? { ...i, qty: Math.max(1, Number.isFinite(+qty) ? +qty : 1) }
//           : i
//       ),
//     })),

//   reset: () => set({ items: [] }),
// }));

// src/stores/selectionStore.js
import { create } from "zustand";

export const useSelectionStore = create((set, get) => ({
  items: [],

  has: (key) => {
    if (!key) return false;
    return get().items.some((i) => i.key === key);
  },

  addItem: (item) =>
    set((state) => {
      if (!item?.key) return state;
      if (state.items.some((i) => i.key === item.key)) return state;
      return { items: [...state.items, { ...item, qty: item.qty ?? 1 }] };
    }),

  removeItem: (key) =>
    set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

  toggleItem: (item) => {
    const k = item?.key;
    if (!k) return;
    const has = get().has(k);
    if (has) get().removeItem(k);
    else get().addItem(item);
  },

  setQty: (key, qty) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.key === key
          ? { ...i, qty: Math.max(1, Number.isFinite(+qty) ? +qty : 1) }
          : i
      ),
    })),

  // ---- helpers for UI ----
  getKeys: () => new Set(get().items.map((i) => i.key)),
  isLocked: () => get().items.length > 0,

  clearAll: () => set({ items: [] }),

  // useful if երբևէ ուզես single-select "replace" տրամաբանություն
  replaceWith: (item) =>
    set(() => (item?.key ? { items: [{ ...item, qty: item.qty ?? 1 }] } : { items: [] })),

  reset: () => set({ items: [] }),
}));