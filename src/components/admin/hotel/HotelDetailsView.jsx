// // src/components/admin/hotel/HotelDetailsView.jsx
// "use client";
// import React, { useEffect, useMemo, useState, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import styles from "@/styles/HotelDetailsView.module.css";
// import HotelInfo from "@/components/admin/hotel/HotelInfo";
// import OffersList from "@/components/admin/hotel/OffersList";
// import SelectionSummary from "@/components/admin/hotel/SelectionSummary";
// import { useSelectionStore } from "@/stores/selectionStore";
// import api from "@/utils/api";

// /** ——— helpers ——— */
// function getSnap() {
//   try {
//     return JSON.parse(sessionStorage.getItem("lastHotelSnapshot") || "null");
//   } catch {
//     return null;
//   }
// }
// function getSearchParams() {
//   try {
//     return new URLSearchParams(window.location.search);
//   } catch {
//     return new URLSearchParams();
//   }
// }
// function getHotelIdFromUrl() {
//   try {
//     const p = window.location.pathname || "";
//     const m = p.match(/\/hotel\/([^/?#]+)/i);
//     return m?.[1] || null;
//   } catch {
//     return null;
//   }
// }
// /** date util */
// function addDaysIso(iso, days) {
//   if (!iso) return null;
//   const d = new Date(iso);
//   if (Number.isNaN(+d)) return null;
//   d.setDate(d.getDate() + Number(days || 0));
//   return d.toISOString().slice(0, 10);
// }
// const sumCsv = (csv) =>
//   String(csv || "")
//     .split(",")
//     .reduce((s, x) => s + (Number(x) || 0), 0);

// /** --- CSV utils --- */
// function splitGroupsFromAgesCSV(agesCSV) {
//   const s = String(agesCSV || "").trim();
//   if (!s) return [];
//   return s.split("|").map((g) =>
//     g
//       .split(",")
//       .map((x) => x.trim())
//       .filter(Boolean)
//   );
// }
// function detectRooms(adultsCSV, childrenCSV, agesCSV, fallbackRooms) {
//   const aParts = String(adultsCSV || "").trim()
//     ? String(adultsCSV).split(",")
//     : [];
//   const cParts = String(childrenCSV || "").trim()
//     ? String(childrenCSV).split(",")
//     : [];
//   const ageGroups = splitGroupsFromAgesCSV(agesCSV);
//   const candidates = [
//     Number(fallbackRooms || 0),
//     aParts.length || 0,
//     cParts.length || 0,
//     ageGroups.length || 0,
//   ].filter(Boolean);
//   const R = Math.max(1, ...(candidates.length ? candidates : [1]));
//   return R;
// }
// function normalizeAdultsCSV(adultsCSV, rooms) {
//   const R = Math.max(1, Number(rooms || 1));
//   const parts = String(adultsCSV || "")
//     .split(",")
//     .map((x) => Math.max(1, Number(x) || 1));
//   const out = Array.from({ length: R }, (_, i) => parts[i] ?? parts[0] ?? 2);
//   return out.join(",");
// }
// function normalizeChildrenCSV(childrenCSV, rooms) {
//   const R = Math.max(1, Number(rooms || 1));
//   const parts = String(childrenCSV || "")
//     .split(",")
//     .map((x) => Math.max(0, Number(x) || 0));
//   const out = Array.from({ length: R }, (_, i) => parts[i] ?? 0);
//   return out.join(",");
// }
// function childrenCountsFromAges(agesCSV, rooms) {
//   const groups = splitGroupsFromAgesCSV(agesCSV);
//   const R = Math.max(1, Number(rooms || groups.length || 1));
//   // pad / trim
//   while (groups.length < R) groups.push([]);
//   if (groups.length > R) groups.length = R;
//   return groups.map((g) => g.length);
// }

// /** --- Debug helpers --- */
// const parseCounts = (csv) =>
//   String(csv || "")
//     .split(",")
//     .map((x) => Number(x) || 0);

// const parseAgesPerRoom = (agesCsv) =>
//   String(agesCsv || "")
//     .split("|")
//     .map((room) =>
//       String(room || "")
//         .split(",")
//         .filter(Boolean)
//         .map((a) => Number(a))
//         .filter((n) => Number.isFinite(n))
//     );

// function shapeOK(childrenCSV, childrenAgesCSV) {
//   const counts = parseCounts(childrenCSV);
//   const ages = parseAgesPerRoom(childrenAgesCSV);
//   if (!counts.length && !ages.length) return true;
//   if (counts.length !== ages.length) return false;
//   for (let i = 0; i < counts.length; i++) {
//     if ((ages[i]?.length || 0) !== (counts[i] || 0)) return false;
//   }
//   return true;
// }

