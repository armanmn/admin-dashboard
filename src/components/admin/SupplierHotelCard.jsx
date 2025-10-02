// // New
// // src/components/admin/SupplierHotelCard.jsx
// "use client";
// import React, { useCallback, useMemo } from "react";
// import Link from "next/link";
// import styles from "@/styles/supplierHotelCard.module.css";
// import { useAuthStore } from "@/stores/authStore";
// import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
// import { formatMoney } from "@/utils/formatMoney";

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

// function splitCSV(s = "") {
//   return String(s)
//     .split(",")
//     .map((x) => x.trim())
//     .filter(Boolean);
// }

// // Build ages with room segmentation: childrenCSV="1,2", flatOrCsv="5,9,11" -> "5|9,11"
// function buildAgesByRooms(childrenCSV = "", flatOrCsv = "") {
//   const val = String(flatOrCsv || "").trim();
//   if (!val) return "";

//   // if already "pipe" format, trust it
//   if (val.includes("|")) return val;

//   const perRoomCounts = splitCSV(childrenCSV).map((n) => Number(n) || 0);
//   if (!perRoomCounts.length) return "";

//   const flat = splitCSV(val); // "5,9,11"
//   const totalKids = perRoomCounts.reduce((a, b) => a + b, 0);
//   if (flat.length !== totalKids) return "";

//   let i = 0;
//   const byRoom = perRoomCounts.map((cnt) => {
//     const chunk = flat.slice(i, i + cnt);
//     i += cnt;
//     return chunk.join(",");
//   });
//   return byRoom.join("|"); // "5|9,11"
// }

// // Create default ages only as a last resort: "1,2" -> "8|8,8"
// function makeDefaultAgesCSV(childrenCSV = "", defAge = 8) {
//   return splitCSV(childrenCSV)
//     .map((cnt) => {
//       const n = Number(cnt) || 0;
//       return Array(n).fill(defAge).join(",");
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

//   // --- price preview (prefer RETAIL) ---
//   const displayAmount =
//     hotel?.minRetail?.amount ??
//     min?.retail?.amount ??
//     hotel?.minPrice?.amount ??
//     min?.price?.amount ??
//     min?.amount ??
//     null;

//   const displayCurrency =
//     hotel?.minRetail?.currency ||
//     min?.retail?.currency ||
//     hotel?.minPrice?.currency ||
//     min?.price?.currency ||
//     min?.currency ||
//     "";

//   // multi-room support (UI)
//   const roomNames = useMemo(() => {
//     if (Array.isArray(min?.roomNames) && min.roomNames.length) return min.roomNames;
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

//   // criteria fallbacks (from stores)
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

//   // ---- Pax params (prefer CSV from criteria when available) ----
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

//   // derive rooms from explicit criteria.rooms OR from adultsCSV segments
//   const roomsParam =
//     Number(criteria?.rooms) ||
//     (adultsCSV.includes(",") ? adultsCSV.split(",").length : undefined) ||
//     1;

//   // ---- Ages (room-aware). Try several sources; only as last resort generate defaults.
//   const perRoomCounts = useMemo(
//     () => splitCSV(childrenCSV).map((n) => Number(n) || 0),
//     [childrenCSV]
//   );
//   const totalKids = perRoomCounts.reduce((a, b) => a + b, 0);

//   let childrenAgesCSV =
//     (typeof criteria?.childrenAgesCSV === "string" && criteria.childrenAgesCSV) ||
//     (typeof criteria?.childrenAges === "string" &&
//       (criteria.childrenAges.includes("|")
//         ? criteria.childrenAges
//         : buildAgesByRooms(childrenCSV, criteria.childrenAges))) ||
//     (Array.isArray(criteria?.childrenAges) &&
//       (Array.isArray(criteria.childrenAges[0]) // [[...],[...]]
//         ? criteria.childrenAges.map((r) => r.join(",")).join("|")
//         : buildAgesByRooms(childrenCSV, criteria.childrenAges.join(",")))) ||
//     (typeof agesFromStore === "string" &&
//       (agesFromStore.includes("|")
//         ? agesFromStore
//         : buildAgesByRooms(childrenCSV, agesFromStore))) ||
//     (Array.isArray(agesFromStore) &&
//       (Array.isArray(agesFromStore[0])
//         ? agesFromStore.map((r) => r.join(",")).join("|")
//         : buildAgesByRooms(childrenCSV, agesFromStore.join(",")))) ||
//     "";

//   if (!childrenAgesCSV && totalKids > 0) {
//     // fallback only if kids exist but no ages available anywhere
//     childrenAgesCSV = makeDefaultAgesCSV(childrenCSV, 8);
//   }

