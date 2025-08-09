// stores/currencyStore.js
import { create } from "zustand";
import api from "@/utils/api";

export const useCurrencyStore = create((set) => ({
  currency: null, // սկզբում ոչինչ (backend-ից կգա)
  setCurrency: (currency) => set({ currency }),
  initCurrency: async () => {
    try {
      const settings = await api.get("/public-settings");
      set({ currency: settings?.defaultCurrency || "AMD" });
    } catch (e) {
      console.error("❌ Failed to load default currency:", e);
      set({ currency: "AMD" }); // fallback
    }
  },
}));