// export default function HotelDetailsView(props) {
//   // ------- props (backup / UI wiring) -------
//   const {
//     hotel: hotelProp,
//     offers: offersProp = [],
//     offersPreview: offersPreviewProp = [],
//     arrivalDate: arrivalDateProp,
//     checkOutDate: checkOutDateProp,
//     nights: nightsProp,
//     adults: adultsProp,
//     children: childrenProp,
//     rooms: roomsProp,
//     userCurrency,
//     role,
//     user,
//     exchangeRates,
//     settings,
//     onBack, // if provided
//     onCheckAvailability,
//     fullAddress,
//     areaLabel,
//     aboutText,
//     facilities = [],
//     distances = [],
//     heroPhotos = [],
//     totalPhotoCount = 0,
//   } = props;

//   const router = useRouter();

//   // ------- read URL + snapshot -------
//   const sp = useMemo(() => getSearchParams(), []);
//   const qsMap = useMemo(() => Object.fromEntries(sp.entries()), [sp]);
//   const snap = useMemo(() => getSnap(), []);
//   const hotelId =
//     hotelProp?.hotelId ||
//     hotelProp?._id ||
//     qsMap.hotelId ||
//     getHotelIdFromUrl();

//   // criteria (URL → snapshot → props → defaults)
//   const arrivalDate =
//     qsMap.arrivalDate || snap?.criteria?.arrivalDate || arrivalDateProp || "";
//   const nights = Number(
//     qsMap.nights || snap?.criteria?.nights || nightsProp || 1
//   );
//   const roomsInitial = Number(
//     qsMap.rooms || snap?.criteria?.rooms || roomsProp || 1
//   );

//   const adultsCSVRaw =
//     qsMap.adults ||
//     snap?.criteria?.adultsCSV ||
//     (typeof adultsProp === "string" ? adultsProp : String(adultsProp || "2"));

//   const childrenCSVRaw =
//     qsMap.children ||
//     snap?.criteria?.childrenCSV ||
//     (typeof childrenProp === "string"
//       ? childrenProp
//       : String(childrenProp || "0"));

//   const childrenAgesCSVRaw =
//     qsMap.childrenAges || snap?.criteria?.childrenAgesCSV || "";

//   const cityId =
//     qsMap.cityId ||
//     snap?.criteria?.cityId ||
//     hotelProp?.externalSource?.cityId ||
//     "";

//   // optional
//   const filterBasis = qsMap.filterBasis || "";
//   const offerProofQ = qsMap.offerProof || "";
//   const searchCodeQ = qsMap.searchCode || "";

//   // --- Canonical guests/rooms ---
//   const {
//     canonRooms,
//     canonAdultsCSV,
//     canonChildrenCSV,
//     canonChildrenAgesCSV,
//     kidsOk,
//   } = useMemo(() => {
//     // detect rooms from any signal we have
//     const Rdetected = detectRooms(
//       adultsCSVRaw,
//       childrenCSVRaw,
//       childrenAgesCSVRaw,
//       roomsInitial
//     );

//     // if ages present → children counts come from ages; else normalize CSV by rooms
//     let childrenCSV = childrenCSVRaw;
//     if (String(childrenAgesCSVRaw || "").trim()) {
//       childrenCSV = childrenCountsFromAges(childrenAgesCSVRaw, Rdetected).join(
//         ","
//       );
//     } else {
//       childrenCSV = normalizeChildrenCSV(childrenCSVRaw, Rdetected);
//     }

//     const adultsCSV = normalizeAdultsCSV(adultsCSVRaw, Rdetected);
//     const agesCSV = String(childrenAgesCSVRaw || "");
//     const ok = shapeOK(childrenCSV, agesCSV);

//     return {
//       canonRooms: Rdetected,
//       canonAdultsCSV: adultsCSV,
//       canonChildrenCSV: childrenCSV,
//       canonChildrenAgesCSV: agesCSV,
//       kidsOk: ok,
//     };
//   }, [adultsCSVRaw, childrenCSVRaw, childrenAgesCSVRaw, roomsInitial]);

