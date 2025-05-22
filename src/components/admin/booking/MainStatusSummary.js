import React from "react";
import styles from "@/styles/bookingStatus.module.css";

const getFinalBookingStatus = (bookingStatus, paymentStatus) => {
  if (bookingStatus === "cancelled") return "cancelled_by_user";
  if (bookingStatus === "rejected_by_partner") return "rejected";
  if (paymentStatus === "refunded") return "refunded";

  if (paymentStatus === "not_paid") return "awaiting_payment";
  if (paymentStatus === "paid_pending_verification") return "payment_under_review";
  if (paymentStatus === "verified" && bookingStatus === "waiting_approval") return "awaiting_confirmation";
  if (paymentStatus === "verified" && bookingStatus === "confirmed") return "confirmed";

  return "pending";
};

const statusMessages = {
  awaiting_payment: "💰 Payment is pending. Please complete it.",
  payment_under_review: "🔍 Payment submitted. Awaiting verification.",
  awaiting_confirmation: "✅ Payment verified. Awaiting booking confirmation.",
  confirmed: "🎉 Your booking is confirmed!",
  cancelled_by_user: "❌ This booking has been cancelled by you.",
  cancelled_due_to_no_payment: "⚠️ Booking cancelled due to non-payment.",
  rejected: "🚫 Booking request was rejected by the hotel.",
  refunded: "💸 Payment was refunded.",
  pending: "⏳ Processing your booking...",
};

const statusColors = {
  awaiting_payment: "#f0ad4e",
  payment_under_review: "#5bc0de",
  awaiting_confirmation: "#337ab7",
  confirmed: "#5cb85c",
  cancelled_by_user: "#d9534f",
  cancelled_due_to_no_payment: "#d9534f",
  rejected: "#d9534f",
  refunded: "#0275d8",
  pending: "#999999",
};

const MainStatusSummary = ({ status }) => {
  const finalStatus = getFinalBookingStatus(status.bookingStatus, status.paymentStatus);

  return (
    <div
      className={styles.statusBox}
      style={{ backgroundColor: statusColors[finalStatus] }}
    >
      {statusMessages[finalStatus]}
    </div>
  );
};

export default MainStatusSummary;