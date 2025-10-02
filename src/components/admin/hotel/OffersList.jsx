"use client";
import React, { useMemo, useCallback } from "react";
import OfferCard from "@/components/admin/hotel/OfferCard";
import { useSelectionStore } from "@/stores/selectionStore";

// Build selection item from offer
function buildSelectionItem(offer, arrivalDate) {
  const key =
    offer?.searchCode ||
    offer?.HotelSearchCode ||
    `${offer?.roomName || "room"}-${offer?.board || ""}-${offer?.price?.amount || ""}-${offer?.price?.currency || ""}`;

  const priceRetail = offer?.retail
    ? { amount: offer.retail.amount, currency: offer.retail.currency }
    : offer?.price
    ? { amount: offer.price.amount, currency: offer.price.currency }
    : null;

  const platformRef =
    typeof offer?.cancellation?.platform?.refundable === "boolean"
      ? offer.cancellation.platform.refundable
      : undefined;

  return {
    key,
    searchCode: offer?.searchCode || offer?.HotelSearchCode || null,
    offerProof: offer?.offerProof || null,
    arrivalDate: arrivalDate || null,
    roomName: offer?.roomName || (Array.isArray(offer?.Rooms) ? offer.Rooms[0] : "Room"),
    board: offer?.board || offer?.RoomBasis || null,
    qty: 1,
    priceRetail: priceRetail,         // what we display/charge
    price: offer?.price || null,      // net fallback kept for internal references if needed
    refundable:
      platformRef !== undefined ? platformRef : (typeof offer?.refundable === "boolean" ? offer.refundable : null),
    platformCutoffUtc: offer?.cancellation?.platform?.cutoffUtc || null,
    cancellation: offer?.cancellation || null,
  };
}

export default function OffersList({ offers = [], arrivalDate }) {
  const items = useSelectionStore((s) => s.items);
  const addItem = useSelectionStore((s) => s.addItem);
  const removeItem = useSelectionStore((s) => s.removeItem);

  const selectedKeys = useMemo(
    () => new Set(items.map((i) => i.key)),
    [items]
  );

  const handleToggle = useCallback(
    (offer) => {
      const item = buildSelectionItem(offer, arrivalDate);
      if (selectedKeys.has(item.key)) removeItem(item.key);
      else addItem(item);
    },
    [arrivalDate, selectedKeys, addItem, removeItem]
  );

  if (!Array.isArray(offers) || offers.length === 0) {
    return <div style={{ color: "#9ca3af" }}>No offers</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {offers.map((offer, idx) => {
        const k = offer?.searchCode || offer?.HotelSearchCode || String(idx);
        const selected = selectedKeys.has(offer?.searchCode || offer?.HotelSearchCode);
        return (
          <OfferCard
            key={k}
            offer={offer}
            selected={!!selected}
            onToggle={() => handleToggle(offer)}
          />
        );
      })}
    </div>
  );
}