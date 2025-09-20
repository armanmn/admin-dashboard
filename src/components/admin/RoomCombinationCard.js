// "use client";

// import React from "react";
// import styles from "@/styles/RoomCombinationCard.module.css";
// import RoomCard from "./RoomCard";
// import Link from "next/link";

// const RoomCombinationCard = ({ combination, hotelId }) => {
//   if (!combination || combination.length === 0) return null;

//   const totalPrice = combination.reduce(
//     (sum, room) => sum + (room.totalPrice || 0),
//     0
//   );

//   return (
//     <div className={styles.card}>
//       <h4>Suggested Room Combination</h4>

//       <div className={styles.roomList}>
//         {combination.map((room) => (
//           <RoomCard room={room} hotelId={hotelId} hideBookButton={true} />
//         ))}
//       </div>

//       <div className={styles.summary}>
//         <p>
//           <strong>Total Price:</strong> ${totalPrice.toFixed(2)}
//         </p>
//         <Link
//           href={`/admin/bookings/new?hotelId=${hotelId}&roomIds=${combination
//             .map((r) => r._id)
//             .join(",")}`}
//           className={styles.bookButton}
//         >
//           Book This Combination
//         </Link>
//       </div>
//     </div>
//   );
// };

// export default RoomCombinationCard;