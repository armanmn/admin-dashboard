// // New
// // src/components/admin/SupplierHotelCard.jsx
// "use client";
// import React, { useCallback, useMemo } from "react";
// import Link from "next/link";
// import styles from "@/styles/supplierHotelCard.module.css";
// import { useAuthStore } from "@/stores/authStore";
// import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
// import { formatMoney } from "@/utils/formatMoney";
// import {
//   canonGuests,
//   ensureAgesForApi,
//   parseChildrenCountsCSV,
// } from "@/utils/childrenCsv";

// /* ---------------- helpers ---------------- */
// function toNights(checkIn, checkOut, fallback = 1) {
//   try {
//     if (checkIn && checkOut) {
//       const a = new Date(checkIn);
//       const b = new Date(checkOut);
//       if (!isNaN(+a) && !isNaN(+b)) {
//         const ms = b - a;
//         return Math.max(1, Math.round(ms / 86400000));
//       }
//     }
//   } catch {}
//   return Math.max(1, Number(fallback) || 1);
// }

// // very small sanitizer → plain text preview
// function htmlToText(html = "") {
//   const s = String(html || "");
//   if (!s) return "";
//   return s
//     .replace(/<br\s*\/?>/gi, "\n")
//     .replace(/<\/?[^>]+>/g, "")
//     .replace(/\s+/g, " ")
//     .trim();
// }

// // KEEP the original splitCSV and reuse it everywhere
// function splitCSV(s = "") {
//   return String(s)
//     .split(",")
//     .map((x) => x.trim())
//     .filter(Boolean);
// }

// // --- room-aware ages utilities (ALL use splitCSV above) ---
// const splitAgesGroups = (ages = "") =>
//   String(ages || "").trim()
//     ? String(ages)
//         .split("|")
//         .map((seg) => splitCSV(seg))
//     : [];

// /** Detect rooms from any of the signals (adultsCSV, childrenCSV, agesCSV, explicit rooms) */
// function detectRoomsFromSignals(
//   adultsCSV,
//   childrenCSV,
//   agesCSV,
//   fallbackRooms
// ) {
//   const A = splitCSV(adultsCSV);
//   const C = splitCSV(childrenCSV);
//   const G = splitAgesGroups(agesCSV);
//   return Math.max(
//     1,
//     Number(fallbackRooms || 0) || 0,
//     A.length || 0,
//     C.length || 0,
//     G.length || 0
//   );
// }

// /** Normalize adults CSV to R rooms (pad with first value / 2) */
// function normalizeAdultsCSV(adultsCSV, R) {
//   const parts = splitCSV(adultsCSV).map((n) => Math.max(1, Number(n) || 1));
//   const out = Array.from({ length: R }, (_, i) => parts[i] ?? parts[0] ?? 2);
//   return out.join(",");
// }

// /** Normalize children CSV to R rooms (pad with 0) */
// function normalizeChildrenCSV(childrenCSV, R) {
//   const parts = splitCSV(childrenCSV).map((n) => Math.max(0, Number(n) || 0));
//   const out = Array.from({ length: R }, (_, i) => parts[i] ?? 0);
//   return out.join(",");
// }

// /** If ages are flat CSV (e.g. "5,9,11"), split by per-room children counts ("1,2") → "5|9,11" */
// function toAgesByRooms(childrenCSV, agesCSV) {
//   const val = String(agesCSV || "").trim();
//   if (!val) return "";
//   if (val.includes("|")) return val;

//   const perRoom = splitCSV(childrenCSV).map((n) => Number(n) || 0);
//   if (!perRoom.length) return "";

//   const flat = splitCSV(val);
//   const total = perRoom.reduce((s, n) => s + n, 0);
//   if (flat.length !== total) return ""; // cannot reliably segment

//   let i = 0;
//   return perRoom
//     .map((cnt) => {
//       const chunk = flat.slice(i, i + cnt);
//       i += cnt;
//       return chunk.join(",");
//     })
//     .join("|");
// }

