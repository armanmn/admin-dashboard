"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RoomBookingInfo from "@/components/admin/booking/RoomBookingInfo";
import PaymentInfo from "@/components/admin/booking/PaymentInfo";
import MainStatusSummary from "@/components/admin/booking/MainStatusSummary";
import styles from "@/styles/bookingStatus.module.css";
import api from "@/utils/api";

const BookingStatusPage = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${id}`);
        console.log("📦 Booking received from backend:", res);
        setBooking(res);
      } catch (error) {
        console.error("❌ Failed to fetch booking:", error);
      }
    };

    fetchBooking();
  }, [id]);

  const refreshBooking = async () => {
    try {
      const res = await api.get(`/bookings/${id}`);
      setBooking(res);
    } catch (error) {
      console.error("❌ Failed to refresh booking:", error);
    }
  };

  if (!booking) return <p>⏳ Loading booking data...</p>;

  return (
    <div className={styles.statusContainer}>
      <RoomBookingInfo booking={booking} />
      <PaymentInfo
        payment={{
          method: booking.paymentMethod,
          status: booking.paymentStatus,
        }}
        bookingId={booking._id}
        onPaymentSuccess={refreshBooking}
      />
      <MainStatusSummary
        status={{
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
        }}
      />
    </div>
  );
};

export default BookingStatusPage;
