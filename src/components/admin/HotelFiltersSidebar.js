"use client";
import React, { useState } from "react";
import styles from "@/styles/hotelFiltersSidebar.module.css";

const HotelFiltersSidebar = ({ onFilterChange }) => {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
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

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setAmenities((prev) => ({ ...prev, [name]: checked }));
  };

  const applyFilters = () => {
    onFilterChange({
      minPrice,
      maxPrice,
      amenities,
    });
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

  return (
    <div className={styles.sidebar}>
      <h4>Filter By</h4>

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
              onChange={handleCheckboxChange}
              id={`amenity-${key}`}
            />
            <label htmlFor={`amenity-${key}`}>{amenityLabels[key]}</label>
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
