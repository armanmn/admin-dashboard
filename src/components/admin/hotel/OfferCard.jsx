"use client";
import React from "react";
// import styles from "@/styles/OfferCard.module.css"; // այժմ չօգտագործենք

// Offer օբյեկտները կարող են լինել տարբեր կառուցվածքով՝ հստակ defensively render անենք
export default function OfferCard({ offer }) {
  if (!offer || typeof offer !== "object") return null;

  const rooms =
    Array.isArray(offer.rooms) ? offer.rooms :
    Array.isArray(offer.Rooms) ? offer.Rooms :
    [];

  const board = offer.board || offer.RoomBasis || "";
  const refundable =
    typeof offer.refundable === "boolean" ? offer.refundable :
    typeof offer.NonRef === "boolean" ? !offer.NonRef : undefined;

  const cxlDeadline = offer.cxlDeadline || offer.CxlDeadLine || null;

  const amount =
    offer?.price?.amount ??
    offer?.amount ??
    offer?.TotalPrice ??
    null;

  const currency =
    offer?.price?.currency ??
    offer?.currency ??
    offer?.Currency ??
    "";

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: 12,
        background: "#fff",
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ fontWeight: 700 }}>
        {rooms?.length ? rooms.join(" • ") : (offer?.roomName || "Room")}
        {board ? ` • ${board}` : ""}
      </div>

      <div style={{ fontSize: 13, color: "#555" }}>
        {refundable === undefined
          ? "Refundability: n/a"
          : refundable
          ? "✅ Refundable"
          : "⚠️ Non-refundable"}
        {cxlDeadline ? ` • CXL deadline: ${cxlDeadline}` : ""}
      </div>

      <div style={{ fontWeight: 800 }}>
        {amount != null ? `${amount} ${currency}` : "Price on request"}
      </div>
    </div>
  );
}