// /* ---------------- component ---------------- */
// const SupplierHotelCard = ({ hotel, viewType, criteria }) => {
//   const imageSrc =
//     hotel?.images?.find((x) => x?.isMain)?.url ||
//     hotel?.images?.[0]?.url ||
//     hotel?.thumbnail ||
//     "/placeholder.jpg";

//   const stars = Number(hotel?.stars ?? hotel?.category ?? 0);

//   // --- min/preview offer ---
//   const min = hotel?.minOffer || {};
//   const board = min?.board || null;

//   // --- PRICE (prefer normalized display fields from SupplierResultsView) ---
//   const amount =
//     hotel?._displayTotal ??
//     hotel?.minRetail?.amount ??
//     min?.retail?.amount ??
//     hotel?.minPrice?.amount ??
//     min?.price?.amount ??
//     min?.amount ??
//     null;

//   const currencyCode =
//     hotel?._displayCurrency ||
//     hotel?.minRetail?.currency ||
//     min?.retail?.currency ||
//     hotel?.minPrice?.currency ||
//     min?.price?.currency ||
//     min?.currency ||
//     "";

//   const priceLabel =
//     amount != null
//       ? formatMoney(amount, String(currencyCode || "").toUpperCase())
//       : "—";

//   // multi-room support (UI only; unrelated to search criteria)
//   const roomNames = useMemo(() => {
//     if (Array.isArray(min?.roomNames) && min.roomNames.length)
//       return min.roomNames;
//     if (min?.roomName) return [min.roomName];
//     return [];
//   }, [min]);
//   const roomsCount = Number(min?.roomsCount || roomNames.length || 0);

//   // cutoff helpers — use only offer-level values (avoid hotel-level fallbacks)
//   const platCut =
//     min?.cancellation?.platform?.cutoffUtc ||
//     min?.cancellation?.platformCutoffUtc ||
//     null;

//   const suppCut =
//     min?.cancellation?.supplier?.deadlineUtc ||
//     min?.cancellation?.supplierDeadlineUtc ||
//     null;

//   const rawAddr = hotel?.location?.address;
//   const infoAddr = hotel?.hotelInfo?.hotel?.address || hotel?.address;
//   const address = rawAddr && rawAddr !== "N/A" ? rawAddr : infoAddr || null;

//   const role = useAuthStore((s) => s.user?.role);
//   const isOps = ["admin", "office_user", "finance_user", "finance"].includes(
//     String(role || "").toLowerCase()
//   );

//   const hotelCode =
//     hotel?.externalSource?.hotelCode ||
//     hotel?.hotelCode ||
//     hotel?._id ||
//     hotel?.HotelCode ||
//     hotel?.code ||
//     "";

//   const cityIdFromHotel =
//     hotel?.externalSource?.cityId ||
//     hotel?.cityId ||
//     hotel?.location?.cityId ||
//     "";

//   // store fallbacks
//   const checkInFromStore = useSearchCriteriaStore((s) => s.checkInDate);
//   const checkOutFromStore = useSearchCriteriaStore((s) => s.checkOutDate);
//   const cityCodeFromStore = useSearchCriteriaStore((s) => s.cityCode);
//   const adultsFromStore = useSearchCriteriaStore((s) => s.adults);
//   const childrenFromStore = useSearchCriteriaStore((s) => s.children);
//   const agesFromStore = useSearchCriteriaStore((s) => s.childrenAges);

//   const arrivalDate = criteria?.arrivalDate || checkInFromStore || "";
//   const nights =
//     criteria?.nights ??
//     toNights(
//       criteria?.arrivalDate || checkInFromStore,
//       criteria?.checkOutDate || checkOutFromStore,
//       1
//     );
//   const cityId = criteria?.cityId || cityCodeFromStore || cityIdFromHotel || "";

