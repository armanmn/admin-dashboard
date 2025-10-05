// "use client";
// import React, { useState, useEffect, useRef, useMemo } from "react";
// import styles from "@/styles/hotelSearchBar.module.css";
// import { DateRange } from "react-date-range";
// import { format } from "date-fns";
// import "react-date-range/dist/styles.css";
// import "react-date-range/dist/theme/default.css";

// import GuestsRoomsPicker from "@/components/admin/GuestsRoomsPicker";
// import { canonGuests } from "@/utils/childrenCsv";
// import {
//   suggestCities,
//   resolveCityCode,
//   formatCityLabel,
// } from "@/utils/citySearch";

// /* ---------------- helpers ---------------- */
// function toRoomSpecFromInitial(iv = {}) {
//   const rooms = iv.rooms ?? 1;
//   const adultsCSV =
//     iv.adultsCSV ?? (iv.adults != null ? String(iv.adults) : "2");
//   const childrenCSV =
//     iv.childrenCSV ?? (iv.children != null ? String(iv.children) : "0");
//   const childrenAgesCSV =
//     iv.childrenAgesCSV ??
//     (Array.isArray(iv.childrenAges)
//       ? iv.childrenAges.join(",")
//       : iv.childrenAges || "");
//   return { rooms, adultsCSV, childrenCSV, childrenAgesCSV };
// }

// export default function HotelSearchBar({ initialValues = {}, onSearch }) {
//   /* Destination */
//   const [location, setLocation] = useState(initialValues.location || "");
//   const [selectedCityCode, setSelectedCityCode] = useState(
//     initialValues.cityCode ?? null
//   );
//   const [citySuggestions, setCitySuggestions] = useState([]);
//   const [showSuggestions, setShowSuggestions] = useState(false);

//   /* Dates */
//   const [showCalendar, setShowCalendar] = useState(false);
//   const calendarRef = useRef();

//   const today = useMemo(() => new Date(), []);
//   const tomorrow = useMemo(() => {
//     const d = new Date();
//     d.setDate(d.getDate() + 1);
//     return d;
//   }, []);

//   const [range, setRange] = useState([
//     {
//       startDate: initialValues.checkInDate
//         ? new Date(initialValues.checkInDate)
//         : today,
//       endDate: initialValues.checkOutDate
//         ? new Date(initialValues.checkOutDate)
//         : tomorrow,
//       key: "selection",
//     },
//   ]);

//   /* Guests / Rooms – keep local, mount-only canon */
//   const initialRoomSpecCanon = useMemo(
//     () => canonGuests(toRoomSpecFromInitial(initialValues)),
//     [] // do not add deps
//   );
//   const [roomSpec, setRoomSpec] = useState(initialRoomSpecCanon);
//   const pickerRef = useRef(null);
//   const hydratedRef = useRef(false);

//   /* close popovers on outside click */
//   useEffect(() => {
//     const onDocClick = (e) => {
//       if (calendarRef.current && !calendarRef.current.contains(e.target))
//         setShowCalendar(false);
//       if (
//         !e.target.closest?.(`.${styles.input}`) &&
//         !e.target.closest?.(`.${styles.suggestionList}`)
//       ) {
//         setShowSuggestions(false);
//       }
//     };
//     document.addEventListener("mousedown", onDocClick);
//     return () => document.removeEventListener("mousedown", onDocClick);
//   }, []);

//   /* sync destination + dates (once for guests) */
//   useEffect(() => {
//     if (initialValues.location !== undefined)
//       setLocation(initialValues.location);
//     if (initialValues.cityCode !== undefined)
//       setSelectedCityCode(initialValues.cityCode);
//     if (initialValues.checkInDate && initialValues.checkOutDate) {
//       setRange([
//         {
//           startDate: new Date(initialValues.checkInDate),
//           endDate: new Date(initialValues.checkOutDate),
//           key: "selection",
//         },
//       ]);
//     }
//     if (!hydratedRef.current) {
//       const hasGuestSpec =
//         initialValues.rooms != null ||
//         initialValues.adultsCSV != null ||
//         initialValues.childrenCSV != null ||
//         initialValues.childrenAgesCSV != null ||
//         initialValues.adults != null ||
//         initialValues.children != null ||
//         initialValues.childrenAges != null;
//       setRoomSpec(
//         hasGuestSpec
//           ? canonGuests(toRoomSpecFromInitial(initialValues))
//           : initialRoomSpecCanon
//       );
//       hydratedRef.current = true;
//     }
//   }, [
//     initialValues.location,
//     initialValues.cityCode,
//     initialValues.checkInDate,
//     initialValues.checkOutDate,
//   ]);

