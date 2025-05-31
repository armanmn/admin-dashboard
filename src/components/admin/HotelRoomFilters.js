"use client";
import React, { useState, useEffect } from "react";
import styles from "@/styles/hotelRoomFilters.module.css";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";

const HotelRoomFilters = () => {
  const { filters, setFilters } = useSearchCriteriaStore();
  const [localRoomTypes, setLocalRoomTypes] = useState({});
  const [localMinBeds, setLocalMinBeds] = useState(null);
  const [refundable, setRefundable] = useState(false);
  const [selectedMealPlans, setSelectedMealPlans] = useState([]);

  useEffect(() => {
    setLocalRoomTypes(filters.roomTypes || {});
    setLocalMinBeds(filters.minBeds || null);
    setRefundable(filters.refundable || false);
    setSelectedMealPlans(filters.mealPlans || []);
  }, [filters]);

  const handleRoomTypeChange = (e) => {
    const { name, checked } = e.target;
    setLocalRoomTypes((prev) => ({ ...prev, [name]: checked }));
  };

  const handleMealPlanChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedMealPlans((prev) => [...prev, value]);
    } else {
      setSelectedMealPlans((prev) => prev.filter((plan) => plan !== value));
    }
  };

  const applyRoomFilters = () => {
    setFilters({
      ...filters,
      roomTypes: localRoomTypes,
      minBeds: localMinBeds,
      refundable,
      mealPlans: selectedMealPlans,
    });
  };

  const mealPlanOptions = [
    { value: "room_only", label: "🛏️ Room Only" },
    { value: "breakfast", label: "🥐 Breakfast" },
    { value: "half_board", label: "🍽️ Half Board" },
    { value: "full_board", label: "🍽️🍽️ Full Board" },
    { value: "all_inclusive", label: "🍹 All Inclusive" },
    { value: "ultra_all_inclusive", label: "🌟 Ultra All Inclusive" },
  ];

  return (
    <div className={styles.filterBox}>
      <h4>Refine Your Room Search</h4>

      {/* Room Types */}
      <div className={styles.section}>
        <label>Room Types:</label>
        <div className={styles.optionsGrid}>
          {["standard", "deluxe", "suite", "family"].map((type) => (
            <div key={type} className={styles.checkboxItem}>
              <input
                type="checkbox"
                id={`room-${type}`}
                checked={localRoomTypes?.[type] || false}
                onChange={handleRoomTypeChange}
                name={type}
              />
              <label htmlFor={`room-${type}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Beds Count */}
      <div className={styles.section}>
        <label>Min Beds:</label>
        <div className={styles.optionsGrid}>
          <div className={styles.checkboxItem}>
            <input
              type="radio"
              name="beds"
              id="beds-any"
              checked={localMinBeds === null}
              onChange={() => setLocalMinBeds(null)}
            />
            <label htmlFor="beds-any">Any</label>
          </div>
          {[1, 2, 3].map((count) => (
            <div className={styles.checkboxItem} key={`beds-${count}`}>
              <input
                type="radio"
                name="beds"
                id={`beds-${count}`}
                checked={localMinBeds === count}
                onChange={() => setLocalMinBeds(count)}
              />
              <label htmlFor={`beds-${count}`}>{count}+ beds</label>
            </div>
          ))}
        </div>
      </div>

      {/* Refundable */}
      <div className={styles.section}>
        <div className={styles.checkboxItem}>
          <input
            type="checkbox"
            id="refundable"
            checked={refundable}
            onChange={(e) => setRefundable(e.target.checked)}
          />
          <label htmlFor="refundable">Refundable Only</label>
        </div>
      </div>

      {/* Meal Plan */}
      <div className={styles.section}>
        <label>Meal Plan:</label>
        <div className={styles.optionsGrid}>
          {mealPlanOptions.map((plan) => (
            <div key={plan.value} className={styles.checkboxItem}>
              <input
                type="checkbox"
                id={`meal-${plan.value}`}
                value={plan.value}
                checked={selectedMealPlans.includes(plan.value)}
                onChange={handleMealPlanChange}
              />
              <label htmlFor={`meal-${plan.value}`}>{plan.label}</label>
            </div>
          ))}
        </div>
      </div>

      <button onClick={applyRoomFilters} className={styles.applyBtn}>
        Apply Filters
      </button>
    </div>
  );
};

export default HotelRoomFilters;