//   // Pax CSV (prefer criteria CSV, then store)
//   const adultsCSV =
//     (typeof criteria?.adultsCSV === "string" && criteria.adultsCSV) ||
//     (typeof criteria?.adults === "string" && criteria.adults) ||
//     (typeof adultsFromStore === "string" && adultsFromStore) ||
//     String(criteria?.adults ?? adultsFromStore ?? 2);

//   const childrenCSV =
//     (typeof criteria?.childrenCSV === "string" && criteria.childrenCSV) ||
//     (typeof criteria?.children === "string" && criteria.children) ||
//     (typeof childrenFromStore === "string" && childrenFromStore) ||
//     String(criteria?.children ?? childrenFromStore ?? 0);

//   const childrenAgesCSV =
//     (typeof criteria?.childrenAgesCSV === "string" &&
//       criteria.childrenAgesCSV) ||
//     (typeof criteria?.childrenAges === "string" && criteria.childrenAges) ||
//     (typeof agesFromStore === "string" && agesFromStore) ||
//     "";

//   // Canonicalize once (DON'T invent ages here; we only structure them)
//   const canon = canonGuests({
//     rooms: criteria?.rooms,
//     adultsCSV,
//     childrenCSV,
//     childrenAgesCSV,
//   });

//   const totalKids = parseChildrenCountsCSV(canon.childrenCSV).reduce(
//     (s, n) => s + n,
//     0
//   );

//   // --- detect rooms robustly (use any signal) --- Question
//   const roomsDetected = useMemo(() => {
//     const agesRoomAware =
//       toAgesByRooms(childrenCSVInput, childrenAgesInput) || childrenAgesInput;
//     return detectRoomsFromSignals(
//       adultsCSVInput,
//       childrenCSVInput,
//       agesRoomAware,
//       criteria?.rooms
//     );
//   }, [adultsCSVInput, childrenCSVInput, childrenAgesInput, criteria?.rooms]);

//   // // --- canonicalize csvs against roomsDetected --- Question
//   // const adultsCSVCanon   = useMemo(
//   //   () => normalizeAdultsCSV(adultsCSVInput, roomsDetected),
//   //   [adultsCSVInput, roomsDetected]
//   // );
//   // const childrenCSVCanon = useMemo(
//   //   () => normalizeChildrenCSV(childrenCSVInput, roomsDetected),
//   //   [childrenCSVInput, roomsDetected]
//   // );

//   // // ages: keep room-aware if possible; DO NOT invent defaults here (let picker/details own defaults) Question
//   // const childrenAgesCSVCanon = useMemo(() => {
//   //   const byRooms = toAgesByRooms(childrenCSVCanon, childrenAgesInput);
//   //   if (byRooms) return byRooms;
//   //   return "";
//   // }, [childrenCSVCanon, childrenAgesInput]);

//   // const totalKids = useMemo(
//   //   () => splitCSV(childrenCSVCanon).reduce((s, n) => s + (Number(n) || 0), 0),
//   //   [childrenCSVCanon]
//   // );

//   // debug
//   console.debug("[CARD] canon guests →", {
//     roomsDetected,
//     adultsCSVCanon,
//     childrenCSVCanon,
//     childrenAgesCSVCanon,
//     raw: {
//       adultsCSVInput,
//       childrenCSVInput,
//       childrenAgesInput,
//       criteriaRooms: criteria?.rooms,
//     },
//   });

//   // ---- Build query string for Hotel Details ----
//   const qsObj = {
//     source: "live",
//     provider: "goglobal",
//     arrivalDate: String(arrivalDate || ""),
//     nights: String(nights || 1),
//     cityId: String(cityId || ""),
//     rooms: String(canon.rooms || 1),
//     adults: canon.adultsCSV,
//     children: canon.childrenCSV,
//     ...(totalKids > 0
//       ? {
//           // for details page we can pass structured ages; if some are missing,
//           // details page itself (or API layer) will fill with 8 when calling supplier
//           childrenAges: canon.childrenAgesCSV,
//         }
//       : {}),
//     ...(criteria?.basis ? { basis: String(criteria.basis) } : {}),
//   };