//   /* destination suggestions */
//   const handleLocationInput = async (e) => {
//     const value = e.target.value;
//     setLocation(value);
//     if (value.trim().length > 1) {
//       try {
//         const list = await suggestCities(value.trim(), "goglobal");
//         setCitySuggestions(list.slice(0, 8));
//         setShowSuggestions(true);
//       } catch {
//         setCitySuggestions([]);
//         setShowSuggestions(false);
//       }
//     } else {
//       setCitySuggestions([]);
//       setShowSuggestions(false);
//     }
//   };
//   const pickSuggestion = (s) => {
//     setLocation(formatCityLabel(s));
//     setSelectedCityCode(String(s.supplierCityId || s.code || ""));
//     setShowSuggestions(false);
//     setCitySuggestions([]);
//   };

//   /* search */
//   const handleSearch = async () => {

//     // 1) Commit picker
//     const committed = pickerRef.current?.getCurrentPayload?.();
//     const effective = committed || roomSpec; // keep EXACT ui payload

//     // 2) Resolve city code if missing
//     let cityCode = selectedCityCode;
//     if (!cityCode && location.trim()) {
//       cityCode = await resolveCityCode(location.trim(), "goglobal");
//       if (!cityCode) {
//         const list = await suggestCities(location.trim(), "goglobal");
//         if (list && list[0])
//           cityCode = String(list[0].supplierCityId || list[0].code);
//       }
//     }

//     // 3) Dates
//     const checkInDate = format(range[0].startDate, "yyyy-MM-dd");
//     const checkOutDate = format(range[0].endDate, "yyyy-MM-dd");
//     const MS = 24 * 60 * 60 * 1000;
//     const nights = Math.max(
//       1,
//       Math.round((range[0].endDate - range[0].startDate) / MS)
//     );

//     // 4) Final payload (server expects arrivalDate+nights)
//     const searchData = {
//       location,
//       cityCode: cityCode || null,
//       checkInDate,
//       checkOutDate,
//       arrivalDate: checkInDate,
//       nights,
//       rooms: effective.rooms,
//       adults: effective.adultsCSV,
//       children: effective.childrenCSV,
//       childrenAges: effective.childrenAgesCSV, // keep exact (do NOT pad here)
//     };

//     console.debug("[HSB] onSearch payload", searchData);
//     onSearch?.(searchData);
//   };

//   console.debug("[HSB] commit →", committed || roomSpec);
//   console.debug("[HSB] searchData →", searchData);

//   const onKeyDown = (e) => {
//     if (e.key === "Enter") {
//       e.preventDefault();
//       handleSearch();
//     }
//   };

//   return (
//     <div className={styles.searchBar}>
//       {/* Destination */}
//       <div className={styles.inputGroup}>
//         <input
//           type="text"
//           placeholder="Enter a destination"
//           value={location}
//           onChange={handleLocationInput}
//           onKeyDown={onKeyDown}
//           className={styles.input}
//           aria-label="Destination"
//         />
//         {showSuggestions && citySuggestions.length > 0 && (
//           <ul className={styles.suggestionList}>
//             {citySuggestions.map((s) => (
//               <li
//                 key={`${s.code}-${s.supplierCityId || "sys"}`}
//                 className={styles.suggestionItem}
//                 onClick={() => pickSuggestion(s)}
//               >
//                 {formatCityLabel(s)}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Dates */}
//       <div className={styles.inputGroup}>
//         <div className={styles.dateWrapper} ref={calendarRef}>
//           <span
//             className={styles.icon}
//             onClick={() => setShowCalendar((v) => !v)}
//             role="button"
//             aria-label="Toggle calendar"
//           >
//             📅
//           </span>
//           <input
//             type="text"
//             className={styles.inputWithIcon}
//             value={`${format(range[0].startDate, "MMM dd")} - ${format(
//               range[0].endDate,
//               "MMM dd"
//             )}`}
//             onClick={() => setShowCalendar((v) => !v)}
//             readOnly
//             aria-label="Check-in and Check-out"
//           />
//           {showCalendar && (
//             <div className={styles.calendarWrapper}>
//               <DateRange
//                 ranges={range}
//                 onChange={(item) => setRange([item.selection])}
//                 moveRangeOnFirstSelection={false}
//                 minDate={today}
//                 className={styles.calendarPopup}
//               />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Guests / Rooms */}
//       <GuestsRoomsPicker
//         ref={pickerRef}
//         value={roomSpec}
//         onChange={(payload) => {
//           // keep EXACT UI state (no store writes here)
//           setRoomSpec(payload);
//           console.debug("[HSB] picker → payload", payload);
//         }}
//       />

//       <button
//         className={`${styles.searchBtn} btn-action`}
//         onClick={handleSearch}
//         aria-label="Search hotels"
//       >
//         Search
//       </button>
//     </div>
//   );
// }

