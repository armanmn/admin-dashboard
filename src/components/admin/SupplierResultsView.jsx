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

// ✅ canonical children helpers (rooms '|' , ages ',')
import { validateChildrenSpec, ROOMS_SEP, AGES_SEP } from "@/utils/childrenCsv";

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

/* ---------------- small utils kept local ---------------- */
const splitCSV = (v) =>
  String(v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s !== "");

const isCSV = (v) => typeof v === "string" && v.includes(",");

const clampInt = (n, lo = 0, hi = 17) => {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  return Math.max(lo, Math.min(hi, Math.trunc(x)));
};

function normalizeAdultsCSV(adultsParam, roomsCount) {
  if (isCSV(adultsParam)) {
    const nums = splitCSV(adultsParam).map((x) => Math.max(0, Number(x) || 0));
    const arr = Array.from(
      { length: roomsCount },
      (_, i) => nums[i] ?? nums[nums.length - 1] ?? 0
    );
    return arr.join(",");
  }
  const n = Number(adultsParam);
  const val = Number.isFinite(n) && n >= 0 ? n : 0;
  return Array.from({ length: roomsCount }, () => val).join(",");
}

/* ---------------- CSV helpers (fixed to rooms "|" , ages ",") ---------------- */

// Parse ages into per-room blocks (array of arrays)
// Accepts input like "5|9,11" (canonical), "5,9,11" (flat), or "5|9" (single-room with pipes)
function parseAgesBlocks(agesParam, roomsCount) {
  const raw = String(agesParam ?? "").trim();
  const blocks = Array.from({ length: roomsCount }, () => []);

  if (!raw) return blocks;

  const sanitizeAges = (s) =>
    String(s || "")
      .split(AGES_SEP)
      .map((t) => clampInt(t, 0, 17))
      .filter((n) => n !== null);

  // ✅ per-room style: "5|9,11"  (rooms by '|', ages by ',')
  if (raw.includes(ROOMS_SEP)) {
    const segs = raw.split(ROOMS_SEP).map((s) => s.trim());
    for (let i = 0; i < roomsCount; i++) {
      const seg = segs[i] || "";
      blocks[i] = seg ? sanitizeAges(seg) : [];
    }
    return blocks;
  }

  // flat CSV: "5,9,11" (կբաշխենք հետո ըստ children count)
  const flat = String(raw)
    .split(AGES_SEP)
    .map((x) => clampInt(x, 0, 17))
    .filter((n) => n !== null);

  // annotate for later distribution
  // @ts-ignore
  blocks._flat = flat;
  return blocks;
}

// children CSV → list per-room counts of length roomsCount
function parseChildrenCounts(childrenParam, roomsCount) {
  if (isCSV(childrenParam)) {
    const nums = splitCSV(childrenParam).map((x) =>
      Math.max(0, Number(x) || 0)
    );
    const arr = Array.from({ length: roomsCount }, (_, i) => nums[i] ?? 0);
    return arr;
  }
  if (
    childrenParam !== undefined &&
    childrenParam !== null &&
    String(childrenParam).trim() !== ""
  ) {
    const total = Math.max(0, Number(childrenParam) || 0);
    // when only total is given → put into first room by default
    return [
      total,
      ...Array.from({ length: Math.max(roomsCount - 1, 0) }, () => 0),
    ];
  }
  // unspecified → all zero
  return Array.from({ length: roomsCount }, () => 0);
}

// Distribute flat ages into rooms by counts
function distributeFlatAges(flat, counts) {
  const blocks = counts.map(() => []);
  let idx = 0;
  for (let i = 0; i < counts.length; i++) {
    const need = Math.max(0, counts[i] || 0);
    blocks[i] = flat.slice(idx, idx + need);
    idx += need;
  }
  return blocks;
}

