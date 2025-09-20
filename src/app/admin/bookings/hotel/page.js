// // src/app/admin/hotels/page.jsx  կամ  src/pages/admin/hotels/index.jsx
// "use client";
// import React, { useState, useCallback } from "react";
// import HotelSearchBar from "@/components/admin/HotelSearchBar";
// import HotelFiltersSidebar from "@/components/admin/HotelFiltersSidebar";
// import HotelResultsView from "@/components/admin/HotelResultsView";
// import styles from "@/styles/hotelBookingPage.module.css";
// import AISmartSearch from "@/components/AI/AISmartSearch";
// import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";

// // Live supplier results
// import SupplierResultsView from "@/components/admin/SupplierResultsView";

// const HotelBookingPage = () => {
//   const [searchParams, setSearchParams] = useState({});
//   const [uiFilters, setUiFilters] = useState({});
//   const [resultsSource, setResultsSource] = useState("db"); // "db" | "live"

//   const {
//     city,
//     checkInDate,
//     checkOutDate,
//     adults,
//     children,
//     childrenAges,         // ✅ վերցնենք store-ից
//     rooms,
//     setCriteria,
//   } = useSearchCriteriaStore();

//   // ✅ Սկզբնական արժեքները, որ HotelSearchBar-ը ստանա նաև ages
//   const searchCriteria = {
//     location: city,
//     checkInDate,
//     checkOutDate,
//     adults,
//     children,
//     childrenAges,         // ✅
//     rooms,
//   };

//   // ✅ handleSearch — now passes/keeps childrenAges as well + bumps nonce
//   const handleSearch = useCallback(
//     (data) => {
//       const location = data.location ?? data.destination ?? "";
//       const {
//         cityCode,
//         checkInDate,
//         checkOutDate,
//         adults,
//         children,
//         rooms,
//         childrenAges, // ✅ ստանում ենք, եթե չկա՝ կմնա undefined (store-ը normalize է անում)
//       } = data;

//       const next = {
//         city: location,
//         cityCode,
//         checkInDate,
//         checkOutDate,
//         adults,
//         children,
//         childrenAges, // ✅
//         rooms,
//       };

//       setSearchParams(next);     // UI filters/props համար
//       setCriteria(next);         // store state
//       // force re-fetch in SupplierResultsView (nonce dependency)
//       useSearchCriteriaStore.getState().bumpNonce(); // ✅
//     },
//     [setCriteria]
//   );

//   return (
//     <div className={styles.container}>
//       <h2>Hotel Booking</h2>

//       <AISmartSearch onSearch={handleSearch} />
//       <HotelSearchBar initialValues={searchCriteria} onSearch={handleSearch} />

//       {/* Results source tabs */}
//       <div style={{ margin: "16px 0", display: "flex", gap: 12 }}>
//         <button
//           onClick={() => setResultsSource("db")}
//           style={{
//             padding: "8px 12px",
//             borderRadius: 8,
//             border:
//               resultsSource === "db" ? "2px solid #333" : "1px solid #ccc",
//             background: resultsSource === "db" ? "#f3f3f3" : "white",
//             cursor: "pointer",
//           }}
//         >
//           DB Results
//         </button>
//         <button
//           onClick={() => setResultsSource("live")}
//           style={{
//             padding: "8px 12px",
//             borderRadius: 8,
//             border:
//               resultsSource === "live" ? "2px solid #333" : "1px solid #ccc",
//             background: resultsSource === "live" ? "#f3f3f3" : "white",
//             cursor: "pointer",
//           }}
//         >
//           Live (GoGlobal)
//         </button>
//       </div>

//       <div className={styles.mainContent}>
//         <div className={styles.sidebarWrapper}>
//           <HotelFiltersSidebar onFilterChange={setUiFilters} />
//         </div>

//         {resultsSource === "db" ? (
//           <HotelResultsView searchParams={searchParams} uiFilters={uiFilters} />
//         ) : (
//           <SupplierResultsView
//             searchParams={searchParams}
//             uiFilters={uiFilters}
//           />
//         )}
//       </div>
//     </div>
//   );
// };

// export default HotelBookingPage;

// src/app/admin/hotels/page.js կամ որտեղ է քո HotelBookingPage-ը
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
        childrenAges, // ⬅ պահում ենք, նույնիսկ যদি հիմա sidebar-ում չօգտագործես
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

  return (
    <div className={styles.container}>
      <h2>Hotel Booking</h2>

      {/* AI Search */}
      <div className={styles.sectionGap}>
        <AISmartSearch onSearch={handleSearch} />
      </div>

      {/* Սովորական Search Bar + divider */}
      <div className={styles.searchBarSection}>
        <HotelSearchBar
          initialValues={searchCriteria}
          onSearch={handleSearch}
        />
      </div>

      <div className={styles.mainContent}>
        <div className={styles.sidebarWrapper}>
          <HotelFiltersSidebar onFilterChange={setUiFilters} />
        </div>

        {/* ✅ Միակ view — Live (GoGlobal) */}
        <SupplierResultsView
          searchParams={searchParams}
          uiFilters={uiFilters}
        />
      </div>
    </div>
  );
};

export default HotelBookingPage;
