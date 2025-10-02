// // src/components/admin/HotelFiltersSidebar.jsx
// "use client";
// import React, { useState } from "react";
// import styles from "@/styles/hotelFiltersSidebar.module.css";

// /**
//  * Minimal, safe filters:
//  * - Price (min/max)
//  * - Stars (min)
//  * - Meal plan (boards)
//  * - Refundable toggle
//  *
//  * Outputs uiFilters payload:
//  * {
//  *   minPrice?: number,
//  *   maxPrice?: number,
//  *   minStars?: number,     // 1..5
//  *   boards?: "RO,BB,HB",   // CSV (RO|BB|HB|FB|AI|UAI)
//  *   refundable?: true
//  * }
//  */
// const HotelFiltersSidebar = ({ onFilterChange }) => {
//   // Price
//   const [minPrice, setMinPrice] = useState("");
//   const [maxPrice, setMaxPrice] = useState("");

//   // Stars (min)
//   const [minStars, setMinStars] = useState(0); // 0 = Any

//   // Meal plan (boards)
//   const [boards, setBoards] = useState({
//     RO: false,  // Room Only
//     BB: false,  // Bed & Breakfast
//     HB: false,  // Half Board
//     FB: false,  // Full Board
//     AI: false,  // All Inclusive
//     UAI: false, // Ultra All Inclusive
//   });

//   // Refundable
//   const [refundable, setRefundable] = useState(false);

//   const handleBoardToggle = (code) => {
//     setBoards((prev) => ({ ...prev, [code]: !prev[code] }));
//   };

//   const applyFilters = () => {
//     const payload = {};

//     if (minPrice !== "") payload.minPrice = Number(minPrice);
//     if (maxPrice !== "") payload.maxPrice = Number(maxPrice);

//     if (minStars && Number(minStars) > 0) payload.minStars = Number(minStars);

//     const pickedBoards = Object.entries(boards)
//       .filter(([_, v]) => v)
//       .map(([k]) => k);
//     if (pickedBoards.length > 0) payload.boards = pickedBoards.join(",");

//     if (refundable) payload.refundable = true;

//     onFilterChange?.(payload);
//   };

//   return (
//     <div className={styles.sidebar}>
//       <h4>Filter By</h4>

//       {/* Price */}
//       <div className={styles.section}>
//         <label>Min Price:</label>
//         <input
//           type="number"
//           inputMode="numeric"
//           value={minPrice}
//           onChange={(e) => setMinPrice(e.target.value)}
//           placeholder="e.g. 100"
//         />
//       </div>

//       <div className={styles.section}>
//         <label>Max Price:</label>
//         <input
//           type="number"
//           inputMode="numeric"
//           value={maxPrice}
//           onChange={(e) => setMaxPrice(e.target.value)}
//           placeholder="e.g. 800"
//         />
//       </div>

//       {/* Stars (min) */}
//       <div className={styles.section}>
//         <label>Stars (min):</label>
//         <select
//           value={minStars}
//           onChange={(e) => setMinStars(Number(e.target.value))}
//           className={styles.sortSelect}
//         >
//           <option value={0}>Any</option>
//           <option value={1}>1★+</option>
//           <option value={2}>2★+</option>
//           <option value={3}>3★+</option>
//           <option value={4}>4★+</option>
//           <option value={5}>5★</option>
//         </select>
//       </div>

//       {/* Meal plan (boards) */}
//       <div className={styles.section}>
//         <label>Meal plan:</label>
//         <div className={styles.amenitiesGrid}>
//           {Object.keys(boards).map((code) => (
//             <div className={styles.checkboxItem} key={code}>
//               <input
//                 type="checkbox"
//                 id={`board-${code}`}
//                 checked={!!boards[code]}
//                 onChange={() => handleBoardToggle(code)}
//                 className={styles.checkbox}
//               />
//               <label htmlFor={`board-${code}`}>
//                 {code === "RO" && "Room Only (RO)"}
//                 {code === "BB" && "Bed & Breakfast (BB)"}
//                 {code === "HB" && "Half Board (HB)"}
//                 {code === "FB" && "Full Board (FB)"}
//                 {code === "AI" && "All Inclusive (AI)"}
//                 {code === "UAI" && "Ultra All Inclusive (UAI)"}
//               </label>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Refundable */}
//       <div className={styles.section}>
//         <label>Refund Policy:</label>
//         <div className={styles.amenitiesGrid}>
//           <div className={styles.checkboxItem}>
//             <input
//               type="checkbox"
//               id="refundable"
//               checked={refundable}
//               onChange={(e) => setRefundable(e.target.checked)}
//               className={styles.checkbox}
//             />
//             <label htmlFor="refundable">Free Cancellation</label>
//           </div>
//         </div>
//       </div>

//       <button className={styles.applyBtn} onClick={applyFilters}>
//         Apply Filters
//       </button>
//     </div>
//   );
// };

// export default HotelFiltersSidebar;