//   // ---------------- ARRIVE DEBUG ----------------
//   useEffect(() => {
//     console.groupCollapsed("[HD] ARRIVE → inputs & canonical");
//     console.log("URL qs:", qsMap);
//     console.log("Snapshot:", snap);
//     console.table({
//       roomsInitial,
//       adultsCSVRaw,
//       childrenCSVRaw,
//       childrenAgesCSVRaw,
//       arrivalDate,
//       nights,
//       cityId,
//     });
//     console.table({
//       canonRooms,
//       canonAdultsCSV,
//       canonChildrenCSV,
//       canonChildrenAgesCSV,
//       kidsOk,
//     });
//     console.groupEnd();
//   }, [
//     qsMap,
//     snap,
//     roomsInitial,
//     adultsCSVRaw,
//     childrenCSVRaw,
//     childrenAgesCSVRaw,
//     arrivalDate,
//     nights,
//     cityId,
//     canonRooms,
//     canonAdultsCSV,
//     canonChildrenCSV,
//     canonChildrenAgesCSV,
//     kidsOk,
//   ]);

//   // ---- build request QS for live fetch ----
//   const reqQs = useMemo(() => {
//     const base = new URLSearchParams({
//       cityId: String(cityId || ""),
//       hotelId: String(hotelId || ""),
//       arrivalDate: String(arrivalDate || ""),
//       nights: String(nights || 1),
//       rooms: String(canonRooms || 1),
//       adults: String(canonAdultsCSV || "2"),
//       children: String(canonChildrenCSV || "0"),
//     });
//     if (canonChildrenAgesCSV) base.set("childrenAges", canonChildrenAgesCSV);
//     if (filterBasis) base.set("filterBasis", filterBasis);
//     if (offerProofQ) base.set("offerProof", offerProofQ);
//     if (searchCodeQ) base.set("searchCode", searchCodeQ);
//     return base;
//   }, [
//     cityId,
//     hotelId,
//     arrivalDate,
//     nights,
//     canonRooms,
//     canonAdultsCSV,
//     canonChildrenCSV,
//     canonChildrenAgesCSV,
//     filterBasis,
//     offerProofQ,
//     searchCodeQ,
//   ]);

//   // ------- live fetch /hotel-availability -------
//   const [live, setLive] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let ignore = false;
//     setLoading(true);
//     const ac = new AbortController();

//     const url = `/suppliers/goglobal/hotel-availability?${reqQs.toString()}`;
//     console.groupCollapsed("[HD] FETCH → hotel-availability");
//     console.log("GET:", url);
//     console.groupEnd();

//     api
//       .get(url, { signal: ac.signal })
//       .then(({ data }) => {
//         if (!ignore) setLive(data);
//       })
//       .catch((e) => {
//         if (!ignore) setLive(null);
//         console.warn("[HD] fetch error:", e);
//       })
//       .finally(() => {
//         if (!ignore) setLoading(false);
//       });

//     return () => {
//       ignore = true;
//       ac.abort();
//     };
//   }, [reqQs]);

//   // ------- choose data: live → props fallback -------
//   const hotelLive = live?.hotel || null;
//   const hotel = hotelLive || hotelProp || null;
//   const offersLive = hotelLive?.offers || [];
//   const offersFromProps = offersPreviewProp.length
//     ? offersPreviewProp
//     : hotelProp?.offers?.length
//     ? hotelProp.offers
//     : offersProp;
//   const list = offersLive.length ? offersLive : offersFromProps;

//   // header stripe dates
//   const headerArrival = arrivalDate || arrivalDateProp || "—";
//   const headerNights = nights || nightsProp || 1;
//   const checkOut =
//     checkOutDateProp || addDaysIso(arrivalDate, headerNights) || "—";

//   // adult/children totals for chips
//   const totalAdults = useMemo(() => sumCsv(canonAdultsCSV), [canonAdultsCSV]);
//   const totalChildren = useMemo(
//     () => sumCsv(canonChildrenCSV),
//     [canonChildrenCSV]
//   );

//   // ---- selection actions (unchanged) ----
//   const addItem = useSelectionStore((s) => s.addItem);
//   const upsertItem = useSelectionStore((s) => s.upsertItem);
//   const pushItem = useSelectionStore((s) => s.add || s.pushItem);
//   const onSelectOffer = useCallback(
//     (payload) => {
//       if (typeof upsertItem === "function") return upsertItem(payload);
//       if (typeof addItem === "function") return addItem(payload);
//       if (typeof pushItem === "function") return pushItem(payload);
//       console.warn("No selection add/upsert action in selectionStore");
//     },
//     [addItem, upsertItem, pushItem]
//   );

//   const RESULTS_PATH = "/admin/bookings/hotel";

//   const onBackClick = useCallback(() => {
//     // snapshot (որպես fallback)
//     let snapData = null;
//     try {
//       snapData = JSON.parse(
//         sessionStorage.getItem("lastHotelSnapshot") || "{}"
//       );
//     } catch {}

