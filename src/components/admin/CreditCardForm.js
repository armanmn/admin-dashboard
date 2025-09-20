// "use client";
// import React, { useState, useEffect } from "react";
// import styles from "@/styles/creditCardForm.module.css";

// const CreditCardForm = ({ onSubmit, onChange, showControls = true }) => {
//   const [cardName, setCardName] = useState("");
//   const [cardNumber, setCardNumber] = useState("");
//   const [expiryMonth, setExpiryMonth] = useState("");
//   const [expiryYear, setExpiryYear] = useState("");
//   const [cvv, setCvv] = useState("");
//   const [agree, setAgree] = useState(false);

//   const paymentData = {
//     cardName,
//     cardNumber,
//     expiryMonth,
//     expiryYear,
//     cvv,
//   };

//   useEffect(() => {
//     if (!showControls && onChange) {
//       onChange(paymentData);
//     }
//   }, [cardName, cardNumber, expiryMonth, expiryYear, cvv]);

//   const handleSubmit = () => {
//     if (!agree) {
//       alert("❗ Please agree to the terms and conditions.");
//       return;
//     }

//     if (onSubmit) {
//       onSubmit(paymentData);
//     }
//   };

//   return (
//     <div className={styles.container}>
//       <div className={styles.row}>
//         <div className={styles.field}>
//           <label>Card Holder Name</label>
//           <input
//             type="text"
//             value={cardName}
//             onChange={(e) => setCardName(e.target.value)}
//             required
//           />
//         </div>
//         <div className={styles.field}>
//           <label>Card Number</label>
//           <input
//             type="text"
//             value={cardNumber}
//             onChange={(e) => setCardNumber(e.target.value)}
//             required
//           />
//         </div>
//       </div>

//       <div className={styles.cardRow}>
//         <div className={styles.field}>
//           <label>Expiry Month</label>
//           <input
//             type="text"
//             placeholder="MM"
//             value={expiryMonth}
//             onChange={(e) => setExpiryMonth(e.target.value)}
//             required
//           />
//         </div>
//         <div className={styles.field}>
//           <label>Expiry Year</label>
//           <input
//             type="text"
//             placeholder="YY"
//             value={expiryYear}
//             onChange={(e) => setExpiryYear(e.target.value)}
//             required
//           />
//         </div>
//         <div className={styles.field}>
//           <label>CVV</label>
//           <input
//             type="text"
//             placeholder="CVV"
//             value={cvv}
//             onChange={(e) => setCvv(e.target.value)}
//             required
//           />
//         </div>
//       </div>

//       {showControls && (
//         <>
//           <div className={styles.checkboxContainer}>
//             <input
//               type="checkbox"
//               checked={agree}
//               onChange={(e) => setAgree(e.target.checked)}
//             />
//             <label>
//               By continuing, you agree to the <a href="#">Terms and Conditions</a>.
//             </label>
//           </div>

//           <button
//             type="button"
//             className={styles.confirmBtn}
//             onClick={handleSubmit}
//           >
//             Confirm Payment
//           </button>
//         </>
//       )}
//     </div>
//   );
// };

// export default CreditCardForm;