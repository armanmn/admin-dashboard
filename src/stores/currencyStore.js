// // stores/currencyStore.js
// import { create } from "zustand";
// import api from "@/utils/api";

// export const useCurrencyStore = create((set) => ({
//   currency: null, // սկզբում ոչինչ (backend-ից կգա)
//   setCurrency: (currency) => set({ currency }),
//   initCurrency: async () => {
//     try {
//       const settings = await api.get("/public-settings");
//       set({ currency: settings?.defaultCurrency || "AMD" });
//     } catch (e) {
//       console.error("❌ Failed to load default currency:", e);
//       set({ currency: "AMD" }); // fallback
//     }
//   },
// }));

// stores/currencyStore.js
import { create } from "zustand";
import api from "@/utils/api";

const LS_KEY = "preferredCurrency";

export const useCurrencyStore = create((set, get) => ({
  currency: null,                 // current UI currency
  availableCurrencies: [],        // ['AMD','USD','EUR','GBP','RUB', ...]
  setCurrency: (currency) => {
    const cur = String(currency || "").toUpperCase();
    try { localStorage.setItem(LS_KEY, cur); } catch {}
    set({ currency: cur });
  },

  initCurrency: async () => {
    // 1) preferred from localStorage (if any)
    let preferred = null;
    try {
      const v = localStorage.getItem(LS_KEY);
      if (v) preferred = String(v).toUpperCase();
    } catch {}

    // 2) fetch public-settings for defaultCurrency + exchangeRates
    try {
      const settings = await api.get("/public-settings"); // your api wrapper returns parsed JSON
      const defaultCurrency = settings?.defaultCurrency || "AMD";
      const rates = settings?.exchangeRates || {};
      const serverList = Object.keys(rates || {}).filter(Boolean);

      // ensure GBP is there if backend already exposes it
      const unique = Array.from(new Set(serverList));
      set({ availableCurrencies: unique });

      // decide initial currency:
      const pick = preferred || defaultCurrency || "AMD";
      set({ currency: String(pick).toUpperCase() });
    } catch (e) {
      console.error("❌ Failed to load default currency:", e);
      // fallback
      const pick = preferred || "AMD";
      set({ currency: pick, availableCurrencies: ["AMD","USD","EUR","GBP","RUB"] });
    }
  },
}));