// Build final occupancy CSVs robustly (infers counts from ages when needed)
function buildOccupancyCSVs(adultsParam, childrenParam, agesParam, roomsCount) {
  const adultsCSV = normalizeAdultsCSV(adultsParam, roomsCount);

  let agesBlocks = parseAgesBlocks(agesParam, roomsCount); // array[rooms] of arrays
  let counts = parseChildrenCounts(childrenParam, roomsCount);

  // detect formats
  const hasPerRoomAges = agesBlocks.some(
    (arr) => Array.isArray(arr) && arr.length > 0
  );
  // @ts-ignore
  const hasFlatAges = Array.isArray(agesBlocks._flat);

  // If childrenParam was a single total but per-room ages exist → derive counts from ages
  if (!isCSV(childrenParam) && hasPerRoomAges) {
    counts = agesBlocks.map((a) => a.length);
  }

  // If ages were flat → distribute by counts
  // @ts-ignore
  if (hasFlatAges) {
    // @ts-ignore
    agesBlocks = distributeFlatAges(agesBlocks._flat, counts);
  }

  // Sanitize: trim/extend to roomsCount and enforce 0–17; also trim extras to count
  while (counts.length < roomsCount) counts.push(0);
  if (counts.length > roomsCount) counts.length = roomsCount;

  for (let i = 0; i < roomsCount; i++) {
    const need = Math.max(0, Number(counts[i]) || 0);
    const cur = Array.isArray(agesBlocks[i]) ? agesBlocks[i] : [];
    const clean = cur
      .map((n) => clampInt(n, 0, 17))
      .filter((n) => n !== null)
      .slice(0, need);
    agesBlocks[i] = clean;
  }

  const childrenCSV = counts.map((n) => Math.max(0, Number(n) || 0)).join(",");
  // ✅ build "ages by ','" inside each room, "rooms by '|'"
  const childrenAgesCSV = agesBlocks
    .map((arr) => arr.join(AGES_SEP))
    .join(ROOMS_SEP);

  return { adultsCSV, childrenCSV, childrenAgesCSV };
}

