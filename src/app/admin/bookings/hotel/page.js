"use client";
import React, { useState, useCallback } from "react";
import HotelSearchBar from "@/components/admin/HotelSearchBar";
import HotelFiltersSidebar from "@/components/admin/HotelFiltersSidebar";
import HotelResultsView from "@/components/admin/HotelResultsView";
import styles from "@/styles/hotelBookingPage.module.css";
import AISmartSearch from "@/components/AI/AISmartSearch";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";

const HotelBookingPage = () => {
  const [filters, setFilters] = useState({});

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

  // ✅ AI search → updates filters + city
  const handleAISearch = useCallback((searchData) => {
    console.log("📨 handleAISearch called:", searchData);

    const city = searchData.location;

    setFilters({ ...searchData, city });

    setCriteria({
      city,
      checkInDate: searchData.checkInDate,
      checkOutDate: searchData.checkOutDate,
      adults: searchData.adults,
      children: searchData.children,
      rooms: searchData.rooms,
    });
  }, [setCriteria]);

  // ✅ Manual search bar → updates filters + city
  const handleSearchFromBar = useCallback((searchData) => {
    console.log("📨 handleSearchFromBar called:", searchData);

    const city = searchData.location;

    setFilters({ ...searchData, city });

    setCriteria({
      city,
      checkInDate: searchData.checkInDate,
      checkOutDate: searchData.checkOutDate,
      adults: searchData.adults,
      children: searchData.children,
      rooms: searchData.rooms,
    });
  }, [setCriteria]);

  return (
    <div className={styles.container}>
      <h2>Hotel Booking</h2>

      <AISmartSearch onSearch={handleAISearch} />

      <HotelSearchBar
        initialValues={searchCriteria}
        onSearch={handleSearchFromBar}
      />

      <div className={styles.mainContent}>
        <div className={styles.sidebarWrapper}>
          <HotelFiltersSidebar onFilterChange={setFilters} />
        </div>
        <HotelResultsView filters={filters} />
      </div>
    </div>
  );
};

export default HotelBookingPage;