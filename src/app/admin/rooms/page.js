"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/utils/api";
import { useAuthStore } from "@/stores/authStore";

const RoomsListPage = () => {
  const { user } = useAuthStore();
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("");
  const [rooms, setRooms] = useState([]);

  // ✅ Բերում ենք հյուրանոցները ըստ օգտատիրոջ
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await api.get("/hotels");
        setHotels(res);

        if (res.length === 1) {
          setSelectedHotelId(res[0]._id);
        }
      } catch (err) {
        console.error("❌ Failed to load hotels", err);
      }
    };

    fetchHotels();
  }, []);

  // ✅ Բերում ենք սենյակները ըստ ընտրված հյուրանոցի
  useEffect(() => {
    if (!selectedHotelId) return;

    const fetchRooms = async () => {
      try {
        const res = await api.get(`/rooms/hotel/${selectedHotelId}`);
        setRooms(res);
      } catch (err) {
        console.error("❌ Failed to load rooms", err);
      }
    };

    fetchRooms();
  }, [selectedHotelId]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Room List</h1>

      {hotels.length > 1 && (
        <>
          <label>Select Hotel:</label>
          <select
            value={selectedHotelId}
            onChange={(e) => setSelectedHotelId(e.target.value)}
            style={{ marginBottom: "16px", display: "block" }}
          >
            <option value="">-- Select a Hotel --</option>
            {hotels.map((hotel) => (
              <option key={hotel._id} value={hotel._id}>
                {hotel.name}
              </option>
            ))}
          </select>
        </>
      )}

      {selectedHotelId && (
        <div>
          {(user.role === "admin" || user.role === "b2b_hotel_partner") && (
            <Link
              href={`/admin/rooms/add?hotelId=${selectedHotelId}`}
              style={{
                display: "inline-block",
                marginBottom: "16px",
                background: "#f36323",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                textDecoration: "none",
              }}
            >
              ➕ Add Room
            </Link>
          )}

          <ul style={{ paddingLeft: "0", listStyle: "none" }}>
            {rooms.map((room) => (
              <li
                key={room._id}
                style={{
                  padding: "12px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  marginBottom: "12px",
                }}
              >
                <div>
                  <strong>
                    {room.baseType}
                    {room.variant ? ` – ${room.variant}` : ""}
                    {room.view ? ` (${room.view})` : ""}
                    {room.mealPlan ? ` – ${room.mealPlan}` : ""}
                  </strong>{" "}
                  — {room.price} ֏
                </div>
                <Link href={`/admin/rooms/edit/${room._id}`}>✏️ Edit</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default RoomsListPage;
