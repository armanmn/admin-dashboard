// src/components/admin/SupplierResultsView.jsx
// NEW
"use client";

import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import SupplierHotelCard from "./SupplierHotelCard";
import { useCurrencyStore } from "@/stores/currencyStore";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
import usePublicSettings from "@/hooks/usePublicSettings";
import { resolveCityCode } from "@/utils/citySearch";
import { differenceInCalendarDays, isValid } from "date-fns";
import { tryConvert } from "@/utils/fx"; // ✅ instead of priceUtils
import styles from "@/styles/supplierResultsView.module.css";

const CHUNK = 20;

function toNights(checkIn, checkOut, fallback = 1) {
  if (
    checkIn &&
    checkOut &&
    isValid(new Date(checkIn)) &&
    isValid(new Date(checkOut))
  ) {
    const n = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
    return Math.max(1, n);
  }
  return Math.max(1, Number(fallback) || 1);
}

function validateAges(count, ages) {
  const c = Math.max(0, Number(count) || 0);
  if (c === 0) return true;
  if (!Array.isArray(ages) || ages.length !== c) return false;
  return ages.every((a) => {
    const v = Number(a);
    return Number.isFinite(v) && v >= 0 && v <= 17;
  });
}

const SupplierResultsView = ({ searchParams, uiFilters }) => {
  // ---------------- Local state ----------------
  const [allHotels, setAllHotels] = useState([]);
  const [visibleCount, setVisibleCount] = useState(CHUNK);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState("grid"); // "grid" | "list"
  const [sortBy, setSortBy] = useState("price_asc");
  const [resolvedCityId, setResolvedCityId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ---------------- Stores / settings ----------------
  const { currency } = useCurrencyStore();
  const publicSettings = usePublicSettings();
  const nightsFromStore = useSearchCriteriaStore((s) => s.nights);
  const nonce = useSearchCriteriaStore((s) => s.nonce);

  // fallback from store
  const childrenStore = useSearchCriteriaStore((s) => s.children);
  const agesStore = useSearchCriteriaStore((s) => s.childrenAges);

  // ---------------- Derive inputs from props ----------------
  const {
    city: locationInput,
    cityCode,
    checkInDate,
    checkOutDate,
    adults = 2,
    children: childrenFromQuery,
    rooms = 1,
    childrenAges: agesFromQueryString,
  } = searchParams || {};

  const children = useMemo(() => {
    const q = childrenFromQuery;
    if (q === undefined || q === null || q === "")
      return Number(childrenStore || 0);
    return Number(q || 0);
  }, [childrenFromQuery, childrenStore]);

  const childrenAges = useMemo(() => {
    if (typeof agesFromQueryString === "string" && agesFromQueryString.trim()) {
      return agesFromQueryString
        .split(",")
        .map((x) => x.trim())
        .filter((x) => x !== "")
        .map((x) => Number(x));
    }
    return Array.isArray(agesStore) ? agesStore : [];
  }, [agesFromQueryString, agesStore]);

  const agesValid = useMemo(
    () => validateAges(children, childrenAges),
    [children, childrenAges]
  );

  const arrivalDate = checkInDate || null;
  const nights = toNights(checkInDate, checkOutDate, nightsFromStore);

  // ---------------- Resolve city code (async) ----------------
  useEffect(() => {
    let alive = true;

    (async () => {
      if (cityCode) {
        if (alive) setResolvedCityId(String(cityCode));
        return;
      }
      if (locationInput && locationInput.trim()) {
        try {
          const code = await resolveCityCode(locationInput.trim(), "goglobal");
          if (alive) setResolvedCityId(code || null);
        } catch (e) {
          console.warn("resolveCityCode failed:", e);
          if (alive) setResolvedCityId(null);
        }
      } else {
        if (alive) setResolvedCityId(null);
      }
    })();

    return () => {
      alive = false;
    };
  }, [locationInput, cityCode]);

  // ---------------- Fetch supplier availability ----------------
  async function fetchSupplierAvailability(params) {
    setLoading(true);
    setErrorMsg("");
    try {
      const {
        cityId,
        arrivalDate,
        nights,
        rooms,
        adults,
        children,
        childrenAges,
        maxHotels = 150,
        maxOffers = 5,
        includeInfo = 0,
        infoLimit = 3,
      } = params;

      if (children > 0 && !validateAges(children, childrenAges)) {
        setAllHotels([]);
        setVisibleCount(CHUNK);
        setErrorMsg("Խնդրում ենք լրացնել երեխաների տարիքները (0–17)։");
        return;
      }

      const qs = new URLSearchParams({
        cityId: String(cityId || ""),
        arrivalDate: String(arrivalDate || ""),
        nights: String(nights || ""),
        rooms: String(rooms || ""),
        adults: String(adults || ""),
        children: String(children || 0),
        childrenAges:
          children > 0 && childrenAges?.length === children
            ? childrenAges.join(",")
            : "",
        maxHotels: String(maxHotels),
        maxOffers: String(maxOffers),
        includeInfo: String(includeInfo),
        infoLimit: String(infoLimit),
      }).toString();

      const url = `/suppliers/goglobal/availability?${qs}`;
      const resp = await api.get(url);

      const data = resp?.data || resp || {};
      const hotels =
        data.hotels || data.Hotels || data.results || data.data || [];

      setAllHotels(Array.isArray(hotels) ? hotels : []);
      setVisibleCount(CHUNK);
    } catch (err) {
      console.error("[Supplier] availability error", err);
      setAllHotels([]);
      setErrorMsg("Չհաջողվեց ստանալ առկայությունը։ Փորձեք մի քիչ հետո։");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!resolvedCityId || !arrivalDate) return;

    fetchSupplierAvailability({
      cityId: resolvedCityId,
      arrivalDate,
      nights,
      rooms,
      adults,
      children,
      childrenAges,
      maxHotels: 150,
      maxOffers: 5,
      includeInfo: 0,
      infoLimit: 3,
    });
  }, [
    resolvedCityId,
    arrivalDate,
    nights,
    rooms,
    adults,
    children,
    JSON.stringify(childrenAges),
    nonce,
  ]);

  // ---------------- Convert (per-stay only, no *nights) ----------------
  const pricedHotels = useMemo(() => {
    const rates = publicSettings?.exchangeRates || null;
    const target = (currency || "").toUpperCase();

    return (allHotels || []).map((h) => {
      const rawAmount = Number(
        h?.minPrice?.amount ??
          h?.minOffer?.price?.amount ??
          h?.minOffer?.amount ??
          0
      );
      const rawCur = String(
        h?.minPrice?.currency ||
          h?.minOffer?.price?.currency ||
          h?.minOffer?.currency ||
          ""
      ).toUpperCase();

      if (!isFinite(rawAmount) || rawAmount <= 0) {
        return {
          ...h,
          _displayTotal: null,
          _displayCurrency: target || rawCur || "",
        };
      }

      // target չկա կամ նույն արժույթն է → ցույց ենք տալիս supplier-ի per-stay արժեքը
      if (!target || !rates || target === rawCur) {
        return {
          ...h,
          _displayTotal: rawAmount,
          _displayCurrency: rawCur || target || "",
        };
      }

      // Փորձում ենք convert անել (AMD-based rates), եթե չստացվեց՝ supplier արժույթով
      const conv = tryConvert(rawAmount, rawCur, target, rates);
      if (conv?.ok) {
        return {
          ...h,
          _displayTotal: Number(conv.value),
          _displayCurrency: target,
        };
      }

      return {
        ...h,
        _displayTotal: rawAmount,
        _displayCurrency: rawCur || target || "",
      };
    });
  }, [allHotels, currency, publicSettings]);

  // ---------------- Local filter (min/max) ----------------
  const toNum = (v) =>
    v === "" || v === null || v === undefined ? NaN : Number(v);

  const locallyFiltered = useMemo(() => {
    let result = pricedHotels.filter((h) => h._displayTotal != null);

    const min = toNum(uiFilters?.minPrice);
    const max = toNum(uiFilters?.maxPrice);
    const applyBounds = !Number.isNaN(min) || !Number.isNaN(max);

    if (applyBounds) {
      result = result.filter((h) => {
        const amt = Number(h._displayTotal);
        if (!Number.isNaN(min) && amt < min) return false;
        if (!Number.isNaN(max) && amt > max) return false;
        return true;
      });
    }

    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => (a._displayTotal ?? 0) - (b._displayTotal ?? 0));
        break;
      case "price_desc":
        result.sort((a, b) => (b._displayTotal ?? 0) - (a._displayTotal ?? 0));
        break;
      default:
        break;
    }

    return result;
  }, [pricedHotels, uiFilters, sortBy]);

  // ---------------- Pagination ----------------
  const visibleHotels = useMemo(
    () => locallyFiltered.slice(0, visibleCount),
    [locallyFiltered, visibleCount]
  );

  const loadMore = () => setVisibleCount((prev) => prev + CHUNK);

  // ---------------- Early states ----------------
  if (!resolvedCityId || !arrivalDate) {
    return (
      <div style={{ padding: 12 }}>
        <div style={{ marginTop: 8, color: "#999" }}>No live hotels found.</div>
      </div>
    );
  }

  // if (loading && visibleHotels.length === 0) {
  //   return (
  //     <div style={{ padding: 12 }}>
  //       <div style={{ marginBottom: 8, color: "#666" }}>
  //         Using cityId={resolvedCityId}. Loading live hotels…
  //       </div>
  //     </div>
  //   );
  // }

  if (loading && visibleHotels.length === 0) {
    return (
      <div className={styles.firstLoad}>
        <span className={styles.spinnerLg} />
        Loading hotels…
      </div>
    );
  }

  const showOverlay = loading && allHotels.length > 0;

  // ---------------- UI ----------------
  return (
    <div className={styles?.container ?? undefined} style={{ padding: 12 }}>
      {/* Top bar */}
      <div className={styles?.topBar ?? undefined} style={{ marginBottom: 12 }}>
        <div className={styles?.viewTabs ?? undefined}>
          <button
            type="button"
            className={`${styles.tab} ${
              viewType === "grid" ? styles.tabActive : ""
            }`}
            onClick={() => setViewType("grid")}
          >
            Grid
          </button>
          <button
            type="button"
            className={`${styles.tab} ${
              viewType === "list" ? styles.tabActive : ""
            }`}
            onClick={() => setViewType("list")}
          >
            List
          </button>
        </div>

        <div
          className={styles?.sortContainer ?? undefined}
          style={{ marginLeft: "auto" }}
        >
          <label style={{ marginRight: 6 }}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {errorMsg && (
        <div
          className={styles?.error ?? undefined}
          style={{ marginBottom: 12 }}
        >
          {errorMsg}
        </div>
      )}

      {/* Results */}
      <div className={styles.resultsShell} aria-busy={loading}>
        {showOverlay && (
          <div className={styles.loadingOverlay}>
            <span className={styles.spinner} /> Updating results…
          </div>
        )}

        <div
          className={`${
            viewType === "grid" ? styles.gridWrapper : styles.listWrapper
          } ${showOverlay ? styles.dim : ""}`}
        >
          {visibleHotels.map((hotel, idx) => (
            <SupplierHotelCard
              key={hotel._id || hotel.code || hotel.HotelCode || idx}
              hotel={hotel}
              viewType={viewType}
              criteria={{
                arrivalDate,
                nights,
                cityId: resolvedCityId,
                adults,
                children,
                childrenAges,
              }}
            />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {!loading && visibleHotels.length < locallyFiltered.length && (
        <div className={styles?.loadMoreWrapper ?? undefined}>
          <button
            onClick={loadMore}
            className={styles?.loadMoreButton ?? undefined}
          >
            Load More
          </button>
        </div>
      )}

      {loading && visibleHotels.length > 0 && (
        <p style={{ marginTop: 8, color: "#777" }}>Loading more hotels…</p>
      )}
    </div>
  );
};

export default SupplierResultsView;
