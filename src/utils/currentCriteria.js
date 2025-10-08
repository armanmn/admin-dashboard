// Օգտագործում ցանկացած client էջում
// import { getCurrentCriteria } from "@/utils/currentCriteria";

// const crit = getCurrentCriteria();
// // crit կարող է լինել null, կամ
// // { city, cityCode, checkInDate, checkOutDate, arrivalDate, nights, rooms, adults, children, childrenAges }


// src/utils/currentCriteria.js
export function readCriteriaFromUrl() {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search);

  const city       = q.get("city") || "";
  const cityCode   = q.get("cityCode") || null;
  const checkIn    = q.get("checkInDate") || "";
  const checkOut   = q.get("checkOutDate") || "";
  const rooms      = q.get("rooms") || "";
  const adults     = q.get("adults") || "";         // CSV (e.g. "2" or "2,1")
  const children   = q.get("children") || "";       // CSV
  const kidsAges   = q.get("childrenAges") || "";   // "6|4,7"

  const arrivalDate = checkIn || "";
  const MS = 24 * 60 * 60 * 1000;
  const nights = (checkIn && checkOut)
    ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / MS))
    : (q.get("nights") ? Number(q.get("nights")) : "");

  const hasAny =
    city || cityCode || checkIn || checkOut || rooms || adults || children || kidsAges;

  if (!hasAny) return null;

  return {
    city, cityCode,
    checkInDate: checkIn || "",
    checkOutDate: checkOut || "",
    arrivalDate,
    nights,
    rooms: rooms ? Number(rooms) : "",
    adults,          // CSV as-is
    children,        // CSV as-is
    childrenAges: kidsAges, // as-is
  };
}

export function readCriteriaFromSnapshot() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("lastHotelSnapshot");
    if (!raw) return null;
    const snap = JSON.parse(raw);

    const c = snap?.criteria || {};
    if (!c?.arrivalDate) return null;

    return {
      city: "",
      cityCode: c.cityId || null,
      checkInDate: c.arrivalDate || "",
      checkOutDate: "", // nights is provided below
      arrivalDate: c.arrivalDate || "",
      nights: Number(c.nights) || "",
      rooms: Number(c.rooms) || "",
      adults: String(c.adultsCSV ?? ""),
      children: String(c.childrenCSV ?? ""),
      childrenAges: String(c.childrenAgesCSV ?? ""),
    };
  } catch {
    return null;
  }
}

export function readCriteriaFromStore() {
  // optional, only in client
  try {
    // late-require to avoid SSR pitfalls
    const { useSearchCriteriaStore } = require("@/stores/searchCriteriaStore");
    const s = useSearchCriteriaStore.getState?.();
    if (!s) return null;

    const checkIn  = s.checkInDate || "";
    const checkOut = s.checkOutDate || "";
    const arrivalDate = checkIn || "";

    return {
      city: s.city || "",
      cityCode: s.cityCode || null,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      arrivalDate,
      nights: s.nights || "",
      rooms: s.rooms || "",
      adults: String(s.adults ?? ""),
      children: String(s.children ?? ""),
      childrenAges: Array.isArray(s.childrenAges)
        ? s.childrenAges.join(",")
        : String(s.childrenAges ?? ""),
    };
  } catch {
    return null;
  }
}

/** Main getter: URL → snapshot → store */
export function getCurrentCriteria() {
  return (
    readCriteriaFromUrl() ||
    readCriteriaFromSnapshot() ||
    readCriteriaFromStore() ||
    null
  );
}