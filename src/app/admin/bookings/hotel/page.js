// // src/app/admin/hotel/page.js կամ որտեղ է քո HotelBookingPage-ը
// "use client";
// import React, { useState, useCallback } from "react";
// import HotelSearchBar from "@/components/admin/HotelSearchBar";
// import HotelFiltersSidebar from "@/components/admin/HotelFiltersSidebar";
// import SupplierResultsView from "@/components/admin/SupplierResultsView";
// import AISmartSearch from "@/components/AI/AISmartSearch";
// import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
// import styles from "@/styles/hotelBookingPage.module.css";

// const HotelBookingPage = () => {
//   const [searchParams, setSearchParams] = useState({});
//   const [uiFilters, setUiFilters] = useState({});

//   const {
//     city,
//     checkInDate,
//     checkOutDate,
//     adults,
//     children,
//     rooms,
//     setCriteria,
//   } = useSearchCriteriaStore();

//   const searchCriteria = {
//     location: city,
//     checkInDate,
//     checkOutDate,
//     adults,
//     children,
//     rooms,
//   };

//   const handleSearch = useCallback(
//     (data) => {
//       const location = data.location ?? data.destination ?? "";
//       const {
//         cityCode,
//         checkInDate,
//         checkOutDate,
//         adults,
//         children,
//         childrenAges, // ⬅ պահում ենք, նույնիսկ যদি հիմա sidebar-ում չօգտագործես
//         rooms,
//       } = data;

//       const next = {
//         city: location,
//         cityCode,
//         checkInDate,
//         checkOutDate,
//         adults,
//         children,
//         childrenAges,
//         rooms,
//       };

//       setSearchParams(next);
//       setCriteria(next);
//     },
//     [setCriteria]
//   );

//   return (
//     <div className={styles.container}>
//       <h2>Hotel Booking</h2>

//       {/* AI Search */}
//       <div className={styles.sectionGap}>
//         <AISmartSearch onSearch={handleSearch} />
//       </div>

//       {/* Սովորական Search Bar + divider */}
//       <div className={styles.searchBarSection}>
//         <HotelSearchBar
//           initialValues={searchCriteria}
//           onSearch={handleSearch}
//         />
//       </div>

//       <div className={styles.mainContent}>
//         <div className={styles.sidebarWrapper}>
//           <HotelFiltersSidebar onFilterChange={setUiFilters} />
//         </div>

//         {/* ✅ Միակ view — Live (GoGlobal) */}
//         <SupplierResultsView
//           searchParams={searchParams}
//           uiFilters={uiFilters}
//         />
//       </div>
//     </div>
//   );
// };

// export default HotelBookingPage;

// src/app/admin/hotel/page.js
"use client";
import React, { useState, useCallback } from "react";
import HotelSearchBar from "@/components/admin/HotelSearchBar";
import HotelFiltersSidebar from "@/components/admin/HotelFiltersSidebar";
import SupplierResultsView from "@/components/admin/SupplierResultsView";
import AISmartSearch from "@/components/AI/AISmartSearch";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
import styles from "@/styles/hotelBookingPage.module.css";

const HotelBookingPage = () => {
  const [searchParams, setSearchParams] = useState({});
  const [uiFilters, setUiFilters] = useState({});
  const [isFiltersOpen, setIsFiltersOpen] = useState(false); // ⬅ drawer toggle (≤1240px)

  const {
    city,
    checkInDate,
    checkOutDate,
    adults,
    children,
    rooms,
    setCriteria,
  } = useSearchCriteriaStore();

  const searchCriteria = {
    location: city,
    checkInDate,
    checkOutDate,
    adults,
    children,
    rooms,
  };

  const handleSearch = useCallback(
    (data) => {
      const location = data.location ?? data.destination ?? "";
      const {
        cityCode,
        checkInDate,
        checkOutDate,
        adults,
        children,
        childrenAges,
        rooms,
      } = data;

      const next = {
        city: location,
        cityCode,
        checkInDate,
        checkOutDate,
        adults,
        children,
        childrenAges,
        rooms,
      };

      setSearchParams(next);
      setCriteria(next);
    },
    [setCriteria]
  );

  const applyUiFilters = (payload) => {
    setUiFilters(payload);
    // drawer-ը փակենք փոքր էկրաններում
    setIsFiltersOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h2>Hotel Booking</h2>

        {/* visible only ≤1240px */}
        <button
          type="button"
          className={styles.filterToggle}
          onClick={() => setIsFiltersOpen(true)}
          aria-label="Open filters"
        >
          Filters
        </button>
      </div>

      {/* AI Search */}
      <div className={styles.sectionGap}>
        <AISmartSearch onSearch={handleSearch} />
      </div>

      {/* Classic Search Bar */}
      <div className={styles.searchBarSection}>
        <HotelSearchBar initialValues={searchCriteria} onSearch={handleSearch} />
      </div>

      {/* Main */}
      <div className={styles.mainContent}>
        {/* Desktop sidebar (hidden ≤1240px) */}
        <aside className={styles.sidebarWrapper} aria-label="Filters">
          <HotelFiltersSidebar onFilterChange={applyUiFilters} />
        </aside>

        {/* Results */}
        <section className={styles.resultsWrapper}>
          <SupplierResultsView searchParams={searchParams} uiFilters={uiFilters} />
        </section>
      </div>

      {/* Off-canvas drawer (only shown ≤1240px via CSS) */}
      <div
        className={`${styles.sidebarDrawer} ${isFiltersOpen ? styles.open : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div className={styles.drawerHead}>
          <h4>Filters</h4>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setIsFiltersOpen(false)}
            aria-label="Close filters"
          >
            ×
          </button>
        </div>

        <div className={styles.drawerBody}>
          <HotelFiltersSidebar onFilterChange={applyUiFilters} />
        </div>
      </div>

      {/* Backdrop for drawer */}
      {isFiltersOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsFiltersOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default HotelBookingPage;