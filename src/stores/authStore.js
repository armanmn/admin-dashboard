import { create } from "zustand";
import api from "../utils/api"; // ✅ Backend API-ի համար

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  checkAuth: async () => {
    try {
      const response = await api.get("/auth/check");
      set({ user: response.user, isAuthenticated: true });
    } catch (error) {
      if (error.message.includes("401")) {
        console.warn("User is not authenticated.");
      } else {
        console.error("Auth check failed:", error);
      }
      set({ user: null, isAuthenticated: false });
    }
  },
  

  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
  
      if (response.user) {
        set({ user: response.user, isAuthenticated: true });
  
        // ✅ Պահպանում ենք authToken-ը cookie-ների մեջ
        document.cookie = `authToken=${response.token}; path=/; secure; samesite=strict`;
  
        return true;
      } else {
        throw new Error("User data not found in response");
      }
    } catch (error) {
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
      set({ user: null, isAuthenticated: false });
  
      // ✅ Ջնջում ենք authToken-ը cookie-ներից
      document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; secure; samesite=strict";
    } catch (error) {}
  },

  registerB2B: async (firstName, lastName, email, password, role) => {
    try {
      const response = await api.post("/auth/register-b2b", { firstName, lastName, email, password, role });
  
      if (response && response.message && response.message.toLowerCase().includes("registered successfully")) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("B2B Registration Error:", error);
      return false;
    }
  },  
  
  registerOfficeUser: async (firstName, lastName, email, password, role) => {
    try {
      const response = await api.post("/users/admin/create-user", { firstName, lastName, email, password, role });
      if (response && response.message === "User created successfully") {
        return true; // ✅ Հաջող գրանցման դեպքում վերադարձնում ենք true
      }
      return false; // ❌ Եթե ինչ-որ բան սխալ է, վերադարձնում ենք false
    } catch (error) {
      console.error("Office User Registration Error:", error);
      return false; // ❌ Error-ի դեպքում վերադարձնում ենք false
    }
  },
  
  
}));