//     const crit = snapData?.criteria || {};

//     // SupplierResultsView-ը կարդում է cityCode (քեզ մոտ դա cityId-ն է snapshot-ում)
//     const cityCodeFromSnap = String(crit?.cityId || "");

//     const backParams = {
//       city: String(hotel?.location?.city || ""),
//       cityCode: cityCodeFromSnap, // ✅ սա կընկնի SupplierResultsView-ի մեջ որպես resolvedCityId
//       checkInDate: String(arrivalDate || ""),
//       checkOutDate: String(checkOut || ""),
//       rooms: String(canonRooms || 1),
//       adults: String(canonAdultsCSV || "2"),
//       children: String(canonChildrenCSV || "0"),
//     };
//     if (totalChildren > 0) {
//       backParams.childrenAges = String(canonChildrenAgesCSV || "");
//     }

//     const q = new URLSearchParams(backParams).toString();
//     const backHref = `${RESULTS_PATH}?${q}`;

//     console.groupCollapsed("[HD] BACK → results payload");
//     console.table(backParams);
//     console.log("→ href:", backHref);
//     console.groupEnd();

//     // always push՝ որ URL-ը լինի կանոնական
//     router.push(backHref);
//   }, [
//     router,
//     hotel?.location?.city,
//     arrivalDate,
//     checkOut,
//     canonRooms,
//     canonAdultsCSV,
//     canonChildrenCSV,
//     canonChildrenAgesCSV,
//     totalChildren,
//   ]);

//   return (
//     <div className={styles.page} style={{ "--app-header-h": "80px" }}>
//       {/* TOP BAR: back + chips */}
//       <div className={styles.topbar}>
//         <button className={styles.backBtn} onClick={onBackClick}>
//           ← Back to results
//         </button>

//         <div className={styles.metaChips}>
//           <span className={styles.chip}>
//             <span className={styles.ico} aria-hidden>
//               📍
//             </span>
//             {hotel?.location?.city || "—"}
//           </span>

//           <span className={styles.chip}>
//             <span className={styles.ico} aria-hidden>
//               📅
//             </span>
//             {headerArrival} → {checkOut}
//             {typeof headerNights === "number" && headerNights > 0 ? (
//               <>
//                 <span className={styles.sep}>•</span>
//                 <b>
//                   {headerNights} night{headerNights > 1 ? "s" : ""}
//                 </b>
//               </>
//             ) : null}
//           </span>

//           <span className={styles.chip}>
//             <span className={styles.ico} aria-hidden>
//               👥
//             </span>
//             {totalAdults} adults
//             {totalChildren > 0 ? (
//               <>
//                 <span className={styles.sep}>•</span>
//                 {totalChildren} children
//               </>
//             ) : null}
//           </span>

//           <span className={styles.chip}>
//             <span className={styles.ico} aria-hidden>
//               🛏️
//             </span>
//             {canonRooms || 1} room{Number(canonRooms) > 1 ? "s" : ""}
//           </span>
//         </div>
//       </div>

//       <div className={styles.grid}>
//         {/* LEFT */}
//         <div>
//           <HotelInfo
//             hotel={hotel}
//             areaLabel={areaLabel}
//             fullAddress={fullAddress}
//             heroPhotos={heroPhotos}
//             totalPhotoCount={totalPhotoCount}
//             aboutText={aboutText}
//             facilities={facilities}
//             distances={distances}
//             loading={loading}
//           />

//           <div className={styles.offersBlock}>
//             <OffersList
//               offers={list}
//               arrivalDate={arrivalDate}
//               onSelectOffer={onSelectOffer}
//             />
//           </div>
//         </div>

//         {/* RIGHT – STICKY RAIL */}
//         <div className={styles.rail}>
//           <SelectionSummary
//             arrivalDate={arrivalDate}
//             checkOutDate={checkOut}
//             nights={headerNights}
//             adults={totalAdults}
//             children={totalChildren}
//             rooms={canonRooms}
//             role={role}
//             user={user}
//             userCurrency={userCurrency}
//             settings={settings}
//             exchangeRates={exchangeRates}
//             onCheckAvailability={onCheckAvailability}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

// src/components/admin/hotel/HotelDetailsView.jsx
"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "@/styles/HotelDetailsView.module.css";
import HotelInfo from "@/components/admin/hotel/HotelInfo";
import OffersList from "@/components/admin/hotel/OffersList";
import SelectionSummary from "@/components/admin/hotel/SelectionSummary";
import { useSelectionStore } from "@/stores/selectionStore";
import api from "@/utils/api";