//   // if (criteria?.basis) qsObj.basis = String(criteria.basis);

//   const qs = new URLSearchParams(qsObj).toString();

//   // ---- Snapshot in sessionStorage (CANON) ----
//   const handleClick = useCallback(() => {
//     try {
//       const snapshot = {
//         id: String(hotel?._id || hotel?.hotelId || hotelCode || ""),
//         source: "live",
//         provider: "goglobal",
//         criteria: {
//           arrivalDate,
//           nights,
//           cityId,
//           rooms: Number(canon.rooms || 1),
//           adultsCSV: canon.adultsCSV,
//           childrenCSV: canon.childrenCSV,
//           ...(totalKids > 0 ? { childrenAgesCSV: canon.childrenAgesCSV } : {}),
//         },
//         codes: { hotelCode },
//         marker: "fromListClick",
//         ts: Date.now(),
//       };
//       sessionStorage.setItem("lastHotelSnapshot", JSON.stringify(snapshot));
//     } catch {}
//   }, [
//     hotel?._id,
//     hotel?.hotelId,
//     hotelCode,
//     arrivalDate,
//     nights,
//     cityId,
//     canon.rooms,
//     canon.adultsCSV,
//     canon.childrenCSV,
//     canon.childrenAgesCSV,
//     totalKids,
//   ]);

//   const fmt = (iso) => {
//     if (!iso) return null;
//     try {
//       const d = new Date(iso);
//       if (Number.isNaN(+d)) return null;
//       return d.toLocaleDateString(undefined, {
//         year: "numeric",
//         month: "short",
//         day: "2-digit",
//       });
//     } catch {
//       return null;
//     }
//   };

//   // build compact room lines (first 2 + “+N more”)
//   const maxRoomLines = 2;
//   const extraRooms = Math.max(0, roomsCount - maxRoomLines);
//   const roomLines = roomNames.slice(0, maxRoomLines).map((name, i) => (
//     <div className={styles.roomLine} key={`${name}-${i}`}>
//       <span className={styles.roomIcon} aria-hidden>
//         🛏️
//       </span>
//       <span className={styles.roomIdx}>Room {i + 1}.</span>{" "}
//       <span className={styles.roomNameText}>{name}</span>
//     </div>
//   ));

//   const remarksText = useMemo(
//     () => htmlToText(min?.remarksHtml || ""),
//     [min?.remarksHtml]
//   );
//   const remarksShort =
//     remarksText && remarksText.length > 180
//       ? remarksText.slice(0, 180) + "…"
//       : remarksText;

//   return (
//     <div className={`${styles.card} ${viewType === "list" ? styles.row : ""}`}>
//       <div className={styles.thumb}>
//         <img src={imageSrc} alt={hotel?.name || "Hotel"} />
//       </div>

//       <div className={styles.main}>
//         <div className={styles.header}>
//           <h4 className={styles.title}>{hotel?.name}</h4>
//           <div className={styles.stars}>
//             {stars > 0 ? "⭐".repeat(stars) : "—"}
//           </div>
//         </div>

//         <div className={styles.meta}>
//           <span className={styles.location}>
//             {hotel?.location?.city}, {hotel?.location?.country}
//           </span>
//           {address && <span className={styles.address}>• {address}</span>}
//           {roomsCount > 1 && (
//             <span
//               className={styles.roomsBadge}
//               title={`${roomsCount} rooms included`}
//             >
//               {roomsCount} rooms
//             </span>
//           )}
//         </div>

