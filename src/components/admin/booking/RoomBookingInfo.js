import React from "react";
import styles from "@/styles/bookingStatus.module.css";

const RoomBookingInfo = ({ booking }) => {
  const hotel = booking.hotel || {};
  const room = booking.room || {};
  const guest = booking.guest?.leadGuest || {};

  const formatDate = (date) => new Date(date).toLocaleDateString("en-GB");

  return (
    <div className={styles.card}>
      <h3>Room Booking Info</h3>
      <img src={hotel.image} alt={hotel.name} className={styles.image} />
      <p>
        <strong>Hotel:</strong> {hotel.name} ({hotel.location?.city},{" "}
        {hotel.location?.country})
      </p>
      <p>
        <strong>Room:</strong> {room.type}
      </p>
      <p>
        <strong>Check-in:</strong> {formatDate(booking.checkInDate)}
      </p>
      <p>
        <strong>Check-out:</strong> {formatDate(booking.checkOutDate)}
      </p>
      <p>
        <strong>Guests:</strong> {guest.firstName} {guest.lastName}
      </p>
      <p>
        <strong>Total Price:</strong> ${booking.totalPrice}
      </p>
    </div>
  );
};

export default RoomBookingInfo;