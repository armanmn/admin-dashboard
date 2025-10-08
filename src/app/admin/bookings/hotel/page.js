// src/app/admin/hotel/page.js
"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import HotelSearchBar from "@/components/admin/HotelSearchBar";
import HotelFiltersSidebar from "@/components/admin/HotelFiltersSidebar";
import SupplierResultsView from "@/components/admin/SupplierResultsView";
import AISmartSearch from "@/components/AI/AISmartSearch";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
import styles from "@/styles/hotelBookingPage.module.css";
import api from "@/utils/api";
import {
  detectRoomsFromSignals,
  normalizeAdultsCSV,
  normalizeChildrenCSV,
} from "@/utils/childrenCsv";

const ENABLE_SEARCH_SESSIONS = false;

/* ---------------- date helpers ---------------- */
const computeNights = (ci, co) => {
  if (!ci || !co) return 1;
  const a = new Date(ci);
  const b = new Date(co);
  const MS = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((b - a) / MS));
};
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
};

/* ---------------- ONE TRUE NORMALIZER (AI / HSB / URL → unified) ---------------- */
function normalizeIncoming(data, prev) {
  const p = prev || {};

  // destination
  const rawLocation =
    data.location ?? data.city ?? data.destination ?? p.city ?? "";
  const rawCityCode = data.cityCode ?? data.cityId ?? p.cityCode ?? null;

  // dates: compute ci/co → nights
  const ciCandidate =
    data.checkInDate ??
    data.arrivalDate ??
    p.checkInDate ??
    p.arrivalDate ??
    "";
  let coCandidate = data.checkOutDate ?? p.checkOutDate ?? "";

  let nights = Number.isFinite(Number(data.nights))
    ? Number(data.nights)
    : null;
  if (ciCandidate && coCandidate && nights == null) {
    nights = computeNights(ciCandidate, coCandidate);
  }
  if (ciCandidate && !coCandidate) {
    const n = nights != null ? nights : 1;
    coCandidate = addDays(ciCandidate, n);
  }
  if (nights == null) {
    nights = computeNights(ciCandidate, coCandidate);
  }
  const ci = ciCandidate || "";
  const co = coCandidate || "";

  // guests (CSV-first)
  const adultsCSV =
    (typeof data.adults === "string" && data.adults) ??
    data.adultsCSV ??
    (typeof p.adults === "string" && p.adults) ??
    p.adultsCSV ??
    "2";

  const childrenCSV =
    (typeof data.children === "string" && data.children) ??
    data.childrenCSV ??
    (typeof p.children === "string" && p.children) ??
    p.childrenCSV ??
    "0";

  const childrenAgesCSV_IN =
    (typeof data.childrenAges === "string" && data.childrenAges) ??
    (typeof data.childrenAgesCSV === "string" && data.childrenAgesCSV) ??
    (typeof p.childrenAges === "string" && p.childrenAges) ??
    (typeof p.childrenAgesCSV === "string" && p.childrenAgesCSV) ??
    "";

  // rooms detection (no invented ages here)
  const R = detectRoomsFromSignals(
    adultsCSV,
    childrenCSV,
    childrenAgesCSV_IN,
    data.rooms ?? p.rooms
  );
  const aCSV = normalizeAdultsCSV(adultsCSV, R);
  const cCSV = normalizeChildrenCSV(childrenCSV);
  const gCSV = (childrenAgesCSV_IN ?? "").trim(); // keep exact

  return {
    city: rawLocation || "",
    cityCode: rawCityCode || null,
    checkInDate: ci,
    checkOutDate: co,
    rooms: R,
    adults: aCSV, // CSV
    children: cCSV, // CSV
    childrenAges: gCSV, // CSV by rooms
    arrivalDate: ci,
    nights,
    // mirrors (for clarity elsewhere)
    adultsCSV: aCSV,
    childrenCSV: cCSV,
    childrenAgesCSV: gCSV,
  };
}

