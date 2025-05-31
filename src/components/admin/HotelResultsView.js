"use client";

import React, { useEffect, useState } from "react";
import api from "@/utils/api";
import HotelCard from "./HotelCard";
import styles from "@/styles/hotelResultsView.module.css";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";

const HotelResultsView = ({ filters }) => {
  const [viewType, setViewType] = useState("grid");
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("price-asc"); // ✅ default sort

  const nights = useSearchCriteriaStore((state) => state.nights);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);

        const query = {};
        if (filters?.city) query.city = filters.city;
        if (filters?.checkInDate) query.checkIn = filters.checkInDate;
        if (filters?.checkOutDate) query.checkOut = filters.checkOutDate;
        if (filters?.adults) query.adults = filters.adults;
        if (filters?.children) query.children = filters.children;
        if (filters?.rooms) query.rooms = filters.rooms;

        const res = await api.get("/hotels", { params: query });

        const hotelsWithPrices = res
          .map((hotel) => {
            const roomPrices = hotel.rooms
              ?.map((r) => Number(r.price))
              .filter(Boolean);
            const minRoomPrice = roomPrices?.length
              ? Math.min(...roomPrices)
              : null;

            return {
              ...hotel,
              price: minRoomPrice && nights > 0 ? minRoomPrice * nights : null,
            };
          })
          .filter((hotel) => hotel.price !== null);

        setHotels(hotelsWithPrices);
      } catch (error) {
        console.error("❌ Failed to fetch hotels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [filters, nights]);

  const applyFilters = (hotels) => {
    return hotels.filter((hotel) => {
      const priceMatch =
        (!filters?.minPrice || hotel.price >= Number(filters.minPrice)) &&
        (!filters?.maxPrice || hotel.price <= Number(filters.maxPrice));
  
      const amenitiesMatch = filters?.amenities
        ? Object.entries(filters.amenities).every(
            ([key, value]) => !value || hotel.amenities?.includes(key)
          )
        : true;
  
      const selectedTypes = filters?.roomTypes
        ? Object.entries(filters.roomTypes)
            .filter(([_, checked]) => checked)
            .map(([type]) => type.toLowerCase())
        : [];
  
      const typeMatch =
        selectedTypes.length === 0 ||
        hotel.rooms?.some((room) =>
          selectedTypes.includes(room.type?.toLowerCase())
        );
  
      const minBeds = Number(filters?.minBeds || 0);
  
      const bedsMatch =
        !minBeds ||
        hotel.rooms?.some((room) => Number(room.beds || 0) >= minBeds);
  
      const refundableMatch =
        !filters?.refundable ||
        hotel.rooms?.some((room) => room.isRefundable === true);
  
      return (
        priceMatch &&
        amenitiesMatch &&
        typeMatch &&
        bedsMatch &&
        refundableMatch
      );
    });
  };  

  const filteredHotels = applyFilters(hotels);

  // ✅ Sort hotels after filtering
  const sortedHotels = [...filteredHotels].sort((a, b) => {
    switch (sortBy) {
      case "price-asc":
        return (a.price || 0) - (b.price || 0);
      case "price-desc":
        return (b.price || 0) - (a.price || 0);
      case "rating-desc":
        return (b.rating || 0) - (a.rating || 0);
      case "newest":
        return new Date(b.createdAt) - new Date(a.createdAt);
      default:
        return 0;
    }
  });

  if (loading) return <p>Loading hotels...</p>;

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.topBar}>
        <div className={styles.toggleButtons}>
          <button
            onClick={() => setViewType("grid")}
            className={viewType === "grid" ? styles.active : ""}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewType("list")}
            className={viewType === "list" ? styles.active : ""}
          >
            List View
          </button>
        </div>

        <div className={styles.sortContainer}>
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating-desc">Rating: High to Low</option>
            <option value="newest">Newest Listings</option>
          </select>
        </div>
      </div>

      <div className={`${styles.cardsWrapper} ${styles[viewType]}`}>
        {sortedHotels.length > 0 ? (
          sortedHotels.map((hotel) => (
            <HotelCard key={hotel._id} hotel={hotel} viewType={viewType} />
          ))
        ) : (
          <p>No hotels match the selected filters.</p>
        )}
      </div>
    </div>
  );
};

export default HotelResultsView;