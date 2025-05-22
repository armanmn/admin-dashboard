import React, { useEffect, useState } from "react";
import RoomCard from "./RoomCard";
import styles from "@/styles/hotelDetails.module.css";
import api from "@/utils/api";

const HotelDetails = ({ hotel }) => {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get(`/rooms/hotel/${hotel._id}`);
        setRooms(res);
      } catch (err) {
        console.error("❌ Failed to fetch rooms:", err);
      }
    };
    if (hotel?._id) fetchRooms();
  }, [hotel]);

  if (!hotel) return <p>Hotel not found.</p>;

  return (
    <div className={styles.container}>
      <h2>{hotel.name}</h2>
      <p className={styles.location}>
        {hotel.location?.city}, {hotel.location?.country}
      </p>
      <img src={hotel.image} alt={hotel.name} className={styles.coverImage} />

      <div className={styles.infoSection}>
        <p>{hotel.description}</p>
        <div className={styles.details}>
          <span>⭐ {hotel.rating} rating</span>
          <span>Price from ${hotel.price} / night</span>
        </div>

        <div className={styles.amenities}>
          <h4>Amenities:</h4>
          <ul>
            {hotel.amenities?.map((a, index) => (
              <li key={index}>{a}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* ✅ Սենյակների ցուցադրում */}
      <div style={{ marginTop: "40px" }}>
        <h3>Available Rooms</h3>
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <RoomCard key={room._id} room={room} hotelId={hotel._id} />
          ))
        ) : (
          <p>No rooms available for this hotel.</p>
        )}
      </div>
    </div>
  );
};

export default HotelDetails;