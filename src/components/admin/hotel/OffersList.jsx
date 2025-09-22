"use client";
import React from "react";
import OfferCard from "@/components/admin/hotel/OfferCard";
// import styles from "@/styles/OffersList.module.css"; // հիմա կարող է դատարկ մնալ

export default function OffersList({ offers = [] }) {
  if (!Array.isArray(offers) || offers.length === 0) {
    return <div style={{ color: "#9ca3af" }}>No offers</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {offers.map((offer, idx) => (
        <OfferCard key={offer?.HotelSearchCode || idx} offer={offer} />
      ))}
    </div>
  );
}