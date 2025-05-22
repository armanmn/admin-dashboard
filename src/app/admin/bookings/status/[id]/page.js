"use client";
import React from "react";
import { useParams } from "next/navigation";
import BookingStatusPage from "@/components/admin/BookingStatusPage";

const Page = () => {
  const { id } = useParams();

  return <BookingStatusPage bookingId={parseInt(id)} />;
};

export default Page;