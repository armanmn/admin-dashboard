"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import HotelDetails from "@/components/admin/HotelDetails";
import HotelSearchBar from "@/components/admin/HotelSearchBar";

import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";

const HotelDetailsPage = () => {
  const { id } = useParams();
  const [hotel, setHotel] = useState(null);

  const {
    city,
    checkInDate,
    checkOutDate,
    adults,
    children,
    rooms,
    setCriteria,
  } = useSearchCriteriaStore();

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const res = await api.get(`/hotels/${id}`);
        setHotel(res);
      } catch (error) {
        console.error("❌ Failed to fetch hotel:", error);
      }
    };

    fetchHotel();
  }, [id]);

  if (!hotel) return <p>Loading hotel...</p>;

  return (
    <div className="flex flex-col gap-6">
      {/* ✅ Always top search bar */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <HotelSearchBar
          initialValues={{
            location: city || hotel?.location?.city || "",
            checkInDate,
            checkOutDate,
            adults,
            children,
            rooms,
          }}
          onSearch={(searchData) => {
            // ✅ Correctly map "location" → "city" for store
            console.log("📨 HotelSearchBar returned:", searchData);
            setCriteria({
              city: searchData.location,
              checkInDate: searchData.checkInDate,
              checkOutDate: searchData.checkOutDate,
              adults: searchData.adults,
              children: searchData.children,
              rooms: searchData.rooms,
            });
          }}
        />
      </div>

      {/* ✅ Hotel details below search bar */}
      <HotelDetails hotel={hotel} />
    </div>
  );
};

export default HotelDetailsPage;