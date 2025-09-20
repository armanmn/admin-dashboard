// // RoomCard.js (New 4-column layout)

// import React, { useState } from "react";
// import RoomImageModal from "@/components/admin/RoomImageModal";

// import Link from "next/link";
// import styles from "@/styles/roomCard.module.css";

// import calculateBonus from "@/utils/calculateBonus";
// import { useAuthStore } from "@/stores/authStore";
// import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";

// const RoomCard = ({ room, hotelId }) => {
//   const [isModalOpen, setModalOpen] = useState(false);
//   const user = useAuthStore((state) => state.user);
//   const checkInDate = useSearchCriteriaStore((state) => state.checkInDate);
//   const checkOutDate = useSearchCriteriaStore((state) => state.checkOutDate);

//   const handleImageClick = () => {
//     if (room.images && room.images.length > 0) {
//       setModalOpen(true);
//     }
//   };

//   const nights = Math.max(
//     (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24),
//     1
//   );

//   const totalPrice = room.price * nights;
//   const bonus = calculateBonus(totalPrice, user);

//   return (
//     <div className={styles.cardWrapper}>
//       {/* Column 1: Image and Basic Info */}
//       <div className={styles.imageSection} onClick={handleImageClick}>
//         <img
//           src={room.image || "/images/placeholder-room.jpg"}
//           alt={room.type || "Room"}
//           className={styles.image}
//         />
//         <p className={styles.roomType}>{room.type || "Unnamed Room"}</p>
//         <p className={styles.roomSize}>{room.size || "Unknown size"}</p>
//       </div>

//       <RoomImageModal
//         images={room.images || [room.image || "/images/placeholder-room.jpg"]}
//         isOpen={isModalOpen}
//         onClose={() => setModalOpen(false)}
//       />

//       {/* Column 2: Facilities */}
//       <div className={styles.facilitiesSection}>
//         {room.mealPlan && <p>🍽️ {room.mealPlan}</p>}
//         {room.isRefundable ? (
//           <p className={styles.refundable}>✅ Refundable</p>
//         ) : (
//           <p className={styles.nonRefundable}>❌ Non-refundable</p>
//         )}
//         <p>{room.amenities?.includes("wifi") && "📶 Free Wi-Fi"}</p>
//         <p>
//           {room.amenities?.includes("air_conditioning") &&
//             "❄️ Air Conditioning"}
//         </p>
//       </div>

//       {/* Column 3: Occupancy */}
//       <div className={styles.occupancySection}>
//         <p>🛏️ {room.beds || "-"} beds</p>
//         <p>👥 Max {room.maxOccupancy} guests</p>
//         <p>🚸 Children allowed</p>
//       </div>

//       {/* Column 4: Pricing and Actions */}
//       <div className={styles.priceSection}>
//         <p className={styles.totalPrice}>{totalPrice} ֏ total</p>
//         <p className={styles.perNight}>
//           ({room.price} ֏ / night × {nights})
//         </p>
//         {bonus > 0 && <p className={styles.bonus}>🎁 Earn {bonus} ֏ bonus</p>}
//         <Link
//           href={`/admin/bookings/hotel/confirm?hotelId=${hotelId}&roomId=${room._id}`}
//           className={styles.bookBtn}
//         >
//           Book This Room
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default RoomCard;
