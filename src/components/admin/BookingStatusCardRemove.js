import React from "react";
import styles from "@/styles/bookingStatus.module.css";

const BookingStatusCard = ({ booking }) => {
  const {
    hotel,
    room,
    guest,
    checkIn,
    checkOut,
    totalPrice,
    status,
    refundableUntil,
  } = booking;

  const statusMessages = {
    pending_payment:
      "Payment is pending. Please complete it before the deadline.",
    confirmed: "Your booking is confirmed!",
    cancelled: "This booking has been cancelled.",
    rejected_by_partner:
      "Sorry, your booking request was rejected by the hotel.",
    refunded: "Payment was refunded.",
  };

  const statusColor = {
    pending_payment: "#f0ad4e",
    confirmed: "#5cb85c",
    cancelled: "#d9534f",
    rejected_by_partner: "#d9534f",
    refunded: "#5bc0de",
  };

  const handlePayment = () => {
    alert("Redirecting to payment gateway...");
    // Ավելի ուշ՝ կարող ես router.push("/admin/bookings/pay/[id]") կամ բացել Modal
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );
    if (confirmCancel) {
      alert("Booking cancelled!");
      // Այստեղ կլինի API call → update status → redirect or state update
    }
  };

  return (
    <div className={styles.container}>
      <h2>Booking Status</h2>
      <div
        className={styles.statusBox}
        style={{ backgroundColor: statusColor[status] }}
      >
        <strong>Status:</strong> {statusMessages[status]}
      </div>

      <div className={styles.details}>
        <div className={styles.column}>
          <img src={hotel.image} alt={hotel.name} className={styles.image} />
          <h3>{hotel.name}</h3>
          <p>{hotel.location}</p>
          <p>Room: {room.name}</p>
          <p>
            Check-in: {checkIn} | Check-out: {checkOut}
          </p>
          <p>Guests: {booking.guests}</p>
          <p>Total: ${totalPrice}</p>
        </div>

        <div className={styles.column}>
          <h4>Guest Info</h4>
          <p>
            {guest.firstName} {guest.lastName}
          </p>
          <p>{guest.email}</p>
          <p>{guest.phone}</p>

          {status === "pending_payment" && (
            <button className={styles.payBtn} onClick={handlePayment}>
              💳 Proceed to Payment
            </button>
          )}
          {status === "confirmed" && (
            <button className={styles.voucherBtn}>📄 Download Voucher</button>
          )}
          {(status === "pending_payment" || status === "confirmed") && (
            <button className={styles.cancelBtn} onClick={handleCancel}>
              ❌ Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingStatusCard;