/* ---------------- Component ---------------- */
const SupplierResultsView = ({ searchParams, uiFilters }) => {
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

  // // Force fallback to GRID when width < 1240 (e.g. drawer + list breaks layout)
  // useEffect(() => {
  //   const update = () => {
  //     const ok =
  //       typeof window !== "undefined" ? window.innerWidth >= 1240 : true;
  //     setCanUseList(ok);
  //     if (!ok && viewType === "list") {
  //       setViewType("grid");
  //     }
  //   };
  //   update();
  //   window.addEventListener("resize", update);
  //   return () => window.removeEventListener("resize", update);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

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

  // fallback from store (legacy simple mode)
  const childrenStore = useSearchCriteriaStore((s) => s.children);
  const agesStore = useSearchCriteriaStore((s) => s.childrenAges);

  // ---------------- Derive inputs from props ----------------
  const {
    city: locationInput,
    cityCode,
    checkInDate,
    checkOutDate,
    adults = 2, // can be "2,2" or number
    children: childrenFromQuery, // may be "1,2" or total number
    rooms = 1,
    childrenAges: agesFromQueryString, // may be "5|9,11" or "5,9,11"
  } = searchParams || {};

  const roomsCount = Math.max(1, Number(rooms) || 1);

  // Compose raw params (keep as-is if CSV strings; fallback to store for legacy)
  const adultsParam = adults; // string "2,2" or number 2
  const childrenParam =
    childrenFromQuery !== undefined &&
    childrenFromQuery !== null &&
    String(childrenFromQuery).trim() !== ""
      ? childrenFromQuery
      : childrenStore ?? 0;

  const agesParam =
    typeof agesFromQueryString === "string" && agesFromQueryString.trim()
      ? agesFromQueryString
      : Array.isArray(agesStore)
      ? agesStore.join(",")
      : "";

  // Robust CSVs (+ validation) — fixed separators
  const { adultsCSV, childrenCSV, childrenAgesCSV } = useMemo(() => {
    return buildOccupancyCSVs(
      adultsParam,
      childrenParam,
      agesParam,
      roomsCount
    );
  }, [adultsParam, childrenParam, agesParam, roomsCount]);

  // canonical validation (rooms '|', ages ',')
  const agesValidPerRoom = useMemo(
    () =>
      validateChildrenSpec({
        rooms: roomsCount,
        childrenCSV,
        childrenAgesCSV,
      }),
    [childrenCSV, childrenAgesCSV, roomsCount]
  );

  // Legacy totals (used only for UI child components that may expect numbers/arrays)
  const legacyChildrenTotal = useMemo(() => {
    return splitCSV(childrenCSV).reduce((sum, x) => sum + (Number(x) || 0), 0);
  }, [childrenCSV]);

  const legacyChildrenAgesFlat = useMemo(() => {
    // flatten "a,b|c,d" → [a,b,c,d]   (rooms by '|', ages by ',')
    const blocks = String(childrenAgesCSV)
      .split(ROOMS_SEP)
      .map((s) => s.trim())
      .filter(Boolean);
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
        adults, // CSV
        children, // CSV
        childrenAges, // per-room CSV with pipes (rooms '|', ages ',')
        maxHotels = 150,
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
        setAllHotels([]);
        setVisibleCount(CHUNK);
        setErrorMsg(
          "Խնդրում ենք նշել երեխաների տարիքները ըստ սենյակների (0–17)։"
        );
        return;
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
      rooms: roomsCount,
      adults: adultsCSV,
      children: childrenCSV,
      childrenAges: childrenAgesCSV,
      maxHotels: 150,
      maxOffers: 5,
      includeInfo: 0,
      infoLimit: 3,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    resolvedCityId,
    arrivalDate,
    nights,
    roomsCount,
    adultsCSV,
    childrenCSV,
    childrenAgesCSV,
    nonce,
  ]);

  // ---------------- Convert (per-stay only, no *nights) ----------------
  const pricedHotels = useMemo(() => {
    const rates = publicSettings?.exchangeRates || null;
    const target = (currency || "").toUpperCase();

    return (allHotels || []).map((h) => {
      // 🔁 ԱՆՎՏԱՆԳ FALLBACK-ԵՐ — ներառում ենք նաև minRetail
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

      // եթե գումարը/արժույթը բացակայում են՝ թող վերադարձնենք ինչպես կա
      if (!isFinite(rawAmount) || rawAmount <= 0) {
        return {
          ...h,
          _displayTotal: null,
          _displayCurrency: target || rawCur || "",
        };
      }

      // target չկա կամ rates չկան, կամ արդեն նույն արժույթն է → պահում ենք supplier-ի արժեքը
      if (!target || !rates || target === rawCur) {
        return {
          ...h,
          _displayTotal: rawAmount,
          _displayCurrency: rawCur || target || "",
        };
      }

      // Փորձում ենք convert անել (AMD-based rates). Չստացվեց → supplier արժույթով
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

  // --- Boards normalization & price helpers (local-only) ---
  const normalizeBoardCode = (board) => {
    const s = String(board || "").toLowerCase();

    // Direct codes present already?
    if (["ro", "bb", "hb", "fb", "ai", "uai"].includes(s))
      return s.toUpperCase();

    // Map common names to codes
    if (s.includes("room only")) return "RO";
    if (s.includes("bed & breakfast") || s.includes("breakfast")) return "BB";
    if (s.includes("half")) return "HB";
    if (s.includes("full")) return "FB";
    if (s.includes("ultra")) return "UAI";
    if (s.includes("all incl")) return "AI";

    return ""; // unknown
  };

  const getHotelStars = (h) => {
    // we have seen: h.category (number/string), h.stars
    const raw =
      h?.category ?? h?.stars ?? h?.StarRating ?? h?.HotelCategory ?? null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(5, Math.round(n))) : 0;
  };

  // --- Collect all possible offer candidates from hotel payload ---
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

  // --- Compute "platform refundable" (buffer-aware) ---
  const isPlatformRefundable = (off) => {
    // Preferred: explicit platform block
    const plat = off?.cancellation?.platform;
    if (plat && typeof plat.refundable === "boolean") {
      if (!plat.refundable) return false;
      const cutoff = plat?.cutoffUtc || off?.platformCutoffUtc;
      if (!cutoff) return true;
      return Date.now() < new Date(cutoff).getTime();
    }

    // Derive from supplier deadline + bufferDays if present
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

    // Fallback: use supplier refundable flag
    return !!off?.refundable;
  };

  /**
   * Compute min price among candidates that pass boards/refund filters.
   * refundMode: "none" | "platform" | "supplier"
   */
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
      // refund filter
      if (refundMode === "platform" && !isPlatformRefundable(off)) continue;
      if (refundMode === "supplier" && !off?.refundable) continue;

      // board filter
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

  // const locallyFiltered = useMemo(() => {
  //   let result = pricedHotels.filter((h) => h._displayTotal != null);

  //   const min = toNum(uiFilters?.minPrice);
  //   const max = toNum(uiFilters?.maxPrice);
  //   const applyBounds = !Number.isNaN(min) || !Number.isNaN(max);

  //   if (applyBounds) {
  //     result = result.filter((h) => {
  //       const amt = Number(h._displayTotal);
  //       if (!Number.isNaN(min) && amt < min) return false;
  //       if (!Number.isNaN(max) && amt > max) return false;
  //       return true;
  //     });
  //   }

  //   switch (sortBy) {
  //     case "price_asc":
  //       result.sort((a, b) => (a._displayTotal ?? 0) - (b._displayTotal ?? 0));
  //       break;
  //     case "price_desc":
  //       result.sort((a, b) => (b._displayTotal ?? 0) - (a._displayTotal ?? 0));
  //       break;
  //     default:
  //       break;
  //   }

  //   return result;
  // }, [pricedHotels, uiFilters, sortBy]);

  const locallyFiltered = useMemo(() => {
    const rates = publicSettings?.exchangeRates || null;
    const target = (currency || "").toUpperCase();

    // UI inputs
    const min = toNum(uiFilters?.minPrice);
    const max = toNum(uiFilters?.maxPrice);
    const applyBounds = !Number.isNaN(min) || !Number.isNaN(max);

    const minStars = Number(uiFilters?.minStars) || 0;
    const selectedBoards =
      typeof uiFilters?.boards === "string" && uiFilters.boards.trim()
        ? uiFilters.boards
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean)
        : [];

    // Backward-compat: if old "refundable" boolean ever comes, treat as platform
    const refundMode =
      uiFilters?.refundMode || (uiFilters?.refundable ? "platform" : "none");

    // 1) Base set: items with any base price
    let result = pricedHotels.filter((h) => h._displayTotal != null);

    // 2) Stars
    if (minStars > 0) {
      result = result.filter((h) => getHotelStars(h) >= minStars);
    }

    // 3) Boards / Refunds → compute effective price
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

          if (!evaluable) {
            // can't evaluate → keep as-is
            eff = h._displayTotal;
          } else {
            eff = value == null ? null : value;
          }
        }

        return { ...h, _effectiveTotal: eff };
      })
      .filter((h) => h._effectiveTotal != null);

    // 4) Price range
    if (applyBounds) {
      result = result.filter((h) => {
        const amt = Number(h._effectiveTotal);
        if (!Number.isNaN(min) && amt < min) return false;
        if (!Number.isNaN(max) && amt > max) return false;
        return true;
      });
    }

    // 5) Sort
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
                rooms: roomsCount,
                // Pass both CSV (authoritative) and legacy for compatibility
                adults: adultsCSV,
                children: childrenCSV,
                childrenAges: childrenAgesCSV,
                legacyChildrenTotal,
                legacyChildrenAgesFlat,
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
