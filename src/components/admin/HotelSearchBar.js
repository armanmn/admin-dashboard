// New
"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "@/styles/hotelSearchBar.module.css";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
import GuestsRoomsPicker from "@/components/admin/GuestsRoomsPicker";

import {
  suggestCities,
  resolveCityCode,
  formatCityLabel,
} from "@/utils/citySearch";

function toRoomSpecFromInitial(iv = {}) {
  // Աջակցում ենք և aggregate, և csv ձևաչափերին
  const rooms = iv.rooms ?? 1;

  const adultsCSV =
    iv.adultsCSV ?? (iv.adults != null ? String(iv.adults) : "2");

  const childrenCSV =
    iv.childrenCSV ?? (iv.children != null ? String(iv.children) : "0");

  const childrenAgesCSV =
    iv.childrenAgesCSV ??
    (Array.isArray(iv.childrenAges)
      ? iv.childrenAges.join(",") // single-room legacy → "5,7"
      : iv.childrenAges || "");

  return { rooms, adultsCSV, childrenCSV, childrenAgesCSV };
}

const HotelSearchBar = ({ initialValues = {}, onSearch }) => {
  /* ---------------- Destination ---------------- */
  const [location, setLocation] = useState(initialValues.location || "");
  const [selectedCityCode, setSelectedCityCode] = useState(
    initialValues.cityCode || null
  );
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  /* ---------------- Dates ---------------- */
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef();

  const [range, setRange] = useState([
    {
      startDate: initialValues.checkInDate
        ? new Date(initialValues.checkInDate)
        : new Date(),
      endDate: initialValues.checkOutDate
        ? new Date(initialValues.checkOutDate)
        : new Date(),
      key: "selection",
    },
  ]);

  /* ---------------- Guests / Rooms (PER-ROOM CSV) ---------------- */
  const [roomSpec, setRoomSpec] = useState(() =>
    toRoomSpecFromInitial(initialValues)
  );
  const pickerRef = useRef(null);

  // ⭐ hydrate guard՝ guests/rooms-ը միայն մեկ անգամ ծագումից
  const hydratedRef = useRef(false);

  // close popovers on outside click (calendar + suggestions)
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

  // sync destination + dates միշտ OK է թարմացնել
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

    // guests/rooms — hydrate ONLY ONCE (URL-ից վերադառնալիս նույնպես աշխատում է mount-ին)
    if (!hydratedRef.current) {
      const hasGuestSpec =
        initialValues.rooms != null ||
        initialValues.adultsCSV != null ||
        initialValues.childrenCSV != null ||
        initialValues.childrenAgesCSV != null ||
        initialValues.adults != null ||
        initialValues.children != null ||
        initialValues.childrenAges != null;

      if (hasGuestSpec) {
        setRoomSpec(toRoomSpecFromInitial(initialValues));
      }
      hydratedRef.current = true;
    }
  }, [
    initialValues.location,
    initialValues.cityCode,
    initialValues.checkInDate,
    initialValues.checkOutDate,
    // ⛔️ մի՛ ավելացրու guests-կապված dependency—ներ այստեղ
  ]);

  /* ---------------- destination suggestions ---------------- */
  const handleLocationInput = async (e) => {
    const value = e.target.value;
    setLocation(value);

    if (value.trim().length > 1) {
      try {
        const list = await suggestCities(value, "goglobal");
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
    setLocation(s.name);
    setSelectedCityCode(String(s.supplierCityId || s.code));
    setShowSuggestions(false);
    setCitySuggestions([]);
  };

  /* ---------------- search ---------------- */
  const handleSearch = async () => {
    // 🔁 force-commit picker-ի ընթացիկ վիճակը
    const committed = pickerRef.current?.getCurrentPayload?.();
    const effective = committed
      ? {
          rooms: committed.rooms,
          adultsCSV: committed.adultsCSV,
          childrenCSV: committed.childrenCSV,
          childrenAgesCSV: committed.childrenAgesCSV,
        }
      : roomSpec;

    // պահենք էլ state-ում, որ UI-ն ձևաչափվի committed արժեքներով
    setRoomSpec(effective);

    let cityCode = selectedCityCode;

    if (!cityCode && location.trim()) {
      cityCode = await resolveCityCode(location.trim(), "goglobal");
      if (!cityCode) {
        const list = await suggestCities(location.trim(), "goglobal");
        if (list && list[0]) {
          cityCode = String(list[0].supplierCityId || list[0].code);
        }
      }
    }

    const checkInDate = format(range[0].startDate, "yyyy-MM-dd");
    const checkOutDate = format(range[0].endDate, "yyyy-MM-dd");
    const MS = 24 * 60 * 60 * 1000;
    const nights = Math.max(
      1,
      Math.round((range[0].endDate - range[0].startDate) / MS)
    );

    const searchData = {
      location,
      cityCode: cityCode || null,
      checkInDate,
      checkOutDate,
      nights,
      // ✅ supplier-ready per-room CSV payload
      rooms: effective.rooms,
      adults: effective.adultsCSV, // "2,2"
      children: effective.childrenCSV, // "1,2"
      childrenAges: effective.childrenAgesCSV, // "5|9,11"
    };

    // Store-ում nonce—ը թարմացնենք, որ results–ը re-fetch անի
    useSearchCriteriaStore.getState().bumpNonce?.();

    // եթե store-ը ունեք setCriteria, սա էլ կարող ես ավելացնել (ոչ պարտադիր)
    // useSearchCriteriaStore.getState().setCriteria?.(searchData);

    onSearch?.(searchData);
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
          />
          {showCalendar && (
            <div className={styles.calendarWrapper}>
              <DateRange
                ranges={range}
                onChange={(item) => setRange([item.selection])}
                moveRangeOnFirstSelection={false}
                minDate={new Date()}
                className={styles.calendarPopup}
              />
            </div>
          )}
        </div>
      </div>

      {/* Guests / Rooms — PER-ROOM picker */}
      <GuestsRoomsPicker
        ref={pickerRef}
        value={roomSpec}
        onChange={(payload) => {
          setRoomSpec({
            rooms: payload.rooms,
            adultsCSV: payload.adultsCSV,
            childrenCSV: payload.childrenCSV,
            childrenAgesCSV: payload.childrenAgesCSV,
          });
        }}
      />

      <button
        className={`${styles.searchBtn} btn-action`}
        onClick={handleSearch}
      >
        Search
      </button>
    </div>
  );
};

export default HotelSearchBar;
