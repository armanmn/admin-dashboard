// "use client";
// import React, { useState } from "react";
// import styles from "@/styles/bookingStatus.module.css";
// import CreditCardForm from "@/components/admin/CreditCardForm";
// import api from "@/utils/api";

// const PaymentInfo = ({ payment, bookingId, onPaymentSuccess }) => {
//   const [showPaymentForm, setShowPaymentForm] = useState(false);
//   const [status, setStatus] = useState(payment?.status || "not_paid");

//   const handlePaymentSubmit = async () => {
//     try {
//       await api.patch(`/bookings/${bookingId}/pay`);
//       alert("✅ Payment submitted. Awaiting verification.");
//       setStatus("paid_pending_verification");
//       setShowPaymentForm(false);

//       if (onPaymentSuccess) {
//         onPaymentSuccess(); // ✅ Ծանուցիր ծնողին՝ booking-ը թարմացնելու համար
//       }
//     } catch (err) {
//       console.error("❌ Payment update failed:", err);
//       alert("❌ Failed to submit payment.");
//     }
//   };

//   if (!payment?.method) return <p>⚠️ No payment info available.</p>;

//   return (
//     <div className={styles.card}>
//       <h3 className={styles.sectionTitle}>Payment Info</h3>
//       <p className={styles.field}>
//         <span className={styles.label}>Method:</span> {payment.method}
//       </p>

//       <p className={styles.field}>
//         <span className={styles.label}>Status:</span> {status}
//       </p>

//       {showPaymentForm ? (
//         <CreditCardForm onSubmit={handlePaymentSubmit} showControls={true} />
//       ) : (
//         status === "not_paid" && (
//           <button
//             className={`${styles.actionBtn} ${styles.pay}`}
//             onClick={() =>
//               booking.paymentMethod === "credit_card"
//                 ? setShowPaymentForm(true)
//                 : handlePaymentSubmit()
//             }
//           >
//             💳 Pay Now
//           </button>
//         )
//       )}
//     </div>
//   );
// };

// export default PaymentInfo;