//         <div className={styles.offerRow}>
//           <div className={styles.offerInfo}>
//             {/* multi-room breakdown */}
//             {roomsCount > 0 && (
//               <div className={styles.roomLines}>
//                 {roomLines}
//                 {extraRooms > 0 && (
//                   <div className={styles.roomMore} title={roomNames.join("\n")}>
//                     +{extraRooms} more
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* summary line */}
//             <div
//               className={`${styles.summaryLine} ${
//                 viewType === "list" ? styles.summaryList : ""
//               }`}
//             >
//               {board && <span className={styles.dotItem}>{board}</span>}
//               {!!nights && (
//                 <span className={styles.dotItem}>{nights} nights</span>
//               )}
//               {platCut && (
//                 <span className={styles.dotItem}>
//                   Free cancel until: <b>{fmt(platCut)}</b>
//                 </span>
//               )}
//               {isOps && suppCut && (
//                 <span className={styles.dotItem}>
//                   Supplier cutoff: <b>{fmt(suppCut)}</b>
//                 </span>
//               )}
//             </div>

//             {/* supplier remarks (short, plain) */}
//             {remarksShort && (
//               <div className={styles.remarks} title={remarksText}>
//                 <span className={styles.remarksIcon} aria-hidden>
//                   ℹ️{" "}
//                 </span>
//                 <span className={styles.remarksText}>{remarksShort}</span>
//               </div>
//             )}
//           </div>

//           <div className={styles.priceCol}>
//             <div className={styles.priceBox}>
//               <div className={styles.from}>From</div>
//               <div className={styles.price}>{priceLabel}</div>
//               <div className={styles.total}>total</div>
//             </div>

//             <div className={styles.actions}>
//               <Link
//                 prefetch={false}
//                 href={`/admin/bookings/hotel/${encodeURIComponent(
//                   hotel._id || hotelCode
//                 )}?${qs}`}
//                 className={styles.btn}
//                 onClick={handleClick}
//               >
//                 View details
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SupplierHotelCard;

// src/components/admin/SupplierHotelCard.jsx
"use client";
import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import styles from "@/styles/supplierHotelCard.module.css";
import { useAuthStore } from "@/stores/authStore";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
import { formatMoney } from "@/utils/formatMoney";

// Canonical children helpers (supplier-ready: rooms by '|' and ages by ',')
import {
  computeAgesCSV, // build canonical ages CSV from (childrenCSV, input ages)
  normalizeChildrenCSV, // normalize children to CSV
  ROOMS_SEP,
  AGES_SEP,
} from "@/utils/childrenCsv";

/* ---------------- helpers ---------------- */
function toNights(checkIn, checkOut, fallback = 1) {
  try {
    if (checkIn && checkOut) {
      const a = new Date(checkIn);
      const b = new Date(checkOut);
      if (!isNaN(+a) && !isNaN(+b)) {
        const ms = b - a;
        return Math.max(1, Math.round(ms / 86400000));
      }
    }
  } catch {}
  return Math.max(1, Number(fallback) || 1);
}

