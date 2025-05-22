// src/stores/searchCriteriaStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { differenceInDays } from "date-fns";

export const useSearchCriteriaStore = create(
  persist(
    (set) => ({
      city: "",
      checkInDate: null,
      checkOutDate: null,
      adults: 2,
      children: 0,
      rooms: 1,
      nights: 1,

      setCriteria: ({ city, checkInDate, checkOutDate, adults, children, rooms }) => {
        const nights =
          checkInDate && checkOutDate
            ? differenceInDays(new Date(checkOutDate), new Date(checkInDate))
            : 1;

        console.log("✅ setCriteria store update:", {
          city,
          checkInDate,
          checkOutDate,
          adults,
          children,
          rooms,
          nights,
        });

        set({ city, checkInDate, checkOutDate, adults, children, rooms, nights });
      },

      clearCriteria: () => {
        set({
          city: "",
          checkInDate: null,
          checkOutDate: null,
          adults: 2,
          children: 0,
          rooms: 1,
          nights: 1,
        });
      },
    }),
    {
      name: "search-criteria", // localStorage key
    }
  )
);