// New
"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "@/styles/hotelSearchBar.module.css";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";

import {
  suggestCities,
  resolveCityCode,
  formatCityLabel,
} from "@/utils/citySearch";

const clampAge = (n) => {
  const v = Math.floor(Number(n) || 0);
  return Math.max(0, Math.min(17, v));
};
const syncAgesToCount = (count, current = []) => {
  const c = Math.max(0, Number(count) || 0);
  const base = Array.isArray(current) ? current.slice(0, c) : [];
  while (base.length < c) base.push(7); // sensible default
  return base;
};

const HotelSearchBar = ({ initialValues = {}, onSearch }) => {
  // Destination
  const [location, setLocation] = useState(initialValues.location || "");
  const [selectedCityCode, setSelectedCityCode] = useState(
    initialValues.cityCode || null
  );
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Dates
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

  // Guests/Rooms
  const [showGuestOptions, setShowGuestOptions] = useState(false);
  const guestRef = useRef();

  const [adults, setAdults] = useState(initialValues.adults ?? 2);
  const [children, setChildren] = useState(initialValues.children ?? 0);
  const [rooms, setRooms] = useState(initialValues.rooms ?? 1);
  const [childrenAges, setChildrenAges] = useState(
    Array.isArray(initialValues.childrenAges)
      ? syncAgesToCount(initialValues.children ?? 0, initialValues.childrenAges)
      : syncAgesToCount(initialValues.children ?? 0, [])
  );

  // keep ages array in sync with children count
  useEffect(() => {
    setChildrenAges((prev) => syncAgesToCount(children, prev));
  }, [children]);

  // close popovers on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (guestRef.current && !guestRef.current.contains(e.target))
        setShowGuestOptions(false);
      if (calendarRef.current && !calendarRef.current.contains(e.target))
        setShowCalendar(false);
      // suggestions list: close if click outside the destination input/suggestions
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

  // sync initialValues
  useEffect(() => {
    if (initialValues.location !== undefined)
      setLocation(initialValues.location);
    if (initialValues.adults !== undefined) setAdults(initialValues.adults);
    if (initialValues.children !== undefined)
      setChildren(initialValues.children ?? 0);
    if (initialValues.rooms !== undefined) setRooms(initialValues.rooms);
    if (initialValues.cityCode !== undefined)
      setSelectedCityCode(initialValues.cityCode);
    if (Array.isArray(initialValues.childrenAges)) {
      setChildrenAges(syncAgesToCount(initialValues.children ?? 0, initialValues.childrenAges));
    }

    if (initialValues.checkInDate && initialValues.checkOutDate) {
      setRange([
        {
          startDate: new Date(initialValues.checkInDate),
          endDate: new Date(initialValues.checkOutDate),
          key: "selection",
        },
      ]);
    }
  }, [initialValues]);

  // suggestions via backend (DB) resolver
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

  const handleSearch = async () => {
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

    const searchData = {
      location,
      cityCode: cityCode || null,
      checkInDate: format(range[0].startDate, "yyyy-MM-dd"),
      checkOutDate: format(range[0].endDate, "yyyy-MM-dd"),
      adults,
      children: children ?? 0,
      childrenAges: syncAgesToCount(children, childrenAges), // ✅ ներառում ենք
      rooms,
    };

    // notify store about a new search (triggers live re-fetch paths)
    useSearchCriteriaStore.getState().bumpNonce();

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

      {/* Guests / Rooms */}
      <div className={styles.inputGroup}>
        <div
          className={styles.guestSelector}
          ref={guestRef}
          onClick={() => setShowGuestOptions((v) => !v)}
          role="button"
          aria-haspopup="dialog"
          aria-expanded={showGuestOptions}
        >
          {adults} Adults • {children ?? 0} Children • {rooms} Room
          {showGuestOptions && (
            <div
              className={styles.guestOptions}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Guests and rooms"
            >
              {/* Counters */}
              {[
                { label: "👤 Adults", value: adults, setter: setAdults, min: 1 },
                { label: "🧒 Children", value: children ?? 0, setter: (n)=>{ setChildren(n); }, min: 0 },
                { label: "🏠 Rooms", value: rooms, setter: setRooms, min: 1 },
              ].map(({ label, value, setter, min }) => (
                <div className={styles.optionRow} key={label}>
                  <span className={styles.optionLabel}>{label}</span>
                  <div className={styles.counter}>
                    <button
                      type="button"
                      className={styles.counterBtn}
                      onClick={() => setter(Math.max(min, (value ?? 0) - 1))}
                    >
                      −
                    </button>
                    <span className={styles.counterValue}>{value ?? 0}</span>
                    <button
                      type="button"
                      className={styles.counterBtn}
                      onClick={() => setter((value ?? 0) + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              {/* Children ages */}
              {children > 0 && (
                <div className={styles.agesBlock}>
                  <div className={styles.agesTitle}>Children ages</div>
                  <div className={styles.ageGrid}>
                    {childrenAges.map((age, idx) => (
                      <label className={styles.ageItem} key={idx}>
                        <span>Child {idx + 1}</span>
                        <select
                          className={styles.ageSelect}
                          value={age}
                          onChange={(e) => {
                            const v = clampAge(e.target.value);
                            setChildrenAges((prev) => {
                              const next = prev.slice();
                              next[idx] = v;
                              return next;
                            });
                          }}
                        >
                          {Array.from({ length: 18 }, (_, n) => n).map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setShowGuestOptions(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => {
                    setShowGuestOptions(false);
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button className={`${styles.searchBtn} btn-action`} onClick={handleSearch}>
        Search
      </button>
    </div>
  );
};

export default HotelSearchBar;