// very small sanitizer → plain text preview
function htmlToText(html = "") {
  const s = String(html || "");
  if (!s) return "";
  return s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitCSV(s = "") {
  return String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

/* ---------------- component ---------------- */
const SupplierHotelCard = ({ hotel, viewType, criteria }) => {
  const imageSrc =
    hotel?.images?.find((x) => x?.isMain)?.url ||
    hotel?.images?.[0]?.url ||
    hotel?.thumbnail ||
    "/placeholder.jpg";

  const stars = Number(hotel?.stars ?? hotel?.category ?? 0);

  // --- min/preview offer ---
  const min = hotel?.minOffer || {};
  const board = min?.board || null;

  // --- PRICE (FIX): prefer normalized display fields from SupplierResultsView ---
  const amount =
    hotel?._displayTotal ??
    hotel?.minRetail?.amount ??
    min?.retail?.amount ??
    hotel?.minPrice?.amount ??
    min?.price?.amount ??
    min?.amount ??
    null;

  const currencyCode =
    hotel?._displayCurrency ||
    hotel?.minRetail?.currency ||
    min?.retail?.currency ||
    hotel?.minPrice?.currency ||
    min?.price?.currency ||
    min?.currency ||
    "";

  const priceLabel =
    amount != null
      ? formatMoney(amount, String(currencyCode || "").toUpperCase())
      : "—";

  // multi-room support (UI)
  const roomNames = useMemo(() => {
    if (Array.isArray(min?.roomNames) && min.roomNames.length)
      return min.roomNames;
    if (min?.roomName) return [min.roomName];
    return [];
  }, [min]);
  const roomsCountFromOffer = Number(min?.roomsCount || roomNames.length || 0);

  // cutoff helpers — use only offer-level values (avoid hotel-level fallbacks)
  const platCut =
    min?.cancellation?.platform?.cutoffUtc ||
    min?.cancellation?.platformCutoffUtc ||
    null;

  const suppCut =
    min?.cancellation?.supplier?.deadlineUtc ||
    min?.cancellation?.supplierDeadlineUtc ||
    null;

  const rawAddr = hotel?.location?.address;
  const infoAddr = hotel?.hotelInfo?.hotel?.address || hotel?.address;
  const address = rawAddr && rawAddr !== "N/A" ? rawAddr : infoAddr || null;

  const role = useAuthStore((s) => s.user?.role);
  const isOps = ["admin", "office_user", "finance_user", "finance"].includes(
    String(role || "").toLowerCase()
  );

  const hotelCode =
    hotel?.externalSource?.hotelCode ||
    hotel?.hotelCode ||
    hotel?._id ||
    hotel?.HotelCode ||
    hotel?.code ||
    "";

  const cityIdFromHotel =
    hotel?.externalSource?.cityId ||
    hotel?.cityId ||
    hotel?.location?.cityId ||
    "";

  // criteria fallbacks (from stores)
  const checkInFromStore = useSearchCriteriaStore((s) => s.checkInDate);
  const checkOutFromStore = useSearchCriteriaStore((s) => s.checkOutDate);
  const cityCodeFromStore = useSearchCriteriaStore((s) => s.cityCode);
  const adultsFromStore = useSearchCriteriaStore((s) => s.adults);
  const childrenFromStore = useSearchCriteriaStore((s) => s.children);
  const agesFromStore = useSearchCriteriaStore((s) => s.childrenAges);

  const arrivalDate = criteria?.arrivalDate || checkInFromStore || "";
  const nights =
    criteria?.nights ??
    toNights(
      criteria?.arrivalDate || checkInFromStore,
      criteria?.checkOutDate || checkOutFromStore,
      1
    );
  const cityId = criteria?.cityId || cityCodeFromStore || cityIdFromHotel || "";

  /* ---------- Canonical occupancy CSVs (authoritative) ---------- */
  // adultsCSV: accept string (csv) or number; normalize to csv
  const adultsCSV = useMemo(() => {
    if (typeof criteria?.adults === "string") return criteria.adults;
    if (typeof criteria?.adultsCSV === "string") return criteria.adultsCSV;
    if (typeof adultsFromStore === "string") return adultsFromStore;
    return String(criteria?.adults ?? adultsFromStore ?? 2);
  }, [criteria?.adults, criteria?.adultsCSV, adultsFromStore]);

  // rooms: explicit -> else infer from adultsCSV segments
  const roomsParam = useMemo(() => {
    if (Number(criteria?.rooms)) return Number(criteria.rooms);
    return adultsCSV.includes(",") ? adultsCSV.split(",").length : 1;
  }, [criteria?.rooms, adultsCSV]);

  // childrenCSV: accept csv or number; normalize to csv
  const childrenCSV = useMemo(() => {
    if (typeof criteria?.children === "string") return criteria.children;
    if (typeof criteria?.childrenCSV === "string") return criteria.childrenCSV;
    if (typeof childrenFromStore === "string") return childrenFromStore;
    return normalizeChildrenCSV(criteria?.children ?? childrenFromStore ?? 0);
  }, [criteria?.children, criteria?.childrenCSV, childrenFromStore]);

  // Canonical childrenAgesCSV (rooms by '|' , ages by ',')
  const childrenAgesCSV = useMemo(() => {
    // Prefer string input from criteria
    const input =
      typeof criteria?.childrenAges === "string"
        ? criteria.childrenAges
        : Array.isArray(agesFromStore)
        ? agesFromStore.join(AGES_SEP) // legacy flat -> let computeAgesCSV shape it
        : "";

    // computeAgesCSV(childrenCSV, input) will:
    //  - sanitize ages
    //  - distribute flat ages by per-room counts
    //  - pad missing with default 8 (but will NOT override provided values)
    return computeAgesCSV(childrenCSV, input);
  }, [criteria?.childrenAges, childrenCSV, agesFromStore]);

  // Totals for UI chips
  const totals = useMemo(() => {
    const totalAdults = splitCSV(adultsCSV).reduce(
      (s, x) => s + (Number(x) || 0),
      0
    );
    const totalChildren = splitCSV(childrenCSV).reduce(
      (s, x) => s + (Number(x) || 0),
      0
    );
    return { adults: totalAdults, children: totalChildren };
  }, [adultsCSV, childrenCSV]);

  // Price/date format helper
  const fmt = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (Number.isNaN(+d)) return null;
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return null;
    }
  };

  // ---- Build query string for Hotel Details ----
  const qsObj = useMemo(() => {
    const base = {
      source: "live",
      provider: "goglobal",
      arrivalDate: String(arrivalDate || ""),
      nights: String(nights || 1),
      cityId: String(cityId || ""),
      rooms: String(roomsParam || 1),
      adults: adultsCSV,
      children: childrenCSV,
    };
    const tc = totals.children;
    if (tc > 0) base.childrenAges = childrenAgesCSV;
    if (criteria?.basis) base.basis = String(criteria.basis || "");
    return base;
  }, [
    arrivalDate,
    nights,
    cityId,
    roomsParam,
    adultsCSV,
    childrenCSV,
    childrenAgesCSV,
    totals.children,
    criteria?.basis,
  ]);

  const qs = useMemo(() => new URLSearchParams(qsObj).toString(), [qsObj]);

  // ---- Snapshot in sessionStorage ----
  const handleClick = useCallback(() => {
    try {
      const snapshot = {
        id: String(hotel?._id || hotel?.hotelId || hotelCode || ""),
        source: "live",
        provider: "goglobal",
        criteria: {
          arrivalDate,
          nights,
          cityId,
          rooms: Number(roomsParam || 1),
          adultsCSV,
          childrenCSV,
          ...(totals.children > 0 ? { childrenAgesCSV } : {}),
        },
        codes: { hotelCode },
        marker: "fromListClick",
        ts: Date.now(),
      };

      // same href as the <Link/> below
      const href = `/admin/bookings/hotel/${encodeURIComponent(
        hotel?._id || hotelCode
      )}?${qs}`;

      // 🔎 DEBUG
      console.groupCollapsed("[NAV] → View details payload");
      console.log("Hotel:", hotel?.name, hotel?._id || hotelCode);
      console.table({
        rooms: Number(qsObj.rooms),
        adultsCSV: qsObj.adults,
        childrenCSV: qsObj.children,
        childrenAgesCSV: qsObj.childrenAges || "",
        arrivalDate: qsObj.arrivalDate,
        nights: qsObj.nights,
        cityId: qsObj.cityId,
        basis: qsObj.basis || "",
      });
      console.log("Full href:", href);
      console.log("Snapshot.criteria:", snapshot.criteria);
      console.groupEnd();

      sessionStorage.setItem("lastHotelSnapshot", JSON.stringify(snapshot));
    } catch (e) {
      console.warn("[NAV] snapshot save failed:", e);
    }
  }, [
    hotel?._id,
    hotel?.hotelId,
    hotelCode,
    arrivalDate,
    nights,
    cityId,
    roomsParam,
    adultsCSV,
    childrenCSV,
    childrenAgesCSV,
    totals.children,
    qs,
    qsObj,
  ]);

  // build compact room lines (first 2 + “+N more”)
  const maxRoomLines = 2;
  const roomLines = (Array.isArray(roomNames) ? roomNames : []).slice(
    0,
    maxRoomLines
  );
  const extraRooms = Math.max(
    0,
    (roomsCountFromOffer || roomLines.length) - maxRoomLines
  );
  const roomLinesEls = roomLines.map((name, i) => (
    <div className={styles.roomLine} key={`${name}-${i}`}>
      <span className={styles.roomIcon} aria-hidden>
        🛏️
      </span>
      <span className={styles.roomIdx}>Room {i + 1}.</span>{" "}
      <span className={styles.roomNameText}>{name}</span>
    </div>
  ));

  const remarksText = useMemo(
    () => htmlToText(min?.remarksHtml || ""),
    [min?.remarksHtml]
  );
  const remarksShort =
    remarksText && remarksText.length > 180
      ? remarksText.slice(0, 180) + "…"
      : remarksText;

  return (
    <div className={`${styles.card} ${viewType === "list" ? styles.row : ""}`}>
      <div className={styles.thumb}>
        <img src={imageSrc} alt={hotel?.name || "Hotel"} />
      </div>

      <div className={styles.main}>
        <div className={styles.header}>
          <h4 className={styles.title}>{hotel?.name}</h4>
          <div className={styles.stars}>
            {stars > 0 ? "⭐".repeat(stars) : "—"}
          </div>
        </div>

        <div className={styles.meta}>
          <span className={styles.location}>
            {hotel?.location?.city}, {hotel?.location?.country}
          </span>
          {address && <span className={styles.address}>• {address}</span>}
          {roomsCountFromOffer > 1 && (
            <span
              className={styles.roomsBadge}
              title={`${roomsCountFromOffer} rooms included`}
            >
              {roomsCountFromOffer} rooms
            </span>
          )}
        </div>

        <div className={styles.offerRow}>
          <div className={styles.offerInfo}>
            {/* multi-room breakdown */}
            {roomsCountFromOffer > 0 && (
              <div className={styles.roomLines}>
                {roomLinesEls}
                {extraRooms > 0 && (
                  <div className={styles.roomMore} title={roomNames.join("\n")}>
                    +{extraRooms} more
                  </div>
                )}
              </div>
            )}

            {/* summary line */}
            <div
              className={`${styles.summaryLine} ${
                viewType === "list" ? styles.summaryList : ""
              }`}
            >
              {board && <span className={styles.dotItem}>{board}</span>}
              {!!nights && (
                <span className={styles.dotItem}>{nights} nights</span>
              )}
              {platCut && (
                <span className={styles.dotItem}>
                  Free cancel until: <b>{fmt(platCut)}</b>
                </span>
              )}
              {isOps && suppCut && (
                <span className={styles.dotItem}>
                  Supplier cutoff: <b>{fmt(suppCut)}</b>
                </span>
              )}
            </div>

            {/* supplier remarks (short, plain) */}
            {remarksShort && (
              <div className={styles.remarks} title={remarksText}>
                <span className={styles.remarksIcon} aria-hidden>
                  ℹ️{" "}
                </span>
                <span className={styles.remarksText}>{remarksShort}</span>
              </div>
            )}
          </div>
          <div className={styles.priceCol}>
            <div className={styles.priceBox}>
              <div className={styles.from}>From</div>
              <div className={styles.price}>{priceLabel}</div>
              <div className={styles.total}>total</div>
            </div>

            <div className={styles.actions}>
              <Link
                prefetch={false}
                href={`/admin/bookings/hotel/${encodeURIComponent(
                  hotel._id || hotelCode
                )}?${qs}`}
                className={styles.btn}
                onClick={handleClick}
              >
                View details
              </Link>
            </div>
          </div>
        </div>

        {/* chips line (optional, shows the currently applied pax summary) */}
        <div className={styles.meta} style={{ marginTop: 6 }}>
          <span className={styles.location}>
            👥 {totals.adults} adults
            {totals.children > 0 ? ` • ${totals.children} children` : ""}
            {" • "}
            🛏️ {roomsParam} room{roomsParam > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SupplierHotelCard;
