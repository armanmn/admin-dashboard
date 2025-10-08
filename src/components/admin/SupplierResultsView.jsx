// src/components/admin/SupplierResultsView.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "@/utils/api";
import SupplierHotelCard from "./SupplierHotelCard";
import { useCurrencyStore } from "@/stores/currencyStore";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
import usePublicSettings from "@/hooks/usePublicSettings";
import { resolveCityCode } from "@/utils/citySearch";
import { differenceInCalendarDays, isValid } from "date-fns";
import { tryConvert } from "@/utils/fx";
import styles from "@/styles/supplierResultsView.module.css";
import {
  getAvailFromCache,
  setAvailToCache,
  makeAvailKey,
} from "@/utils/searchCache";

// guests utils
import {
  validateChildrenSpec,
  ensureAgesForApi,
  ROOMS_SEP,
  AGES_SEP,
} from "@/utils/childrenCsv";

const CHUNK = 20;

/* ---------------- small utils ---------------- */
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

const clampInt = (n, lo = 0, hi = 17) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  return Math.max(lo, Math.min(hi, Math.trunc(x)));
};

const splitCSV = (v) =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");

const toNum = (v) =>
  v === "" || v === null || v === undefined ? NaN : Number(v);

/* ---------------- Component ---------------- */
const SupplierResultsView = ({ searchParams = {}, uiFilters }) => {
  // ---------------- Local state ----------------
  const [allHotels, setAllHotels] = useState([]);
  const [visibleCount, setVisibleCount] = useState(CHUNK);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState("grid"); // "grid" | "list"
  const [sortBy, setSortBy] = useState("price_asc");
  const [resolvedCityId, setResolvedCityId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [canUseList, setCanUseList] = useState(true);

  const effectiveViewType = canUseList ? viewType : "grid";

  useEffect(() => {
    console.debug("[SRV] PROPS RAW from parent", searchParams);
  }, [searchParams]);

  // Track width to decide if List is allowed
  useEffect(() => {
    const onResize = () => {
      const ok =
        typeof window !== "undefined" ? window.innerWidth >= 1240 : true;
      setCanUseList(ok);
    };
    onResize(); // run once on mount
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Auto-fallback to GRID whenever List becomes disallowed
  useEffect(() => {
    if (!canUseList && viewType === "list") {
      setViewType("grid");
    }
  }, [canUseList, viewType]);

  // ---------------- Stores / settings ----------------
  const { currency } = useCurrencyStore();
  const publicSettings = usePublicSettings();
  const nightsFromStore = useSearchCriteriaStore((s) => s.nights);
  const nonce = useSearchCriteriaStore((s) => s.nonce);

  // ---------------- Derive inputs from props (supports legacy keys too) ----------------
  const {
    city: locationInput,
    cityCode,
    cityId: cityIdProp,
    arrivalDate: arrivalDateProp,
    nights: nightsProp,
    rooms: roomsProp,
    adults: adultsProp, // CSV
    children: childrenProp, // CSV
    childrenAges: childrenAgesProp, // "a,b|c"
    // Legacy fallback:
    checkInDate,
    checkOutDate,
  } = searchParams;

  // Dates – prefer canonical (arrivalDate+nights), else legacy (ci/co)
  const arrivalDate =
    arrivalDateProp ?? (checkInDate ? String(checkInDate) : null);

  const nights = Number.isFinite(Number(nightsProp))
    ? Number(nightsProp)
    : toNights(checkInDate, checkOutDate, nightsFromStore);

  // Rooms/adults/children/ages – take exactly what we got for UI/logs
  const roomsCanon = Math.max(
    1,
    Number(
      roomsProp ||
        String(adultsProp || "")
          .split(",")
          .filter(Boolean).length ||
        String(childrenProp || "")
          .split(",")
          .filter(Boolean).length ||
        String(childrenAgesProp || "")
          .split("|")
          .filter(Boolean).length ||
        1
    )
  );
  const adultsCSV = String(
    typeof adultsProp === "string" ? adultsProp : adultsProp ?? ""
  );
  const childrenCSV = String(
    typeof childrenProp === "string" ? childrenProp : childrenProp ?? ""
  );
  const childrenAgesCSV = String(
    typeof childrenAgesProp === "string"
      ? childrenAgesProp
      : Array.isArray(childrenAgesProp)
      ? childrenAgesProp.join(",")
      : ""
  );

  // Legacy totals (UI կոմպոնենտների համար)
  const legacyChildrenTotal = useMemo(() => {
    return splitCSV(childrenCSV).reduce((sum, x) => sum + (Number(x) || 0), 0);
  }, [childrenCSV]);

  const legacyChildrenAgesFlat = useMemo(() => {
    // flatten "a,b|c,d" → [a,b,c,d]
    const blocks = String(childrenAgesCSV)
      .split(ROOMS_SEP)
      .map((s) => s.trim());
    const flat = [];
    for (const blk of blocks) {
      if (!blk) continue;
      for (const t of blk.split(AGES_SEP)) {
        const n = clampInt(t, 0, 17);
        if (n !== null) flat.push(n);
      }
    }
    return flat;
  }, [childrenAgesCSV]);

  // ---------------- Resolve city code (async) ----------------
  useEffect(() => {
    let alive = true;

    (async () => {
      const readyId = cityIdProp ?? cityCode;
      if (readyId) {
        if (alive) {
          setResolvedCityId(String(readyId));
          console.debug("[SRV] resolveCity → immediate id", String(readyId));
        }
        return;
      }

      if (locationInput && locationInput.trim()) {
        try {
          const code = await resolveCityCode(locationInput.trim(), "goglobal");
          if (alive) {
            setResolvedCityId(code || null);
            console.debug("[SRV] resolveCity → resolved", {
              from: locationInput,
              code,
            });
          }
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
  }, [locationInput, cityCode, cityIdProp]);

  async function fetchSupplierAvailability(params) {
    setLoading(true);
    setErrorMsg("");

    console.groupCollapsed("[SRV] FETCH → availability params");
    console.table(params);
    console.groupEnd();

    try {
      const {
        cityId,
        arrivalDate,
        nights,
        rooms,
        adults, // CSV
        children, // CSV
        childrenAges, // "9|10,12" (ensured)
        maxHotels = 500,
        maxOffers = 5,
        includeInfo = 0,
        infoLimit = 3,
      } = params;

      if (
        !validateChildrenSpec({
          rooms,
          childrenCSV: String(children || ""),
          childrenAgesCSV: String(childrenAges || ""),
        })
      ) {
        console.warn("[SRV] VALIDATION FAIL", {
          rooms,
          childrenCSV: String(children || ""),
          childrenAgesCSV: String(childrenAges || ""),
        });
        setAllHotels([]);
        setVisibleCount(CHUNK);
        setErrorMsg(
          "Խնդրում ենք նշել երեխաների տարիքները ըստ սենյակների (0–17)։"
        );
        return []; // ⬅️ վերադարձնում ենք դատարկ զանգված
      }

      const qs = new URLSearchParams({
        cityId: String(cityId || ""),
        arrivalDate: String(arrivalDate || ""),
        nights: String(nights || ""),
        rooms: String(rooms || ""),
        adults: String(adults || ""),
        children: String(children || "0"),
        childrenAges: String(childrenAges || ""),
        maxHotels: String(maxHotels),
        maxOffers: String(maxOffers),
        includeInfo: String(includeInfo),
        infoLimit: String(infoLimit),
      }).toString();

      const url = `/suppliers/goglobal/availability?${qs}`;
      console.log("[SRV] FETCH → URL", url);

      const resp = await api.get(url);
      const data = resp?.data || resp || {};
      const hotels =
        data.hotels || data.Hotels || data.results || data.data || [];

      const safe = Array.isArray(hotels) ? hotels : [];
      setAllHotels(safe);
      setVisibleCount(CHUNK);
      return safe; // ⬅️ կարևոր է՝ վերադարձնում ենք
    } catch (err) {
      console.error("[Supplier] availability error", err);
      setAllHotels([]);
      setErrorMsg("Չհաջողվեց ստանալ առկայությունը։ Փորձեք մի քիչ հետո։");
      return []; // ⬅️ վերադարձնել դատարկը, որ .then(hotels) միշտ աշխատի
    } finally {
      setLoading(false);
    }
  }

  // keep a key per nonce to avoid double-fetch with same params
  const lastKeyByNonceRef = useRef({}); // { [nonce]: "cityId|arrival|nights|rooms|adults|children|ages" }

  useEffect(() => {
    if (!resolvedCityId || !arrivalDate) return;

    // deps snapshot
    console.debug("[SRV] effect deps", {
      resolvedCityId,
      arrivalDate,
      nights,
      roomsCanon,
      adultsCSV,
      childrenCSV,
      childrenAgesCSV, // UI արժեքը՝ առանց padding
      nonce,
    });

    // ages ensured միայն API-ի համար
    const apiAges = ensureAgesForApi(childrenCSV, childrenAgesCSV, 8);
    console.debug("[SRV] apiAges (ensured only for API)", apiAges);

    // cache key
    const cacheKey = makeAvailKey({
      provider: "goglobal",
      cityId: resolvedCityId,
      arrivalDate,
      nights,
      rooms: roomsCanon,
      adults: adultsCSV,
      children: childrenCSV,
      childrenAges: apiAges,
    });

    // duplicate-skip per nonce
    const lastKey = lastKeyByNonceRef.current[nonce ?? "__no_nonce__"];
    console.debug("[SRV] fetch-key check", { nonce, cacheKey, lastKey });

    // 1) Cache HIT → render instantly, skip network
    const cached = getAvailFromCache(cacheKey);
    if (cached) {
      console.debug("[SRV] cache HIT → render", {
        cacheKey,
        count: cached.length,
      });
      setAllHotels(Array.isArray(cached) ? cached : []);
      setVisibleCount(CHUNK);
      setLoading(false);
      setErrorMsg("");
      lastKeyByNonceRef.current[nonce ?? "__no_nonce__"] = cacheKey;
      return;
    }

    // 2) Same nonce + same key → skip
    if (lastKey === cacheKey) {
      console.debug("[SRV] skip duplicate fetch for same nonce/key");
      return;
    }

    // 3) MISS → fetch → cache SET
    fetchSupplierAvailability({
      cityId: resolvedCityId,
      arrivalDate,
      nights,
      rooms: roomsCanon,
      adults: adultsCSV,
      children: childrenCSV,
      childrenAges: apiAges,
      maxHotels: 150,
      maxOffers: 5,
      includeInfo: 0,
      infoLimit: 3,
    }).then((hotels) => {
      setAvailToCache(cacheKey, Array.isArray(hotels) ? hotels : []);
      lastKeyByNonceRef.current[nonce ?? "__no_nonce__"] = cacheKey;
      console.debug("[SRV] cache SET", {
        cacheKey,
        count: hotels?.length ?? 0,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    resolvedCityId,
    arrivalDate,
    nights,
    roomsCanon,
    adultsCSV,
    childrenCSV,
    childrenAgesCSV,
    nonce,
  ]);

  // 🔎 Debug: show UI values (not ensured)
  useEffect(() => {
    console.groupCollapsed("[SRV] ARRIVE → searchParams (UI) & CSVs");
    console.log({
      city: locationInput,
      cityCode,
      cityId: cityIdProp,
      arrivalDate,
      checkInDate,
      checkOutDate,
      nights,
      roomsCanon,
      adultsCSV,
      childrenCSV,
      childrenAgesCSV,
      nonce,
    });
    console.groupEnd();
  }, [
    locationInput,
    cityCode,
    cityIdProp,
    arrivalDate,
    checkInDate,
    checkOutDate,
    nights,
    roomsCanon,
    adultsCSV,
    childrenCSV,
    childrenAgesCSV,
    nonce,
  ]);

  /* ---------------- Pricing conversion (per-stay) ---------------- */
  const pricedHotels = useMemo(() => {
    const rates = publicSettings?.exchangeRates || null;
    const target = (currency || "").toUpperCase();

    return (allHotels || []).map((h) => {
      const rawAmount = Number(
        h?.minRetail?.amount ??
          h?.minPrice?.amount ??
          h?.minOffer?.retail?.amount ??
          h?.minOffer?.price?.amount ??
          h?.minOffer?.amount ??
          0
      );

      const rawCur = String(
        h?.minRetail?.currency ||
          h?.minPrice?.currency ||
          h?.minOffer?.retail?.currency ||
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

      if (!target || !rates || target === rawCur) {
        return {
          ...h,
          _displayTotal: rawAmount,
          _displayCurrency: rawCur || target || "",
        };
      }

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

  /* ---------------- Local filtering + sorting ---------------- */
  const normalizeBoardCode = (val) => {
    const raw = String(val || "").trim();
    if (!raw) return "";

    const up = raw.toUpperCase();
    const direct = ["RO", "BB", "HB", "FB", "AI", "CB", "BD", "UAI"];
    if (direct.includes(up)) return up;

    const t = up.replace(/[^A-Z]/g, "");

    if (t.includes("ROOMONLY")) return "RO";
    if (
      t.includes("BEDANDBREAKFAST") ||
      t.includes("BEDBREAKFAST") ||
      t === "BREAKFAST"
    )
      return "BB";
    if (t.includes("CONTINENTALBREAKFAST")) return "CB";
    if (t.includes("HALFBOARD")) return "HB";
    if (t.includes("FULLBOARD")) return "FB";
    if (t.includes("ALLINCLUSIVE")) return "AI";
    if (t.includes("BEDANDDINNER") || t === "BEDDINNER") return "BD";
    if (t.includes("ULTRAINCLUSIVE")) return "UAI";

    if (up.includes("ROOM ONLY")) return "RO";
    if (up.includes("BED & BREAKFAST") || up.includes("BED AND BREAKFAST"))
      return "BB";
    if (up.includes("CONTINENTAL BREAKFAST")) return "CB";
    if (up.includes("HALF BOARD")) return "HB";
    if (up.includes("FULL BOARD")) return "FB";
    if (up.includes("ALL INCLUSIVE")) return "AI";
    if (up.includes("BED AND DINNER")) return "BD";
    if (up.includes("ULTRA INCLUSIVE")) return "UAI";

    return "";
  };

  const isPlatformRefundable = (off) => {
    const plat = off?.cancellation?.platform;
    if (plat && typeof plat.refundable === "boolean") {
      if (!plat.refundable) return false;
      const cutoff = plat?.cutoffUtc || off?.platformCutoffUtc;
      if (!cutoff) return true;
      return Date.now() < new Date(cutoff).getTime();
    }

    const supp = off?.cancellation?.supplier;
    const deadlineUtc =
      supp?.deadlineUtc ||
      off?.cancellation?.supplierDeadlineUtc ||
      off?.supplierDeadlineUtc;

    const bufDays =
      plat && Number.isFinite(plat.bufferDays)
        ? plat.bufferDays
        : Number.isFinite(off?.bufferDays)
        ? off.bufferDays
        : null;

    if (deadlineUtc && bufDays != null) {
      const cutoffMs =
        new Date(deadlineUtc).getTime() - bufDays * 24 * 60 * 60 * 1000;
      return Date.now() < cutoffMs;
    }

    return !!off?.refundable;
  };

  const collectCandidateOffers = (hotel) => {
    const out = [];

    if (Array.isArray(hotel?.offers)) {
      for (const o of hotel.offers) out.push(o);
    }

    if (Array.isArray(hotel?.offersPreview)) {
      for (const p of hotel.offersPreview) {
        out.push({
          board: p?.board || p?.RoomBasis,
          refundable:
            typeof p?.refundable === "boolean"
              ? p.refundable
              : p?.NonRef === false,
          retail: p?.retail || (p?.price ? { ...p.price } : undefined),
          price: p?.price,
          amount: p?.amount,
          currency: p?.currency,
          cancellation: p?.cancellation,
          cxlDeadline: p?.cxlDeadline,
          platformCutoffUtc: p?.platformCutoffUtc,
        });
      }
    }

    if (hotel?.minOffer) {
      const m = hotel.minOffer;
      out.push({
        board: m?.board || m?.RoomBasis,
        refundable:
          typeof m?.refundable === "boolean"
            ? m.refundable
            : m?.NonRef === false,
        retail: m?.retail || (m?.price ? { ...m.price } : undefined),
        price: m?.price,
        amount: m?.amount,
        currency: m?.currency,
        cancellation: m?.cancellation,
        cxlDeadline: m?.cxlDeadline,
        platformCutoffUtc: m?.platformCutoffUtc,
      });
    }

    return out;
  };

  const getMinFilteredPriceSafe = (
    hotel,
    selectedBoards,
    refundMode,
    rates,
    target
  ) => {
    const candidates = collectCandidateOffers(hotel);
    if (candidates.length === 0) return { evaluable: false, value: null };

    let minAmt = null;
    let minCur = "";

    for (const off of candidates) {
      if (refundMode === "platform" && !isPlatformRefundable(off)) continue;
      if (refundMode === "supplier" && !off?.refundable) continue;

      if (selectedBoards && selectedBoards.length > 0) {
        const code = normalizeBoardCode(off?.board || off?.RoomBasis || "");
        if (!code || !selectedBoards.includes(code)) continue;
      }

      const amt = Number(
        off?.retail?.amount ?? off?.price?.amount ?? off?.amount ?? NaN
      );
      const cur = String(
        off?.retail?.currency || off?.price?.currency || off?.currency || ""
      ).toUpperCase();

      if (!Number.isFinite(amt) || amt <= 0) continue;

      if (minAmt == null || amt < minAmt) {
        minAmt = amt;
        minCur = cur;
      }
    }

    if (minAmt == null) return { evaluable: true, value: null };

    if (!target || !rates || target === minCur) {
      return { evaluable: true, value: minAmt };
    } else {
      const conv = tryConvert(minAmt, minCur, target, rates);
      return { evaluable: true, value: conv?.ok ? Number(conv.value) : minAmt };
    }
  };

  const locallyFiltered = useMemo(() => {
    const rates = publicSettings?.exchangeRates || null;
    const target = (currency || "").toUpperCase();

    // UI inputs
    const min = toNum(uiFilters?.minPrice);
    const max = toNum(uiFilters?.maxPrice);
    const applyBounds = !Number.isNaN(min) || !Number.isNaN(max);

    const minStars = Number(uiFilters?.minStars) || 0;
    const selectedBoards = (() => {
      const csv = String(uiFilters?.boards || "").trim();
      if (!csv) return [];
      const ALLOWED = new Set([
        "RO",
        "BB",
        "HB",
        "FB",
        "AI",
        "CB",
        "BD",
        "UAI",
      ]);
      return csv
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter((c) => ALLOWED.has(c));
    })();

    const refundMode =
      uiFilters?.refundMode || (uiFilters?.refundable ? "platform" : "none");

    let result = pricedHotels.filter((h) => h._displayTotal != null);

    if (minStars > 0) {
      result = result.filter((h) => {
        const raw =
          h?.category ?? h?.stars ?? h?.StarRating ?? h?.HotelCategory ?? null;
        const n = Number(raw);
        const stars = Number.isFinite(n)
          ? Math.max(0, Math.min(5, Math.round(n)))
          : 0;
        return stars >= minStars;
      });
    }

    result = result
      .map((h) => {
        let eff = h._displayTotal;

        if (selectedBoards.length > 0 || refundMode !== "none") {
          const { evaluable, value } = getMinFilteredPriceSafe(
            h,
            selectedBoards,
            refundMode,
            rates,
            target
          );

          eff = evaluable ? (value == null ? null : value) : h._displayTotal;
        }

        return { ...h, _effectiveTotal: eff };
      })
      .filter((h) => h._effectiveTotal != null);

    if (applyBounds) {
      result = result.filter((h) => {
        const amt = Number(h._effectiveTotal);
        if (!Number.isNaN(min) && amt < min) return false;
        if (!Number.isNaN(max) && amt > max) return false;
        return true;
      });
    }

    switch (sortBy) {
      case "price_asc":
        result.sort(
          (a, b) => (a._effectiveTotal ?? 0) - (b._effectiveTotal ?? 0)
        );
        break;
      case "price_desc":
        result.sort(
          (a, b) => (b._effectiveTotal ?? 0) - (a._effectiveTotal ?? 0)
        );
        break;
      default:
        break;
    }

    return result;
  }, [pricedHotels, uiFilters, sortBy, publicSettings, currency]);

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

  if (loading && visibleHotels.length === 0) {
    return (
      <div className={styles.firstLoad}>
        <span className={styles.spinnerLg} />
        Loading hotels…
      </div>
    );
  }

  const showOverlay = loading && allHotels.length > 0;
  const wrapperClass =
    effectiveViewType === "grid" ? styles.gridWrapper : styles.listWrapper;

  // ---------------- UI ----------------
  return (
    <div className={styles?.container ?? undefined} style={{ padding: 12 }}>
      {/* Top bar */}
      <div className={styles?.topBar ?? undefined} style={{ marginBottom: 12 }}>
        <div className={styles?.viewTabs ?? undefined}>
          <button
            type="button"
            className={`${styles.tab} ${
              effectiveViewType === "grid" ? styles.tabActive : ""
            }`}
            onClick={() => setViewType("grid")}
          >
            Grid
          </button>

          {/* List tab is hidden on narrow screens */}
          <button
            type="button"
            className={`${styles.tab} ${
              !canUseList ? styles.hideOnNarrow : ""
            } ${effectiveViewType === "list" ? styles.tabActive : ""}`}
            onClick={() => canUseList && setViewType("list")}
            disabled={!canUseList}
            title={
              !canUseList
                ? "List view is available on wider screens"
                : undefined
            }
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

        <div className={`${wrapperClass} ${showOverlay ? styles.dim : ""}`}>
          {visibleHotels.map((hotel, idx) => (
            <SupplierHotelCard
              key={hotel._id || hotel.code || hotel.HotelCode || idx}
              hotel={hotel}
              viewType={effectiveViewType}
              criteria={{
                arrivalDate,
                nights,
                cityId: resolvedCityId,
                rooms: roomsCanon,
                // pass UI CSVs as-is
                adults: adultsCSV,
                children: childrenCSV,
                childrenAges: childrenAgesCSV,
                // legacy helpers
                legacyChildrenTotal,
                legacyChildrenAgesFlat,
                basis: uiFilters?.boards || "",
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
