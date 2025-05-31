// src/stores/searchCriteriaStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { differenceInDays } from "date-fns";

export const useSearchCriteriaStore = create(
  persist(
    (set) => ({
      // 🧭 Հիմնական փնտրման պարամետրեր
      city: "",
      checkInDate: null,
      checkOutDate: null,
      adults: 2,
      children: 0,
      rooms: 1,
      nights: 1,

      // 🧰 Ֆիլտրերի բաժին
      filters: {
        priceRange: [0, 100000],
        roomTypes: [], // օրինակ՝ ["suite", "standard"]
        amenities: [], // օրինակ՝ ["wifi", "breakfast", "parking"]
      },

      // ✅ Փնտրման պարամետրերի setter
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

      // ✅ Ֆիլտրերի setter
      setFilters: (filters) => {
        console.log("🎯 setFilters:", filters);
        set({ filters });
      },

      // ✅ Մաքրել բոլոր պարամետրերը
      clearCriteria: () => {
        set({
          city: "",
          checkInDate: null,
          checkOutDate: null,
          adults: 2,
          children: 0,
          rooms: 1,
          nights: 1,
          filters: {
            priceRange: [0, 100000],
            roomTypes: [],
            amenities: [],
          },
        });
      },
    }),
    {
      name: "search-criteria", // localStorage key
    }
  )
);