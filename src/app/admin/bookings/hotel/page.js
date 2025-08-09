"use client";
import React, { useState, useCallback } from "react";
import HotelSearchBar from "@/components/admin/HotelSearchBar";
import HotelFiltersSidebar from "@/components/admin/HotelFiltersSidebar";
import HotelResultsView from "@/components/admin/HotelResultsView";
import styles from "@/styles/hotelBookingPage.module.css";
import AISmartSearch from "@/components/AI/AISmartSearch";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";

const HotelBookingPage = () => {
  // ✅ Search-ին անհրաժեշտ պարամետրերը (FETCH-ը միայն սրանց փոփոխությունից)
  const [searchParams, setSearchParams] = useState({});
  // ✅ Sidebar-ի տեղային filter-ները (ՉԵՆ կանչում fetch)
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

  // 🔸 Սեղմում ես Search (դասական կամ AI) → փոխվում է searchParams → fetch HotelResultsView-ում
  const handleSearch = useCallback((data) => {
    const { location, checkInDate, checkOutDate, adults, children, rooms } = data;

    const next = {
      city: location,
      checkInDate,
      checkOutDate,
      adults,
      children,
      rooms,
    };

    setSearchParams(next); // ← սա է trigger-ը fetch-ի համար
    setCriteria(next);     // պահում ենք store-ում, եթե պետք գա այլուր
  }, [setCriteria]);

  return (
    <div className={styles.container}>
      <h2>Hotel Booking</h2>

      <AISmartSearch onSearch={handleSearch} />

      <HotelSearchBar
        initialValues={searchCriteria}
        onSearch={handleSearch}
      />

      <div className={styles.mainContent}>
        <div className={styles.sidebarWrapper}>
          {/* ⚠️ Sidebar-ը փոխում է միայն uiFilters, ոչ fetch */}
          <HotelFiltersSidebar onFilterChange={setUiFilters} />
        </div>

        {/* ✅ ResultsView-ը fetch է անում ՄԻԱՅՆ searchParams-ով.
            uiFilters-ը կիրառվում է տեղում, already-fetched list-ի վրա */}
        <HotelResultsView searchParams={searchParams} uiFilters={uiFilters} />
      </div>
    </div>
  );
};

export default HotelBookingPage;