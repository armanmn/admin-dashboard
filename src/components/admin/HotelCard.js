import React from "react";
import Link from "next/link";
import styles from "@/styles/hotelCard.module.css";

const HotelCard = ({ hotel, viewType }) => {
  const imageSrc = hotel.images?.[0] || "/placeholder.jpg";

  return (
    <Link href={`/admin/bookings/hotel/${hotel._id}`} className={styles.link}>
      <div className={`${styles.card} ${styles[viewType]}`}>
        <div className={styles.imageWrapper}>
          <img src={imageSrc} alt={hotel.name} className={styles.image} />
        </div>

        <div className={styles.content}>
          <h3 className={styles.title}>{hotel.name}</h3>
          <p className={styles.location}>
            {hotel.location?.city}, {hotel.location?.country}
          </p>

          {viewType === "list" && (
            <p className={styles.description}>{hotel.description}</p>
          )}

          <div className={styles.details}>
            <span className={styles.rating}>⭐ {hotel.rating || 0}</span>
            <span className={styles.price}>From ${hotel.price || "--"} / night</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default HotelCard;