//   // ---- Build query string for Hotel Details ----
//   const qsObj = {
//     source: "live",
//     provider: "goglobal",
//     arrivalDate: String(arrivalDate || ""),
//     nights: String(nights || 1),
//     cityId: String(cityId || ""),
//     rooms: String(roomsParam || 1),
//     adults: adultsCSV,
//     children: childrenCSV,
//     ...(totalKids > 0 ? { childrenAges: childrenAgesCSV } : {}),
//   };

//   const qs = new URLSearchParams(qsObj).toString();

//   // ---- Snapshot in sessionStorage ----
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
//           rooms: Number(roomsParam || 1),
//           adultsCSV,
//           childrenCSV,
//           ...(totalKids > 0 ? { childrenAgesCSV } : {}),
//         },
//         codes: { hotelCode },
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
//     roomsParam,
//     adultsCSV,
//     childrenCSV,
//     childrenAgesCSV,
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
//       <span className={styles.roomIcon} aria-hidden>🛏️</span>
//       <span className={styles.roomIdx}>Room {i + 1}.</span>{" "}
//       <span className={styles.roomNameText}>{name}</span>
//     </div>
//   ));

//   const remarksText = useMemo(() => htmlToText(min?.remarksHtml || ""), [min?.remarksHtml]);
//   const remarksShort =
//     remarksText && remarksText.length > 180 ? remarksText.slice(0, 180) + "…" : remarksText;

//   return (
//     <div className={`${styles.card} ${viewType === "list" ? styles.row : ""}`}>
//       <div className={styles.thumb}>
//         <img src={imageSrc} alt={hotel?.name || "Hotel"} />
//       </div>

//       <div className={styles.main}>
//         <div className={styles.header}>
//           <h4 className={styles.title}>{hotel?.name}</h4>
//           <div className={styles.stars}>{stars > 0 ? "⭐".repeat(stars) : "—"}</div>
//         </div>

//         <div className={styles.meta}>
//           <span className={styles.location}>
//             {hotel?.location?.city}, {hotel?.location?.country}
//           </span>
//           {address && <span className={styles.address}>• {address}</span>}
//           {roomsCount > 1 && (
//             <span className={styles.roomsBadge} title={`${roomsCount} rooms included`}>
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
//               {!!nights && <span className={styles.dotItem}>{nights} nights</span>}
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
//                 <span className={styles.remarksIcon} aria-hidden>ℹ️ </span>
//                 <span className={styles.remarksText}>{remarksShort}</span>
//               </div>
//             )}
//           </div>

//           <div className={styles.priceBox}>
//             <div className={styles.from}>From</div>
//             <div className={styles.price}>
//               {displayAmount != null ? formatMoney(displayAmount, displayCurrency) : "—"}
//             </div>
//             <div className={styles.total}>total</div>
//           </div>
//         </div>

//         <div className={styles.actions}>
//           <Link
//             prefetch={false}
//             href={`/admin/bookings/hotel/${encodeURIComponent(
//               hotel._id || hotelCode
//             )}?${qs}`}
//             className={styles.btn}
//             onClick={handleClick}
//           >
//             View details
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SupplierHotelCard;

// New
// src/components/admin/SupplierHotelCard.jsx
"use client";
import React, { useCallback, useMemo } from "react";
import Link from "next/link";
import styles from "@/styles/supplierHotelCard.module.css";
import { useAuthStore } from "@/stores/authStore";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
import { formatMoney } from "@/utils/formatMoney";

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

// Build ages with room segmentation: childrenCSV="1,2", flatOrCsv="5,9,11" -> "5|9,11"
function buildAgesByRooms(childrenCSV = "", flatOrCsv = "") {
  const val = String(flatOrCsv || "").trim();
  if (!val) return "";

  // if already "pipe" format, trust it
  if (val.includes("|")) return val;

  const perRoomCounts = splitCSV(childrenCSV).map((n) => Number(n) || 0);
  if (!perRoomCounts.length) return "";

  const flat = splitCSV(val); // "5,9,11"
  const totalKids = perRoomCounts.reduce((a, b) => a + b, 0);
  if (flat.length !== totalKids) return "";

  let i = 0;
  const byRoom = perRoomCounts.map((cnt) => {
    const chunk = flat.slice(i, i + cnt);
    i += cnt;
    return chunk.join(",");
  });
  return byRoom.join("|"); // "5|9,11"
}

