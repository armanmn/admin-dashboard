"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BookingConfirmationForm from "@/components/admin/BookingConfirmationForm";
import api from "@/utils/api";

const BookingConfirmPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hotelId = searchParams.get("hotelId");
  const roomId = searchParams.get("roomId");

  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const hotelRes = await api.get(`/hotels/${hotelId}`);
        const roomRes = await api.get(`/rooms/${roomId}`);
        setHotel(hotelRes);
        setRoom(roomRes);
      } catch (error) {
        console.error("❌ Failed to fetch booking data:", error);
      }
    };

    if (hotelId && roomId) fetchData();
  }, [hotelId, roomId]);

  const handleConfirmBooking = async (formData) => {
    try {
      console.log("📤 Final Booking Payload:", formData); // ✅ սրա մեջ hotel/room պետք է լինեն string ID-ներ
  
      const response = await api.post("/bookings", formData);
      const bookingId = response.bookingId;
  
      console.log("✅ Booking created with ID:", bookingId);
      router.push(`/admin/bookings/status/${bookingId}`);
    } catch (error) {
      console.error("❌ Booking creation failed:", error);
    }
  };
  

  if (!hotel || !room) return <p>Loading booking details...</p>;

  return (
    <BookingConfirmationForm
      hotel={hotel}
      room={room}
      hotelId={hotelId}
      roomId={roomId}
      onSubmit={handleConfirmBooking}
    />
  );
};

export default BookingConfirmPage;