// NEW
// src/components/admin/HotelFiltersSidebar.jsx
// src/components/admin/HotelFiltersSidebar.jsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import styles from "@/styles/hotelFiltersSidebar.module.css";

const MEAL_PLANS = [
  { code: "RO", label: "Room Only" },
  { code: "BB", label: "Bed & Breakfast" },
  { code: "CB", label: "Continental Breakfast" },
  { code: "HB", label: "Half-Board" },
  { code: "FB", label: "Full-Board" },
  { code: "AI", label: "All-Inclusive" },
  { code: "BD", label: "Bed & Dinner" },
];

const HotelFiltersSidebar = ({ onFilterChange }) => {
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // ⭐ Min Stars (popup)
  const [minStars, setMinStars] = useState(null); // null = Any
  const [starsOpen, setStarsOpen] = useState(false);
  const starsRef = useRef(null);

  // ⭐ Boards (meal plans) — only allowed codes
  const [boards, setBoards] = useState(() =>
    Object.fromEntries(MEAL_PLANS.map((m) => [m.code, false]))
  );

  // close stars popover on outside click
  useEffect(() => {
    function onDoc(e) {
      if (!starsRef.current) return;
      if (!starsRef.current.contains(e.target)) setStarsOpen(false);
    }
    if (starsOpen) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [starsOpen]);

  const applyFilters = () => {
    const payload = {};
    if (minPrice !== "") payload.minPrice = Number(minPrice);
    if (maxPrice !== "") payload.maxPrice = Number(maxPrice);
    if (minStars != null) payload.minStars = Number(minStars);

    const selectedBoards = Object.entries(boards)
      .filter(([_, checked]) => checked)
      .map(([code]) => code);
    if (selectedBoards.length > 0) payload.boards = selectedBoards;

    onFilterChange?.(payload);
    setStarsOpen(false);
  };

  const clearMinStars = (e) => {
    e.stopPropagation();
    setMinStars(null);
  };

  const renderStars = (count) => {
    const full = "★".repeat(count);
    const empty = "☆".repeat(5 - count);
    return (
      <span className={styles.starsInline}>
        <span className={styles.starActive}>{full}</span>
        {empty ? <span className={styles.star}>{empty}</span> : null}
      </span>
    );
  };

  return (
    <div className={styles.sidebar}>
      <h4>Filter By</h4>

      {/* Price */}
      <div className={styles.section}>
        <label>Min Price</label>
        <input
          type="number"
          inputMode="numeric"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
      </div>
      <div className={styles.section}>
        <label>Max Price</label>
        <input
          type="number"
          inputMode="numeric"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

      {/* Min Stars (popup) */}
      <div className={styles.section} ref={starsRef}>
        <label>Min Stars</label>
        <button
          type="button"
          className={styles.starsTrigger}
          onClick={() => setStarsOpen((v) => !v)}
          aria-expanded={starsOpen}
        >
          {minStars == null ? "Any" : renderStars(minStars)}
          <span className={styles.chevron}>▾</span>
        </button>

        {starsOpen && (
          <div
            className={styles.starsPopover}
            role="dialog"
            aria-label="Min stars"
          >
            <div className={styles.starsList}>
              <button
                type="button"
                className={styles.starsChoice}
                onClick={() => {
                  setMinStars(1);
                  setStarsOpen(false);
                }}
              >
                {renderStars(1)}
              </button>
              <button
                type="button"
                className={styles.starsChoice}
                onClick={() => {
                  setMinStars(2);
                  setStarsOpen(false);
                }}
              >
                {renderStars(2)}
              </button>
              <button
                type="button"
                className={styles.starsChoice}
                onClick={() => {
                  setMinStars(3);
                  setStarsOpen(false);
                }}
              >
                {renderStars(3)}
              </button>
              <button
                type="button"
                className={styles.starsChoice}
                onClick={() => {
                  setMinStars(4);
                  setStarsOpen(false);
                }}
              >
                {renderStars(4)}
              </button>
              <button
                type="button"
                className={styles.starsChoice}
                onClick={() => {
                  setMinStars(5);
                  setStarsOpen(false);
                }}
              >
                {renderStars(5)}
              </button>
            </div>

            <button
              type="button"
              className={styles.starsClear}
              onClick={clearMinStars}
            >
              Any
            </button>
          </div>
        )}
      </div>

      {/* Meal plan (boards) */}
      <div className={styles.section}>
        <label>Meal Plan</label>
        <div className={styles.oneColumnList}>
          {MEAL_PLANS.map((mp) => (
            <label key={mp.code} className={styles.checkboxItem}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={!!boards[mp.code]}
                onChange={(e) =>
                  setBoards((prev) => ({
                    ...prev,
                    [mp.code]: e.target.checked,
                  }))
                }
              />
              <span className={styles.boardLabel}>
                <span className={styles.codeBadge}>{mp.code}</span>
                <span className={styles.codeText}>{mp.label}</span>
              </span>
            </label>
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