export default function HotelBookingPage() {
  const [searchParams, setSearchParams] = useState({});
  const [uiFilters, setUiFilters] = useState({});

  // --- responsive ---
  const [vw, setVw] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1920
  );
  useEffect(() => {
    const onR = () => setVw(window.innerWidth);
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  const isNarrow = vw <= 1440;
  const showStaticSidebar = !isNarrow;

  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => {
    if (showStaticSidebar && filtersOpen) setFiltersOpen(false);
  }, [showStaticSidebar, filtersOpen]);

  // --- store wiring ---
  const {
    city,
    cityCode,
    checkInDate,
    checkOutDate,
    rooms,
    // 👇 նոր՝ CSV դաշտեր, որ չընկնենք aggregate-ի վրա
    adultsCSV: sAdultsCSV,
    childrenCSV: sChildrenCSV,
    childrenAgesCSV: sAgesCSV,
    setCriteria,
    bumpNonce,
  } = useSearchCriteriaStore();

  // CSV normalize for HSB initialValues (display only)
  const normAdultsCSV = typeof sAdultsCSV === "string" ? sAdultsCSV : "2";
  const normChildrenCSV = typeof sChildrenCSV === "string" ? sChildrenCSV : "0";
  const normChildrenAgesCSV = typeof sAgesCSV === "string" ? sAgesCSV : "";

  const searchCriteria = {
    location: city || "",
    cityCode: cityCode || null,
    checkInDate,
    checkOutDate,
    rooms,
    adultsCSV: normAdultsCSV,
    childrenCSV: normChildrenCSV,
    childrenAgesCSV: normChildrenAgesCSV,
  };

  /* ------------ hydrate from URL or session snapshot ------------ */
  const didHydrateRef = useRef(false);

  useEffect(() => {
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;

    try {
      const q = new URLSearchParams(window.location.search);
      const fromUrlRaw = {
        city: q.get("city") || "",
        cityCode: q.get("cityCode") || null,
        checkInDate: q.get("checkInDate") || "",
        checkOutDate: q.get("checkOutDate") || "",
        rooms: q.get("rooms") ? Number(q.get("rooms")) : undefined,
        adults: q.get("adults") || undefined, // CSV
        children: q.get("children") || undefined, // CSV
        childrenAges: q.get("childrenAges") || undefined, // "5|9,11"
      };

      const hasParams =
        !!fromUrlRaw.checkInDate ||
        !!fromUrlRaw.checkOutDate ||
        !!fromUrlRaw.city ||
        !!fromUrlRaw.cityCode ||
        !!fromUrlRaw.childrenAges ||
        (fromUrlRaw.adults && fromUrlRaw.adults !== "2") ||
        (fromUrlRaw.children && fromUrlRaw.children !== "0") ||
        typeof fromUrlRaw.rooms === "number";

      if (hasParams) {
        const normalized = normalizeIncoming(fromUrlRaw, {});
        console.debug("[HBP] hydrate from URL →", normalized);

        // feed store (full picture)
        setCriteria({
          city: normalized.city,
          cityCode: normalized.cityCode,
          checkInDate: normalized.checkInDate,
          checkOutDate: normalized.checkOutDate,
          nights: normalized.nights,
          rooms: normalized.rooms,
          adultsCSV: normalized.adults,
          childrenCSV: normalized.children,
          childrenAgesCSV: normalized.childrenAges,
        });

        // feed SRV props (minimal)
        setSearchParams({
          city: normalized.city,
          cityCode: normalized.cityCode,
          cityId: normalized.cityCode,
          arrivalDate: normalized.arrivalDate,
          nights: normalized.nights,
          rooms: normalized.rooms,
          adults: normalized.adults, // CSV
          children: normalized.children, // CSV
          childrenAges: normalized.childrenAges, // CSV by rooms
        });

        // optional: post session (non-blocking)
        if (ENABLE_SEARCH_SESSIONS) {
          api
            .post("/search-sessions/hotel", {
              cityCode: normalized.cityCode,
              arrivalDate: normalized.arrivalDate,
              nights: normalized.nights,
              rooms: normalized.rooms,
              adultsCSV: normalized.adults,
              childrenCSV: normalized.children,
              childrenAgesCSV: normalized.childrenAges,
            })
            .catch((e) =>
              console.warn(
                "[HBP] session post (snapshot) failed",
                e?.message || e
              )
            );
        }
        bumpNonce?.();
        return;
      }

      // Fallback: snapshot (back from details)
      const raw = sessionStorage.getItem("lastHotelSnapshot");
      if (!raw) return;
      const snap = JSON.parse(raw);
      const isValidSnap =
        snap?.marker === "fromListClick" &&
        Number.isFinite(snap?.ts) &&
        Date.now() - snap.ts < 10 * 60 * 1000;
      if (!isValidSnap || !snap?.criteria?.arrivalDate) return;

      const normalized = normalizeIncoming(
        {
          cityCode: snap.criteria.cityId,
          arrivalDate: snap.criteria.arrivalDate,
          nights: snap.criteria.nights,
          rooms: snap.criteria.rooms,
          adults: snap.criteria.adultsCSV,
          children: snap.criteria.childrenCSV,
          childrenAges: snap.criteria.childrenAgesCSV,
        },
        {} // ⛔ prev չօգտագործել
      );
      console.debug("[HBP] hydrate from snapshot →", normalized);

      setCriteria({
        city: normalized.city,
        cityCode: normalized.cityCode,
        checkInDate: normalized.checkInDate,
        checkOutDate: normalized.checkOutDate,
        nights: normalized.nights,
        rooms: normalized.rooms,
        adultsCSV: normalized.adults,
        childrenCSV: normalized.children,
        childrenAgesCSV: normalized.childrenAges,
      });

      setSearchParams({
        city: normalized.city,
        cityCode: normalized.cityCode,
        cityId: normalized.cityCode,
        arrivalDate: normalized.arrivalDate,
        nights: normalized.nights,
        rooms: normalized.rooms,
        adults: normalized.adults,
        children: normalized.children,
        childrenAges: normalized.childrenAges,
      });

      // optional: post session (non-blocking)
      if (ENABLE_SEARCH_SESSIONS) {
        api
          .post("/search-sessions/hotel", {
            cityCode: normalized.cityCode,
            arrivalDate: normalized.arrivalDate,
            nights: normalized.nights,
            rooms: normalized.rooms,
            adultsCSV: normalized.adults,
            childrenCSV: normalized.children,
            childrenAgesCSV: normalized.childrenAges,
          })
          .catch((e) =>
            console.warn(
              "[HBP] session post (snapshot) failed",
              e?.message || e
            )
          );
      }

      bumpNonce?.();
      sessionStorage.removeItem("lastHotelSnapshot");

      // keep URL in sync
      try {
        const qs = new URLSearchParams({
          city: String(normalized.city || ""),
          cityCode: String(normalized.cityCode || ""),
          checkInDate: String(normalized.checkInDate || ""),
          checkOutDate: String(normalized.checkOutDate || ""),
          rooms: String(normalized.rooms || 1),
          adults: String(normalized.adults || "2"),
          children: String(normalized.children || "0"),
          ...(normalized.childrenAges
            ? { childrenAges: String(normalized.childrenAges) }
            : {}),
        }).toString();
        window.history.replaceState(null, "", `/admin/hotel?${qs}`);
      } catch {}
    } catch (e) {
      console.warn("[HBP] hydrate error", e?.message || e);
    }
  }, [setCriteria, bumpNonce]);

  /* ---------------- single handler for BOTH HSB and AI ---------------- */
  const handleSearch = useCallback(
    (data) => {
      const prev = useSearchCriteriaStore.getState();
      const normalized = normalizeIncoming(data || {}, prev);
      console.debug("[HBP] handleSearch →", normalized);

      // 1) store (full picture)
      setCriteria(normalized);

      // 2) params for SRV (fetch)
      setSearchParams({
        city: normalized.city,
        cityCode: normalized.cityCode,
        cityId: normalized.cityCode, // compat
        arrivalDate: normalized.arrivalDate,
        nights: normalized.nights,
        rooms: normalized.rooms,
        adults: normalized.adults, // CSV
        children: normalized.children, // CSV
        childrenAges: normalized.childrenAges, // "a,b|c"
      });

      // 3) trigger results reload
      bumpNonce?.();

      // 4) keep URL in sync (optional)
      try {
        const qs = new URLSearchParams({
          city: String(normalized.city || ""),
          cityCode: String(normalized.cityCode || ""),
          checkInDate: String(normalized.checkInDate || ""),
          checkOutDate: String(normalized.checkOutDate || ""),
          rooms: String(normalized.rooms || 1),
          adults: String(normalized.adults || "2"),
          children: String(normalized.children || "0"),
          ...(normalized.childrenAges
            ? { childrenAges: String(normalized.childrenAges) }
            : {}),
        }).toString();
        window.history.replaceState(null, "", `/admin/hotel?${qs}`);
      } catch {}

      // 5) optional: POST search session (non-blocking)
      // HotelBookingPage.handleSearch (onSearch-ից հետո, եթե ունես նման բլոկ)
      if (ENABLE_SEARCH_SESSIONS) {
        const sessionPayload = {
          cityCode: normalized.cityCode,
          arrivalDate: normalized.arrivalDate,
          nights: normalized.nights,
          rooms: normalized.rooms,
          adultsCSV: normalized.adults,
          childrenCSV: normalized.children,
          childrenAgesCSV: normalized.childrenAges,
        };
        api
          .post("/search-sessions/hotel", sessionPayload)
          .catch((e) =>
            console.warn("[HBP] session post (search) failed", e?.message || e)
          );
      }
    },
    [setCriteria, bumpNonce]
  );

  const onApplyFilters = useCallback(
    (payload) => {
      setUiFilters(payload);
      if (isNarrow) setFiltersOpen(false);
    },
    [isNarrow]
  );

  // Classic bar remount key – rehydrate when these change
  const hsbKey = [
    searchCriteria.cityCode ?? "",
    searchCriteria.checkInDate ?? "",
    searchCriteria.checkOutDate ?? "",
  ].join("|");

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h2>Hotel Booking</h2>
        <button
          className={styles.filterToggle}
          onClick={() => setFiltersOpen(true)}
        >
          Filters
        </button>
      </div>

      {/* AI Search */}
      <div className={styles.sectionGap}>
        <AISmartSearch onSearch={handleSearch} />
      </div>

      {/* Classic Search Bar */}
      <div className={styles.searchBarSection}>
        <HotelSearchBar
          key={hsbKey}
          initialValues={searchCriteria}
          onSearch={handleSearch}
        />
      </div>

      {/* Layout: sidebar + results */}
      <div className={styles.mainContent}>
        {showStaticSidebar && (
          <div className={styles.sidebarWrapper}>
            <HotelFiltersSidebar onFilterChange={setUiFilters} />
          </div>
        )}

        <div className={styles.resultsWrapper}>
          <SupplierResultsView
            searchParams={searchParams}
            uiFilters={uiFilters}
          />
        </div>
      </div>

      {/* Off-canvas drawer */}
      {isNarrow && (
        <>
          <div
            className={`${styles.sidebarDrawer} ${
              filtersOpen ? styles.sidebarDrawerOpen : ""
            }`}
          >
            <div className={styles.drawerHead}>
              <h4>Filters</h4>
              <button
                className={styles.closeBtn}
                onClick={() => setFiltersOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.drawerBody}>
              <HotelFiltersSidebar onFilterChange={onApplyFilters} />
            </div>
          </div>

          {filtersOpen && (
            <div
              className={styles.backdrop}
              onClick={() => setFiltersOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
