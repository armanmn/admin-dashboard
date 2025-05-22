import React from "react";
import Link from "next/link";
import styles from "@/styles/roomCard.module.css";

import calculateBonus from "@/utils/calculateBonus";
import { useAuthStore } from "@/stores/authStore";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";

const RoomCard = ({ room, hotelId }) => {
  const user = useAuthStore((state) => state.user);
  const checkInDate = useSearchCriteriaStore((state) => state.checkInDate);
  const checkOutDate = useSearchCriteriaStore((state) => state.checkOutDate);

  const nights = Math.max(
    (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24),
    1
  );

  const totalPrice = room.price * nights;
  const bonus = calculateBonus(totalPrice, user);

  console.log("✅ From Zustand:", { checkInDate, checkOutDate });

  console.log("💰 Bonus debug:", {
    location,
    checkInDate,
    checkOutDate,
    nights,
    roomPrice: room.price,
    totalPrice,
    user,
    loyaltyRate: user.loyaltyRate,
    bonus,
  });

  return (
    <div className={styles.card}>
      <img
        src={room.image || "/images/placeholder-room.jpg"}
        alt={room.type || "Room"}
        className={styles.image}
      />
      <div className={styles.content}>
        <h3>{room.type || "Unnamed Room"}</h3>
        <p className={styles.description}>
          {room.description || "No description available."}
        </p>
        <div className={styles.meta}>
          <span>
            {room.maxOccupancy ? `${room.maxOccupancy} guests` : "No info"}
          </span>
          <span>{room.beds ? `${room.beds} beds` : "No info"}</span>
          <span>
            {room.bathrooms ? `${room.bathrooms} bathrooms` : "No info"}
          </span>
          <span>{room.size || "No size info"}</span>
        </div>
        <div className={styles.footer}>
          <div className={styles.priceInfo}>
            <span className={styles.totalPrice}>{totalPrice} ֏ ընդհանուր</span>
            <span className={styles.perNight}>
              ({room.price} ֏ / գիշեր × {nights} գիշեր)
            </span>
          </div>

          {bonus > 0 && (
            <div className={styles.bonusInfo}>
              🎁 Earn <strong>{bonus}֏</strong> loyalty bonus
            </div>
          )}

          <Link
            href={`/admin/bookings/hotel/confirm?hotelId=${hotelId}&roomId=${room._id}`}
            className={styles.bookBtn}
          >
            Book This Room
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;