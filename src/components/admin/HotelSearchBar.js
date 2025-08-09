"use client";
import React, { useState, useEffect, useRef } from "react";
import styles from "@/styles/hotelSearchBar.module.css";
import { DateRange } from "react-date-range";
import { format } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
// import goglCities from "@/data/gogl_cities.json";
import goglCities from "../../data/gogl_cities.json";

const HotelSearchBar = ({ initialValues = {}, onSearch }) => {
  const [location, setLocation] = useState(initialValues.location || "");
  const [adults, setAdults] = useState(initialValues.adults || 2);
  const [children, setChildren] = useState(initialValues.children || 0);
  const [rooms, setRooms] = useState(initialValues.rooms || 1);
  const [selectedCityCode, setSelectedCityCode] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showGuestOptions, setShowGuestOptions] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const guestRef = useRef();
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (guestRef.current && !guestRef.current.contains(event.target)) {
        setShowGuestOptions(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (initialValues.location) setLocation(initialValues.location);
    if (initialValues.adults !== undefined) setAdults(initialValues.adults);
    if (initialValues.children !== undefined)
      setChildren(initialValues.children);
    if (initialValues.rooms !== undefined) setRooms(initialValues.rooms);
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

  const handleLocationInput = (e) => {
    const value = e.target.value;
    setLocation(value);

    if (value.length > 1) {
      const filtered = goglCities.filter(
        (city) =>
          typeof city.CityName === "string" &&
          city.CityName.toLowerCase().includes(value.toLowerCase())
      );
      setCitySuggestions(filtered.slice(0, 5));
      setShowSuggestions(true);
    } else {
      setCitySuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = () => {
    const searchData = {
      location,
      cityCode: selectedCityCode,
      checkInDate: format(range[0].startDate, "yyyy-MM-dd"),
      checkOutDate: format(range[0].endDate, "yyyy-MM-dd"),
      adults,
      children,
      rooms,
    };
    console.log("🔎 Final Search Payload:", searchData);
    if (onSearch) onSearch(searchData);
  };

  return (
    <div className={styles.searchBar}>
      <div className={styles.inputGroup}>
        <input
          type="text"
          placeholder="Enter a destination"
          value={location}
          onChange={handleLocationInput}
          className={styles.input}
        />
        {showSuggestions && citySuggestions.length > 0 && (
          <ul className={styles.suggestionList}>
            {citySuggestions.map((suggestion) => (
              <li
                key={suggestion.CityId}
                className={styles.suggestionItem}
                onClick={() => {
                  setLocation(suggestion.CityName);
                  setSelectedCityCode(suggestion.CityId);
                  setShowSuggestions(false);
                  setCitySuggestions([]);
                }}
              >
                {suggestion.CityName} ({suggestion.Country})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.inputGroup}>
        <div className={styles.dateWrapper} ref={calendarRef}>
          <span
            className={styles.icon}
            onClick={() => setShowCalendar(!showCalendar)}
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
            onClick={() => setShowCalendar(!showCalendar)}
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

      <div className={styles.inputGroup}>
        <div
          className={styles.guestSelector}
          ref={guestRef}
          onClick={() => setShowGuestOptions(!showGuestOptions)}
        >
          {adults} Adults • {children} Children • {rooms} Room
          {showGuestOptions && (
            <div className={styles.guestOptions}>
              {[
                ["👤 Adults", adults, setAdults, 1],
                ["🧒 Children", children, setChildren, 0],
                ["🏠 Rooms", rooms, setRooms, 1],
              ].map(([label, value, setter, min]) => (
                <div className={styles.optionRow} key={label}>
                  <span>{label}</span>
                  <div className={styles.counter}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setter(Math.max(min, value - 1));
                      }}
                    >
                      −
                    </button>
                    <span>{value}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setter(value + 1);
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button className={styles.searchBtn} onClick={handleSearch}>
        Search
      </button>
    </div>
  );
};

export default HotelSearchBar;
