// "use client";
// import React, { useState } from "react";
// import ordersData from "@/data/ordersData";
// import styles from "@/styles/ordersList.module.css";
// import { useRouter } from "next/navigation";

// const OrdersList = () => {
//   const router = useRouter();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");

//   const handleView = (id) => {
//     router.push(`/admin/bookings/orders/${id}`);
//   };

//   const filteredOrders = ordersData.filter((order) => {
//     const matchesSearch =
//       `${order.firstName} ${order.lastName} ${order.hotel} ${order.city} ${order.pnr}`
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase());

//     const matchesStatus =
//       statusFilter === "all" || order.status === statusFilter;

//     return matchesSearch && matchesStatus;
//   });

//   const totalBookings = filteredOrders.length;
//   const totalConfirmed = filteredOrders.filter(
//     (o) => o.status === "confirmed"
//   ).length;
//   const totalCancelled = filteredOrders.filter(
//     (o) => o.status === "cancelled"
//   ).length;
//   const totalConfirmedPrice = filteredOrders
//     .filter((o) => o.status === "confirmed")
//     .reduce((sum, o) => sum + o.price, 0);

//   return (
//     <div className={styles.container}>
//       <h2>All Bookings</h2>

//       <div className={styles.statsRow}>
//   <div className={styles.statBox}>
//     <h4>Total Bookings</h4>
//     <p>{totalBookings}</p>
//   </div>
//   <div className={styles.statBox}>
//     <h4>Confirmed</h4>
//     <p>{totalConfirmed}</p>
//   </div>
//   <div className={styles.statBox}>
//     <h4>Cancelled</h4>
//     <p>{totalCancelled}</p>
//   </div>
//   <div className={styles.statBox}>
//     <h4>Confirmed Total ($)</h4>
//     <p>${totalConfirmedPrice}</p>
//   </div>
// </div>

//       <div className={styles.filters}>
//         <input
//           type="text"
//           placeholder="Search by name, hotel, city, PNR..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className={styles.searchInput}
//         />
//         <select
//           value={statusFilter}
//           onChange={(e) => setStatusFilter(e.target.value)}
//           className={styles.statusSelect}
//         >
//           <option value="all">All Statuses</option>
//           <option value="pending">Pending</option>
//           <option value="confirmed">Confirmed</option>
//           <option value="cancelled">Cancelled</option>
//         </select>
//       </div>

//       <table className={styles.table}>
//         <thead>
//           <tr>
//             <th>ID</th>
//             <th>Passenger</th>
//             <th>Status</th>
//             <th>Hotel</th>
//             <th>City</th>
//             <th>PNR</th>
//             <th>Check-in</th>
//             <th>Nights</th>
//             <th>Price</th>
//             <th>Currency</th>
//             <th>Action</th>
//           </tr>
//         </thead>
//         <tbody>
//           {filteredOrders.map((order) => (
//             <tr key={order.id}>
//               <td>{order.id}</td>
//               <td>
//                 {order.firstName} {order.lastName}
//               </td>
//               <td>{order.status}</td>
//               <td>{order.hotel}</td>
//               <td>{order.city}</td>
//               <td>{order.pnr}</td>
//               <td>{order.checkIn}</td>
//               <td>{order.nights}</td>
//               <td>${order.price}</td>
//               <td>{order.currency}</td>
//               <td>
//                 <button onClick={() => handleView(order.id)}>View</button>
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default OrdersList;