/* ⬇️ NEW: currency conversion deps */
import { useCurrencyStore } from "@/stores/currencyStore";
import usePublicSettings from "@/hooks/usePublicSettings";
import { tryConvert } from "@/utils/fx";

/** ——— helpers ——— */
function getSnap() {
  try {
    return JSON.parse(sessionStorage.getItem("lastHotelSnapshot") || "null");
  } catch {
    return null;
  }
}
function getSearchParams() {
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return new URLSearchParams();
  }
}
function getHotelIdFromUrl() {
  try {
    const p = window.location.pathname || "";
    const m = p.match(/\/hotel\/([^/?#]+)/i);
    return m?.[1] || null;
  } catch {
    return null;
  }
}
/** date util */
function addDaysIso(iso, days) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(+d)) return null;
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}
const sumCsv = (csv) =>
  String(csv || "")
    .split(",")
    .reduce((s, x) => s + (Number(x) || 0), 0);

/** --- CSV utils --- */
function splitGroupsFromAgesCSV(agesCSV) {
  const s = String(agesCSV || "").trim();
  if (!s) return [];
  return s.split("|").map((g) =>
    g
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  );
}
function detectRooms(adultsCSV, childrenCSV, agesCSV, fallbackRooms) {
  const aParts = String(adultsCSV || "").trim()
    ? String(adultsCSV).split(",")
    : [];
  const cParts = String(childrenCSV || "").trim()
    ? String(childrenCSV).split(",")
    : [];
  const ageGroups = splitGroupsFromAgesCSV(agesCSV);
  const candidates = [
    Number(fallbackRooms || 0),
    aParts.length || 0,
    cParts.length || 0,
    ageGroups.length || 0,
  ].filter(Boolean);
  const R = Math.max(1, ...(candidates.length ? candidates : [1]));
  return R;
}
function normalizeAdultsCSV(adultsCSV, rooms) {
  const R = Math.max(1, Number(rooms || 1));
  const parts = String(adultsCSV || "")
    .split(",")
    .map((x) => Math.max(1, Number(x) || 1));
  const out = Array.from({ length: R }, (_, i) => parts[i] ?? parts[0] ?? 2);
  return out.join(",");
}
function normalizeChildrenCSV(childrenCSV, rooms) {
  const R = Math.max(1, Number(rooms || 1));
  const parts = String(childrenCSV || "")
    .split(",")
    .map((x) => Math.max(0, Number(x) || 0));
  const out = Array.from({ length: R }, (_, i) => parts[i] ?? 0);
  return out.join(",");
}
function childrenCountsFromAges(agesCSV, rooms) {
  const groups = splitGroupsFromAgesCSV(agesCSV);
  const R = Math.max(1, Number(rooms || groups.length || 1));
  // pad / trim
  while (groups.length < R) groups.push([]);
  if (groups.length > R) groups.length = R;
  return groups.map((g) => g.length);
}

/** --- Debug helpers --- */
const parseCounts = (csv) =>
  String(csv || "")
    .split(",")
    .map((x) => Number(x) || 0);

const parseAgesPerRoom = (agesCsv) =>
  String(agesCsv || "")
    .split("|")
    .map((room) =>
      String(room || "")
        .split(",")
        .filter(Boolean)
        .map((a) => Number(a))
        .filter((n) => Number.isFinite(n))
    );

function shapeOK(childrenCSV, childrenAgesCSV) {
  const counts = parseCounts(childrenCSV);
  const ages = parseAgesPerRoom(childrenAgesCSV);
  if (!counts.length && !ages.length) return true;
  if (counts.length !== ages.length) return false;
  for (let i = 0; i < counts.length; i++) {
    if ((ages[i]?.length || 0) !== (counts[i] || 0)) return false;
  }
  return true;
}

export default function HotelDetailsView(props) {
  // ------- props (backup / UI wiring) -------
  const {
    hotel: hotelProp,
    offers: offersProp = [],
    offersPreview: offersPreviewProp = [],
    arrivalDate: arrivalDateProp,
    checkOutDate: checkOutDateProp,
    nights: nightsProp,
    adults: adultsProp,
    children: childrenProp,
    rooms: roomsProp,
    userCurrency,
    role,
    user,
    exchangeRates,
    settings,
    onBack, // if provided
    onCheckAvailability,
    fullAddress,
    areaLabel,
    aboutText,
    facilities = [],
    distances = [],
    heroPhotos = [],
    totalPhotoCount = 0,
  } = props;

  const router = useRouter();

  const hasAnySelection = useSelectionStore((s) => {
    // փորձենք ամենատարածված դաշտերը
    const pools = [s.items, s.list, s.selection, s.cart];
    for (const p of pools) if (Array.isArray(p) && p.length > 0) return true;
    return Boolean(s.current || s.item);
  });

  /* ⬇️ NEW: navbar currency + public settings (rates) */
  const { currency } = useCurrencyStore();
  const publicSettings = usePublicSettings();

  // ------- read URL + snapshot -------
  const sp = useMemo(() => getSearchParams(), []);
  const qsMap = useMemo(() => Object.fromEntries(sp.entries()), [sp]);
  const snap = useMemo(() => getSnap(), []);
  const hotelId =
    hotelProp?.hotelId ||
    hotelProp?._id ||
    qsMap.hotelId ||
    getHotelIdFromUrl();

  // criteria (URL → snapshot → props → defaults)
  const arrivalDate =
    qsMap.arrivalDate || snap?.criteria?.arrivalDate || arrivalDateProp || "";
  const nights = Number(
    qsMap.nights || snap?.criteria?.nights || nightsProp || 1
  );
  const roomsInitial = Number(
    qsMap.rooms || snap?.criteria?.rooms || roomsProp || 1
  );

  const adultsCSVRaw =
    qsMap.adults ||
    snap?.criteria?.adultsCSV ||
    (typeof adultsProp === "string" ? adultsProp : String(adultsProp || "2"));

  const childrenCSVRaw =
    qsMap.children ||
    snap?.criteria?.childrenCSV ||
    (typeof childrenProp === "string"
      ? childrenProp
      : String(childrenProp || "0"));

  const childrenAgesCSVRaw =
    qsMap.childrenAges || snap?.criteria?.childrenAgesCSV || "";

  const cityId =
    qsMap.cityId ||
    snap?.criteria?.cityId ||
    hotelProp?.externalSource?.cityId ||
    "";

  // optional
  const filterBasis = qsMap.filterBasis || "";
  const offerProofQ = qsMap.offerProof || "";
  const searchCodeQ = qsMap.searchCode || "";

  // --- Canonical guests/rooms ---
  const {
    canonRooms,
    canonAdultsCSV,
    canonChildrenCSV,
    canonChildrenAgesCSV,
    kidsOk,
  } = useMemo(() => {
    // detect rooms from any signal we have
    const Rdetected = detectRooms(
      adultsCSVRaw,
      childrenCSVRaw,
      childrenAgesCSVRaw,
      roomsInitial
    );

    // if ages present → children counts come from ages; else normalize CSV by rooms
    let childrenCSV = childrenCSVRaw;
    if (String(childrenAgesCSVRaw || "").trim()) {
      childrenCSV = childrenCountsFromAges(childrenAgesCSVRaw, Rdetected).join(
        ","
      );
    } else {
      childrenCSV = normalizeChildrenCSV(childrenCSVRaw, Rdetected);
    }

    const adultsCSV = normalizeAdultsCSV(adultsCSVRaw, Rdetected);
    const agesCSV = String(childrenAgesCSVRaw || "");
    const ok = shapeOK(childrenCSV, agesCSV);

    return {
      canonRooms: Rdetected,
      canonAdultsCSV: adultsCSV,
      canonChildrenCSV: childrenCSV,
      canonChildrenAgesCSV: agesCSV,
      kidsOk: ok,
    };
  }, [adultsCSVRaw, childrenCSVRaw, childrenAgesCSVRaw, roomsInitial]);

  // ---------------- ARRIVE DEBUG ----------------
  useEffect(() => {
    console.groupCollapsed("[HD] ARRIVE → inputs & canonical");
    console.log("URL qs:", qsMap);
    console.log("Snapshot:", snap);
    console.table({
      roomsInitial,
      adultsCSVRaw,
      childrenCSVRaw,
      childrenAgesCSVRaw,
      arrivalDate,
      nights,
      cityId,
    });
    console.table({
      canonRooms,
      canonAdultsCSV,
      canonChildrenCSV,
      canonChildrenAgesCSV,
      kidsOk,
    });
    console.groupEnd();
  }, [
    qsMap,
    snap,
    roomsInitial,
    adultsCSVRaw,
    childrenCSVRaw,
    childrenAgesCSVRaw,
    arrivalDate,
    nights,
    cityId,
    canonRooms,
    canonAdultsCSV,
    canonChildrenCSV,
    canonChildrenAgesCSV,
    kidsOk,
  ]);

  // ---- build request QS for live fetch ----
  const reqQs = useMemo(() => {
    const base = new URLSearchParams({
      cityId: String(cityId || ""),
      hotelId: String(hotelId || ""),
      arrivalDate: String(arrivalDate || ""),
      nights: String(nights || 1),
      rooms: String(canonRooms || 1),
      adults: String(canonAdultsCSV || "2"),
      children: String(canonChildrenCSV || "0"),
    });
    if (canonChildrenAgesCSV) base.set("childrenAges", canonChildrenAgesCSV);
    if (filterBasis) base.set("filterBasis", filterBasis);
    if (offerProofQ) base.set("offerProof", offerProofQ);
    if (searchCodeQ) base.set("searchCode", searchCodeQ);
    return base;
  }, [
    cityId,
    hotelId,
    arrivalDate,
    nights,
    canonRooms,
    canonAdultsCSV,
    canonChildrenCSV,
    canonChildrenAgesCSV,
    filterBasis,
    offerProofQ,
    searchCodeQ,
  ]);

  // ------- live fetch /hotel-availability -------
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const ac = new AbortController();

    const url = `/suppliers/goglobal/hotel-availability?${reqQs.toString()}`;
    console.groupCollapsed("[HD] FETCH → hotel-availability");
    console.log("GET:", url);
    console.groupEnd();

    api
      .get(url, { signal: ac.signal })
      .then(({ data }) => {
        if (!ignore) setLive(data);
      })
      .catch((e) => {
        // AbortError-ը նորմալ է effect cleanup-ի ժամանակ → ոչ մի աղմուկ
        if (e?.name === "AbortError" || e?.code === 20) return;
        if (!ignore) setLive(null);
        console.warn("[HD] fetch error:", e);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
      ac.abort();
    };
  }, [reqQs]);

  // ------- choose data: live → props fallback -------
  const hotelLive = live?.hotel || null;
  const hotel = hotelLive || hotelProp || null;
  const offersLive = hotelLive?.offers || [];
  const offersFromProps = offersPreviewProp.length
    ? offersPreviewProp
    : hotelProp?.offers?.length
    ? hotelProp.offers
    : offersProp;
  const list = offersLive.length ? offersLive : offersFromProps;

  // ⬇️ NEW: decorate offers with currency conversion (and overwrite common fields)
  const decoratedList = useMemo(() => {
    const target = String(currency || "").toUpperCase();
    const rates =
      publicSettings?.exchangeRates || settings?.exchangeRates || exchangeRates;

    // early exit
    if (!Array.isArray(list) || list.length === 0) return [];

    const mapOne = (off) => {
      const rawAmount = Number(
        off?.retail?.amount ?? off?.price?.amount ?? off?.amount ?? NaN
      );
      const rawCur = String(
        off?.retail?.currency || off?.price?.currency || off?.currency || ""
      ).toUpperCase();

      let finalAmt = rawAmount;
      let finalCur = rawCur;

      if (
        target &&
        target !== rawCur &&
        Number.isFinite(rawAmount) &&
        rawAmount > 0 &&
        rates
      ) {
        const conv = tryConvert(rawAmount, rawCur, target, rates);
        if (conv?.ok) {
          finalAmt = Number(conv.value);
          finalCur = target;
        }
      }

      // ensure commonly-used fields reflect converted values
      const commonPrice = { amount: finalAmt, currency: finalCur };

      return {
        ...off,
        _displayTotal: finalAmt,
        _displayCurrency: finalCur,
        retail: { ...(off.retail || {}), ...commonPrice },
        price: { ...(off.price || {}), ...commonPrice },
        amount: finalAmt,
        currency: finalCur,
      };
    };

    const out = list.map(mapOne);

    try {
      console.groupCollapsed("[HD] offers → decorated currency");
      console.log("target:", target || "(none)");
      console.log("count:", out.length);
      console.groupEnd();
    } catch {}

    return out;
  }, [list, currency, publicSettings, settings, exchangeRates]);

  // header stripe dates
  const headerArrival = arrivalDate || arrivalDateProp || "—";
  const headerNights = nights || nightsProp || 1;
  const checkOut =
    checkOutDateProp || addDaysIso(arrivalDate, headerNights) || "—";

  // adult/children totals for chips
  const totalAdults = useMemo(() => sumCsv(canonAdultsCSV), [canonAdultsCSV]);
  const totalChildren = useMemo(
    () => sumCsv(canonChildrenCSV),
    [canonChildrenCSV]
  );

  // ---- selection actions (unchanged) ----
  const addItem = useSelectionStore((s) => s.addItem);
  const upsertItem = useSelectionStore((s) => s.upsertItem);
  const pushItem = useSelectionStore((s) => s.add || s.pushItem);
  const onSelectOffer = useCallback(
    (payload) => {
      if (hasAnySelection) {
        console.debug("[HD] selection is locked → ignore select");
        return;
      }
      if (typeof upsertItem === "function") return upsertItem(payload);
      if (typeof addItem === "function") return addItem(payload);
      if (typeof pushItem === "function") return pushItem(payload);
      console.warn("No selection add/upsert action in selectionStore");
    },
    [addItem, upsertItem, pushItem, hasAnySelection]
  );

  const RESULTS_PATH = "/admin/bookings/hotel";

  const onBackClick = useCallback(() => {
    // snapshot (որպես fallback)
    let snapData = null;
    try {
      snapData = JSON.parse(
        sessionStorage.getItem("lastHotelSnapshot") || "{}"
      );
    } catch {}

    const crit = snapData?.criteria || {};

    // SupplierResultsView-ը կարդում է cityCode (քեզ մոտ դա cityId-ն է snapshot-ում)
    const cityCodeFromSnap = String(crit?.cityId || "");

    const backParams = {
      city: String(hotel?.location?.city || ""),
      cityCode: cityCodeFromSnap,
      checkInDate: String(arrivalDate || ""),
      checkOutDate: String(checkOut || ""),
      rooms: String(canonRooms || 1),
      adults: String(canonAdultsCSV || "2"),
      children: String(canonChildrenCSV || "0"),
    };
    if (totalChildren > 0) {
      backParams.childrenAges = String(canonChildrenAgesCSV || "");
    }

    const q = new URLSearchParams(backParams).toString();
    const backHref = `${RESULTS_PATH}?${q}`;

    console.groupCollapsed("[HD] BACK → results payload");
    console.table(backParams);
    console.log("→ href:", backHref);
    console.groupEnd();

    router.push(backHref);
  }, [
    router,
    hotel?.location?.city,
    arrivalDate,
    checkOut,
    canonRooms,
    canonAdultsCSV,
    canonChildrenCSV,
    canonChildrenAgesCSV,
    totalChildren,
  ]);

  return (
    <div className={styles.page} style={{ "--app-header-h": "80px" }}>
      {/* TOP BAR: back + chips */}
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={onBackClick}>
          ← Back to results
        </button>

        <div className={styles.metaChips}>
          <span className={styles.chip}>
            <span className={styles.ico} aria-hidden>
              📍
            </span>
            {hotel?.location?.city || "—"}
          </span>

          <span className={styles.chip}>
            <span className={styles.ico} aria-hidden>
              📅
            </span>
            {headerArrival} → {checkOut}
            {typeof headerNights === "number" && headerNights > 0 ? (
              <>
                <span className={styles.sep}>•</span>
                <b>
                  {headerNights} night{headerNights > 1 ? "s" : ""}
                </b>
              </>
            ) : null}
          </span>

          <span className={styles.chip}>
            <span className={styles.ico} aria-hidden>
              👥
            </span>
            {totalAdults} adults
            {totalChildren > 0 ? (
              <>
                <span className={styles.sep}>•</span>
                {totalChildren} children
              </>
            ) : null}
          </span>

          <span className={styles.chip}>
            <span className={styles.ico} aria-hidden>
              🛏️
            </span>
            {canonRooms || 1} room{Number(canonRooms) > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className={styles.grid}>
        {/* LEFT */}
        <div>
          <HotelInfo
            hotel={hotel}
            areaLabel={areaLabel}
            fullAddress={fullAddress}
            heroPhotos={heroPhotos}
            totalPhotoCount={totalPhotoCount}
            aboutText={aboutText}
            facilities={facilities}
            distances={distances}
            loading={loading}
          />

          <div className={styles.offersBlock}>
            <OffersList
              /* pass converted offers */
              offers={decoratedList}
              arrivalDate={arrivalDate}
              onSelectOffer={onSelectOffer}
              selectionLocked={hasAnySelection}
            />
          </div>
        </div>

        {/* RIGHT – STICKY RAIL */}
        <div className={styles.rail}>
          <SelectionSummary
            arrivalDate={arrivalDate}
            checkOutDate={checkOut}
            nights={headerNights}
            adults={totalAdults}
            children={totalChildren}
            rooms={canonRooms}
            role={role}
            user={user}
            userCurrency={userCurrency}
            settings={settings}
            exchangeRates={exchangeRates}
            onCheckAvailability={onCheckAvailability}
          />
        </div>
      </div>
    </div>
  );
}