// Create default ages only as a last resort: "1,2" -> "8|8,8"
function makeDefaultAgesCSV(childrenCSV = "", defAge = 8) {
  return splitCSV(childrenCSV)
    .map((cnt) => {
      const n = Number(cnt) || 0;
      return Array(n).fill(defAge).join(",");
    })
    .join("|");
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
  // If _display* exist (already converted to selected currency), use them.
  // Otherwise fall back to supplier's raw values.
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
  const roomsCount = Number(min?.roomsCount || roomNames.length || 0);

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

  // ---- Pax params (prefer CSV from criteria when available) ----
  const adultsCSV =
    (typeof criteria?.adultsCSV === "string" && criteria.adultsCSV) ||
    (typeof criteria?.adults === "string" && criteria.adults) ||
    (typeof adultsFromStore === "string" && adultsFromStore) ||
    String(criteria?.adults ?? adultsFromStore ?? 2);

  const childrenCSV =
    (typeof criteria?.childrenCSV === "string" && criteria.childrenCSV) ||
    (typeof criteria?.children === "string" && criteria.children) ||
    (typeof childrenFromStore === "string" && childrenFromStore) ||
    String(criteria?.children ?? childrenFromStore ?? 0);

  // derive rooms from explicit criteria.rooms OR from adultsCSV segments
  const roomsParam =
    Number(criteria?.rooms) ||
    (adultsCSV.includes(",") ? adultsCSV.split(",").length : undefined) ||
    1;

  // ---- Ages (room-aware). Try several sources; only as last resort generate defaults.
  const perRoomCounts = useMemo(
    () => splitCSV(childrenCSV).map((n) => Number(n) || 0),
    [childrenCSV]
  );
  const totalKids = perRoomCounts.reduce((a, b) => a + b, 0);

  let childrenAgesCSV =
    (typeof criteria?.childrenAgesCSV === "string" &&
      criteria.childrenAgesCSV) ||
    (typeof criteria?.childrenAges === "string" &&
      (criteria.childrenAges.includes("|")
        ? criteria.childrenAges
        : buildAgesByRooms(childrenCSV, criteria.childrenAges))) ||
    (Array.isArray(criteria?.childrenAges) &&
      (Array.isArray(criteria.childrenAges[0]) // [[...],[...]]
        ? criteria.childrenAges.map((r) => r.join(",")).join("|")
        : buildAgesByRooms(childrenCSV, criteria.childrenAges.join(",")))) ||
    (typeof agesFromStore === "string" &&
      (agesFromStore.includes("|")
        ? agesFromStore
        : buildAgesByRooms(childrenCSV, agesFromStore))) ||
    (Array.isArray(agesFromStore) &&
      (Array.isArray(agesFromStore[0])
        ? agesFromStore.map((r) => r.join(",")).join("|")
        : buildAgesByRooms(childrenCSV, agesFromStore.join(",")))) ||
    "";

  if (!childrenAgesCSV && totalKids > 0) {
    // fallback only if kids exist but no ages available anywhere
    childrenAgesCSV = makeDefaultAgesCSV(childrenCSV, 8);
  }

  // ---- Build query string for Hotel Details ----
  const qsObj = {
    source: "live",
    provider: "goglobal",
    arrivalDate: String(arrivalDate || ""),
    nights: String(nights || 1),
    cityId: String(cityId || ""),
    rooms: String(roomsParam || 1),
    adults: adultsCSV,
    children: childrenCSV,
    ...(totalKids > 0 ? { childrenAges: childrenAgesCSV } : {}),
  };

  const qs = new URLSearchParams(qsObj).toString();

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
          ...(totalKids > 0 ? { childrenAgesCSV } : {}),
        },
        codes: { hotelCode },
      };
      sessionStorage.setItem("lastHotelSnapshot", JSON.stringify(snapshot));
    } catch {}
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
    totalKids,
  ]);

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

  // build compact room lines (first 2 + “+N more”)
  const maxRoomLines = 2;
  const extraRooms = Math.max(0, roomsCount - maxRoomLines);
  const roomLines = roomNames.slice(0, maxRoomLines).map((name, i) => (
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
          {roomsCount > 1 && (
            <span
              className={styles.roomsBadge}
              title={`${roomsCount} rooms included`}
            >
              {roomsCount} rooms
            </span>
          )}
        </div>

        <div className={styles.offerRow}>
          <div className={styles.offerInfo}>
            {/* multi-room breakdown */}
            {roomsCount > 0 && (
              <div className={styles.roomLines}>
                {roomLines}
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
      </div>
    </div>
  );
};

export default SupplierHotelCard;
