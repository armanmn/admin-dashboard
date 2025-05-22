"use client";

import React, { useEffect, useState } from "react";
import api from "@/utils/api";
import HotelCard from "./HotelCard";
import styles from "@/styles/hotelResultsView.module.css";

const HotelResultsView = ({ filters }) => {
  const [viewType, setViewType] = useState("grid");
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHotels = async () => {
      console.log("🧪 Frontend filters:", filters);
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

        console.log("🌐 Query being sent:", query);
        setHotels(res);
        console.log("🏨 Hotels response:", res);
      } catch (error) {
        console.error("❌ Failed to fetch hotels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [filters]);

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

      return priceMatch && amenitiesMatch;
    });
  };

  const filteredHotels = applyFilters(hotels);

  if (loading) return <p>Loading hotels...</p>;

  return (
    <div className={styles.resultsContainer}>
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

      <div className={`${styles.cardsWrapper} ${styles[viewType]}`}>
        {filteredHotels.length > 0 ? (
          filteredHotels.map((hotel) => (
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
