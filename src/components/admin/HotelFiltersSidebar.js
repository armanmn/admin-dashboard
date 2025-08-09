// export default HotelFiltersSidebar;
"use client";
import React, { useState } from "react";
import styles from "@/styles/hotelFiltersSidebar.module.css";

const HotelFiltersSidebar = ({ onFilterChange }) => {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [refundable, setRefundable] = useState(false);

  const [amenities, setAmenities] = useState({
    wifi: false,
    parking: false,
    pool: false,
    spa: false,
    breakfast: false,
    ac: false,
    fitness: false,
    petFriendly: false,
  });

  const [roomTypes, setRoomTypes] = useState({
    standard: false,
    deluxe: false,
    suite: false,
    family: false,
  });

  const [minBeds, setMinBeds] = useState(null);

  const handleCheckboxChange = (e, setState) => {
    const { name, checked } = e.target;
    setState((prev) => ({ ...prev, [name]: checked }));
  };

  const applyFilters = () => {
    const selectedAmenities = Object.entries(amenities)
      .filter(([_, isChecked]) => isChecked)
      .map(([key]) => key);

    const selectedRoomTypes = Object.entries(roomTypes)
      .filter(([_, isChecked]) => isChecked)
      .map(([key]) => key);

    const filterPayload = {};

    // ⭐ KEY FIX: priceMin/priceMax → minPrice/maxPrice
    if (minPrice !== "") filterPayload.minPrice = Number(minPrice);
    if (maxPrice !== "") filterPayload.maxPrice = Number(maxPrice);

    if (refundable) filterPayload.refundable = true;
    if (selectedAmenities.length > 0)
      filterPayload.facilities = selectedAmenities.join(",");
    if (selectedRoomTypes.length > 0)
      filterPayload.roomTypes = selectedRoomTypes.join(",");
    if (minBeds !== null) filterPayload.minBeds = minBeds;

    onFilterChange(filterPayload);
  };

  const amenityLabels = {
    wifi: "WiFi 📶",
    parking: "Parking 🅿️",
    pool: "Swimming Pool 🏊",
    spa: "Spa & Wellness 💆",
    breakfast: "Breakfast Included 🥐",
    ac: "Air Conditioning ❄️",
    fitness: "Fitness Center 🏋️‍♀️",
    petFriendly: "Pet Friendly 🐾",
  };

  const roomTypeLabels = {
    standard: "Standard Room",
    deluxe: "Deluxe Room",
    suite: "Suite",
    family: "Family Room",
  };

  return (
    <div className={styles.sidebar}>
      <h4>Filter By</h4>

      {/* Price Filters */}
      <div className={styles.section}>
        <label>Min Price:</label>
        <input
          type="number"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
      </div>

      <div className={styles.section}>
        <label>Max Price:</label>
        <input
          type="number"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      {/* Amenities */}
      <div className={styles.section}>
        <label>Amenities:</label>
        <div className={styles.amenitiesGrid}>
          {Object.keys(amenities).map((key) => (
            <div className={styles.checkboxItem} key={key}>
              <input
                type="checkbox"
                className={styles.checkbox}
                name={key}
                checked={amenities[key]}
                onChange={(e) => handleCheckboxChange(e, setAmenities)}
                id={`amenity-${key}`}
              />
              <label htmlFor={`amenity-${key}`}>{amenityLabels[key]}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Room Types */}
      <div className={styles.section}>
        <label>Room Types:</label>
        <div className={styles.amenitiesGrid}>
          {Object.keys(roomTypes).map((key) => (
            <div className={styles.checkboxItem} key={key}>
              <input
                type="checkbox"
                className={styles.checkbox}
                name={key}
                checked={roomTypes[key]}
                onChange={(e) => handleCheckboxChange(e, setRoomTypes)}
                id={`roomtype-${key}`}
              />
              <label htmlFor={`roomtype-${key}`}>{roomTypeLabels[key]}</label>
            </div>
          ))}
        </div>
      </div>

      {/* Refundable */}
      <div className={styles.section}>
        <label>Refund Policy:</label>
        <div className={styles.amenitiesGrid}>
          <div className={styles.checkboxItem}>
            <input
              type="checkbox"
              id="refundable"
              checked={refundable}
              onChange={(e) => setRefundable(e.target.checked)}
            />
            <label htmlFor="refundable">Free Cancellation</label>
          </div>
        </div>
      </div>

      {/* Min Beds */}
      <div className={styles.section}>
        <label>Min Beds:</label>
        <div className={styles.amenitiesGrid}>
          <div className={styles.checkboxItem}>
            <input
              type="radio"
              name="beds"
              id="beds-any"
              checked={minBeds === null}
              onChange={() => setMinBeds(null)}
            />
            <label htmlFor="beds-any">Any</label>
          </div>

          {[1, 2, 3].map((count) => (
            <div className={styles.checkboxItem} key={`beds-${count}`}>
              <input
                type="radio"
                name="beds"
                id={`beds-${count}`}
                checked={minBeds === count}
                onChange={() => setMinBeds(count)}
              />
              <label htmlFor={`beds-${count}`}>{count}+ beds</label>
            </div>
          ))}
        </div>
      </div>

      <button className={styles.applyBtn} onClick={applyFilters}>
        Apply Filters
      </button>
    </div>
  );
};

export default HotelFiltersSidebar;