"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import styles from "@/styles/hotelSearchBar.module.css";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

import GuestsRoomsPicker from "@/components/admin/GuestsRoomsPicker";
import { canonGuests } from "@/utils/childrenCsv";
import {
  suggestCities,
  resolveCityCode,
  formatCityLabel,
} from "@/utils/citySearch";

/* ---------------- helpers ---------------- */
function toRoomSpecFromInitial(iv = {}) {
  const rooms = iv.rooms ?? 1;
  const adultsCSV =
    iv.adultsCSV ?? (iv.adults != null ? String(iv.adults) : "2");
  const childrenCSV =
    iv.childrenCSV ?? (iv.children != null ? String(iv.children) : "0");
  const childrenAgesCSV =
    iv.childrenAgesCSV ??
    (Array.isArray(iv.childrenAges)
      ? iv.childrenAges.join(",")
      : iv.childrenAges || "");
  return { rooms, adultsCSV, childrenCSV, childrenAgesCSV };
}

// small debug helper
const dbgSplit = (csv, sep = ",") =>
  String(csv ?? "")
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);

export default function HotelSearchBar({ initialValues = {}, onSearch }) {
  /* Destination */
  const [location, setLocation] = useState(initialValues.location || "");
  const [selectedCityCode, setSelectedCityCode] = useState(
    initialValues.cityCode ?? null
  );
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* Dates */
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef();

  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }, []);

  const [range, setRange] = useState([
    {
      startDate: initialValues.checkInDate
        ? new Date(initialValues.checkInDate)
        : today,
      endDate: initialValues.checkOutDate
        ? new Date(initialValues.checkOutDate)
        : tomorrow,
      key: "selection",
    },
  ]);

  /* Guests / Rooms – keep local, mount-only canon */
  const initialRoomSpecCanon = useMemo(
    () => canonGuests(toRoomSpecFromInitial(initialValues)),
    [] // do not add deps
  );
  const [roomSpec, setRoomSpec] = useState(initialRoomSpecCanon);
  const pickerRef = useRef(null);
  const hydratedRef = useRef(false);

  /* close popovers on outside click */
  useEffect(() => {
    const onDocClick = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target))
        setShowCalendar(false);
      if (
        !e.target.closest?.(`.${styles.input}`) &&
        !e.target.closest?.(`.${styles.suggestionList}`)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  /* sync destination + dates (once for guests) */
  useEffect(() => {
    if (initialValues.location !== undefined)
      setLocation(initialValues.location);
    if (initialValues.cityCode !== undefined)
      setSelectedCityCode(initialValues.cityCode);
    if (initialValues.checkInDate && initialValues.checkOutDate) {
      setRange([
        {
          startDate: new Date(initialValues.checkInDate),
          endDate: new Date(initialValues.checkOutDate),
          key: "selection",
        },
      ]);
    }
    if (!hydratedRef.current) {
      const hasGuestSpec =
        initialValues.rooms != null ||
        initialValues.adultsCSV != null ||
        initialValues.childrenCSV != null ||
        initialValues.childrenAgesCSV != null ||
        initialValues.adults != null ||
        initialValues.children != null ||
        initialValues.childrenAges != null;

      const canon = hasGuestSpec
        ? canonGuests(toRoomSpecFromInitial(initialValues))
        : initialRoomSpecCanon;

      setRoomSpec(canon);

      // DEBUG — mount hydration snapshot
      console.groupCollapsed("[HSB] hydrate (mount)");
      console.debug("initialValues →", initialValues);
      console.debug("roomSpec (canon) →", canon);
      console.groupEnd();

      hydratedRef.current = true;
    }
  }, [
    initialValues.location,
    initialValues.cityCode,
    initialValues.checkInDate,
    initialValues.checkOutDate,
  ]);

  /* destination suggestions */
  const handleLocationInput = async (e) => {
    const value = e.target.value;
    setLocation(value);
    if (value.trim().length > 1) {
      try {
        const list = await suggestCities(value.trim(), "goglobal");
        setCitySuggestions(list.slice(0, 8));
        setShowSuggestions(true);
      } catch {
        setCitySuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  };
  const pickSuggestion = (s) => {
    setLocation(formatCityLabel(s));
    setSelectedCityCode(String(s.supplierCityId || s.code || ""));
    setShowSuggestions(false);
    setCitySuggestions([]);
    console.debug("[HSB] pickSuggestion →", {
      label: formatCityLabel(s),
      cityCode: String(s.supplierCityId || s.code || ""),
    });
  };

  /* search */
  const handleSearch = async () => {
    console.groupCollapsed("[HSB] handleSearch");

    // 1) Commit picker
    const committed = pickerRef.current?.getCurrentPayload?.();
    const effective = committed || roomSpec; // keep EXACT ui payload
    console.debug("[HSB] commit →", committed);
    console.debug("[HSB] effective roomsSpec →", effective);

    // Helpful CSV breakdown for multi-room debugging
    console.debug("[HSB] rooms CSV snapshot", {
      rooms: effective.rooms,
      adultsCSV: effective.adultsCSV,
      adultsPerRoom: dbgSplit(effective.adultsCSV).length,
      childrenCSV: effective.childrenCSV,
      childrenPerRoom: dbgSplit(effective.childrenCSV).length,
      childrenAgesCSV: effective.childrenAgesCSV,
      agesGroupsCount: String(effective.childrenAgesCSV || "")
        .split("|")
        .filter(Boolean).length,
      agesPerRoom: String(effective.childrenAgesCSV || "")
        .split("|")
        .map((g) => dbgSplit(g).length),
    });

    setRoomSpec(effective);

    // 2) Resolve city code if missing
    let cityCode = selectedCityCode;
    if (!cityCode && location.trim()) {
      console.debug("[HSB] resolving cityCode for:", location);
      try {
        cityCode = await resolveCityCode(location.trim(), "goglobal");
      } catch (e) {
        console.warn("[HSB] resolveCityCode failed:", e?.message || e);
      }
      if (!cityCode) {
        const list = await suggestCities(location.trim(), "goglobal");
        if (list && list[0])
          cityCode = String(list[0].supplierCityId || list[0].code);
      }
      console.debug("[HSB] cityCode (resolved) →", cityCode);
    } else {
      console.debug("[HSB] cityCode (from UI) →", cityCode);
    }

    // 3) Dates
    const checkInDate = format(range[0].startDate, "yyyy-MM-dd");
    const checkOutDate = format(range[0].endDate, "yyyy-MM-dd");
    const MS = 24 * 60 * 60 * 1000;
    const nights = Math.max(
      1,
      Math.round((range[0].endDate - range[0].startDate) / MS)
    );
    console.debug("[HSB] dates →", { checkInDate, checkOutDate, nights });

    // 4) Final payload (server expects arrivalDate+nights)
    const searchData = {
      location,
      cityCode: cityCode || null,
      checkInDate,
      checkOutDate,
      arrivalDate: checkInDate,
      nights,
      rooms: effective.rooms,
      adults: effective.adultsCSV,
      children: effective.childrenCSV,
      childrenAges: effective.childrenAgesCSV, // keep exact (do NOT pad here)
    };

    console.debug("[HSB] searchData →", searchData);
    console.debug("[HSB] onSearch() call");
    onSearch?.(searchData);

    console.groupEnd();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className={styles.searchBar}>
      {/* Destination */}
      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="Enter a destination"
          value={location}
          onChange={handleLocationInput}
          onKeyDown={onKeyDown}
          className={styles.input}
          aria-label="Destination"
        />
        {showSuggestions && citySuggestions.length > 0 && (
          <ul className={styles.suggestionList}>
            {citySuggestions.map((s) => (
              <li
                key={`${s.code}-${s.supplierCityId || "sys"}`}
                className={styles.suggestionItem}
                onClick={() => pickSuggestion(s)}
              >
                {formatCityLabel(s)}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dates */}
      <div className={styles.inputGroup}>
        <div className={styles.dateWrapper} ref={calendarRef}>
          <span
            className={styles.icon}
            onClick={() => setShowCalendar((v) => !v)}
            role="button"
            aria-label="Toggle calendar"
          >
            📅
          </span>
          <input
            type="text"
            className={styles.inputWithIcon}
            value={`${format(range[0].startDate, "MMM dd")} - ${format(
              range[0].endDate,
              "MMM dd"
            )}`}
            onClick={() => setShowCalendar((v) => !v)}
            readOnly
            aria-label="Check-in and Check-out"
          />
          {showCalendar && (
            <div className={styles.calendarWrapper}>
              <DateRange
                ranges={range}
                onChange={(item) => setRange([item.selection])}
                moveRangeOnFirstSelection={false}
                minDate={today}
                className={styles.calendarPopup}
              />
            </div>
          )}
        </div>
      </div>

      {/* Guests / Rooms */}
      <GuestsRoomsPicker
        ref={pickerRef}
        value={roomSpec}
        onChange={(payload) => {
          // keep EXACT UI state (no store writes here)
          setRoomSpec(payload);
          console.debug("[HSB] picker → payload", payload);
        }}
      />

      <button
        className={`${styles.searchBtn} btn-action`}
        onClick={handleSearch}
        aria-label="Search hotels"
      >
        Search
      </button>
    </div>
  );
}