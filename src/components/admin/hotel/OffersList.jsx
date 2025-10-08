// "use client";
// import React, { useMemo, useCallback } from "react";
// import OfferCard from "@/components/admin/hotel/OfferCard";
// import { useSelectionStore } from "@/stores/selectionStore";

// // Build selection item from offer
// function buildSelectionItem(offer, arrivalDate) {
//   const key =
//     offer?.searchCode ||
//     offer?.HotelSearchCode ||
//     `${offer?.roomName || "room"}-${offer?.board || ""}-${offer?.price?.amount || ""}-${offer?.price?.currency || ""}`;

//   const priceRetail = offer?.retail
//     ? { amount: offer.retail.amount, currency: offer.retail.currency }
//     : offer?.price
//     ? { amount: offer.price.amount, currency: offer.price.currency }
//     : null;

//   const platformRef =
//     typeof offer?.cancellation?.platform?.refundable === "boolean"
//       ? offer.cancellation.platform.refundable
//       : undefined;

//   return {
//     key,
//     searchCode: offer?.searchCode || offer?.HotelSearchCode || null,
//     offerProof: offer?.offerProof || null,
//     arrivalDate: arrivalDate || null,
//     roomName: offer?.roomName || (Array.isArray(offer?.Rooms) ? offer.Rooms[0] : "Room"),
//     board: offer?.board || offer?.RoomBasis || null,
//     qty: 1,
//     priceRetail: priceRetail,         // what we display/charge
//     price: offer?.price || null,      // net fallback kept for internal references if needed
//     refundable:
//       platformRef !== undefined ? platformRef : (typeof offer?.refundable === "boolean" ? offer.refundable : null),
//     platformCutoffUtc: offer?.cancellation?.platform?.cutoffUtc || null,
//     cancellation: offer?.cancellation || null,
//   };
// }

// export default function OffersList({ offers = [], arrivalDate }) {
//   const items = useSelectionStore((s) => s.items);
//   const addItem = useSelectionStore((s) => s.addItem);
//   const removeItem = useSelectionStore((s) => s.removeItem);

//   const selectedKeys = useMemo(
//     () => new Set(items.map((i) => i.key)),
//     [items]
//   );

//   const handleToggle = useCallback(
//     (offer) => {
//       const item = buildSelectionItem(offer, arrivalDate);
//       if (selectedKeys.has(item.key)) removeItem(item.key);
//       else addItem(item);
//     },
//     [arrivalDate, selectedKeys, addItem, removeItem]
//   );

//   if (!Array.isArray(offers) || offers.length === 0) {
//     return <div style={{ color: "#9ca3af" }}>No offers</div>;
//   }

//   return (
//     <div style={{ display: "grid", gap: 10 }}>
//       {offers.map((offer, idx) => {
//         const k = offer?.searchCode || offer?.HotelSearchCode || String(idx);
//         const selected = selectedKeys.has(offer?.searchCode || offer?.HotelSearchCode);
//         return (
//           <OfferCard
//             key={k}
//             offer={offer}
//             selected={!!selected}
//             onToggle={() => handleToggle(offer)}
//           />
//         );
//       })}
//     </div>
//   );
// }

// "use client";
// import React, { useMemo, useCallback } from "react";
// import OfferCard from "@/components/admin/hotel/OfferCard";
// import { useSelectionStore } from "@/stores/selectionStore";

// // Build selection item from offer
// function buildSelectionItem(offer, arrivalDate) {
//   const key =
//     offer?.searchCode ||
//     offer?.HotelSearchCode ||
//     `${offer?.roomName || "room"}-${offer?.board || ""}-${offer?.price?.amount || ""}-${offer?.price?.currency || ""}`;

//   const priceRetail = offer?.retail
//     ? { amount: offer.retail.amount, currency: offer.retail.currency }
//     : offer?.price
//     ? { amount: offer.price.amount, currency: offer.price.currency }
//     : null;

//   const platformRef =
//     typeof offer?.cancellation?.platform?.refundable === "boolean"
//       ? offer.cancellation.platform.refundable
//       : undefined;

//   return {
//     key,
//     searchCode: offer?.searchCode || offer?.HotelSearchCode || null,
//     offerProof: offer?.offerProof || null,
//     arrivalDate: arrivalDate || null,
//     roomName:
//       offer?.roomName || (Array.isArray(offer?.Rooms) ? offer.Rooms[0] : "Room"),
//     board: offer?.board || offer?.RoomBasis || null,
//     qty: 1,
//     priceRetail,                // what we display/charge
//     price: offer?.price || null, // net fallback kept for internal references if needed
//     refundable:
//       platformRef !== undefined
//         ? platformRef
//         : typeof offer?.refundable === "boolean"
//         ? offer.refundable
//         : null,
//     platformCutoffUtc: offer?.cancellation?.platform?.cutoffUtc || null,
//     cancellation: offer?.cancellation || null,
//   };
// }

// export default function OffersList({
//   offers = [],
//   arrivalDate,
//   selectionLocked = false, // ← NEW
// }) {
//   const items = useSelectionStore((s) => s.items);
//   const addItem = useSelectionStore((s) => s.addItem);
//   const removeItem = useSelectionStore((s) => s.removeItem);

//   const selectedKeys = useMemo(() => new Set(items.map((i) => i.key)), [items]);

//   const handleToggle = useCallback(
//     (offer) => {
//       const item = buildSelectionItem(offer, arrivalDate);
//       const isSelected = selectedKeys.has(item.key);

//       // Lock behavior:
//       // - if something is already selected (selectionLocked === true)
//       // - and THIS offer is NOT the selected one → do nothing
//       if (selectionLocked && !isSelected) {
//         // silently ignore
//         return;
//       }

//       if (isSelected) {
//         removeItem(item.key); // allow removing the selected item → unlocks the rest
//       } else {
//         addItem(item); // add when not locked OR when nothing else is selected
//       }
//     },
//     [arrivalDate, selectedKeys, addItem, removeItem, selectionLocked]
//   );

//   if (!Array.isArray(offers) || offers.length === 0) {
//     return <div style={{ color: "#9ca3af" }}>No offers</div>;
//   }

//   return (
//     <div style={{ display: "grid", gap: 10 }}>
//       {offers.map((offer, idx) => {
//         const k = offer?.searchCode || offer?.HotelSearchCode || String(idx);
//         const keyForSelected =
//           offer?.searchCode || offer?.HotelSearchCode || null;
//         const selected = keyForSelected
//           ? selectedKeys.has(keyForSelected)
//           : false;

//         return (
//           <OfferCard
//             key={k}
//             offer={offer}
//             selected={!!selected}
//             // when locked: only the already selected card stays clickable to unselect;
//             // others are disabled
//             disabled={!selected && selectionLocked}
//             onToggle={() => handleToggle(offer)}
//           />
//         );
//       })}
//     </div>
//   );
// }

"use client";
import React, { useMemo, useCallback, useRef } from "react";
import OfferCard from "@/components/admin/hotel/OfferCard";
import { useSelectionStore } from "@/stores/selectionStore";

// Build selection item from offer
// OffersList.jsx — replace buildSelectionItem with this version
function buildSelectionItem(offer, arrivalDate) {
  const key =
    offer?.searchCode ||
    offer?.HotelSearchCode ||
    `${offer?.roomName || "room"}-${offer?.board || ""}-${
      offer?.price?.amount || ""
    }-${offer?.price?.currency || ""}`;

  const priceRetail = offer?.retail
    ? { amount: offer.retail.amount, currency: offer.retail.currency }
    : offer?.price
    ? { amount: offer.price.amount, currency: offer.price.currency }
    : null;

  const platformRef =
    typeof offer?.cancellation?.platform?.refundable === "boolean"
      ? offer.cancellation.platform.refundable
      : undefined;

  // ✅ normalize Rooms list
  const roomsArr = Array.isArray(offer?.Rooms)
    ? offer.Rooms.map((r) =>
        typeof r === "string" ? r : String(r?.name ?? r ?? "")
      )
    : offer?.roomName
    ? [String(offer.roomName)]
    : [];

  const roomNamePrimary =
    roomsArr[0] ||
    offer?.roomName ||
    (Array.isArray(offer?.Rooms) ? String(offer.Rooms[0]) : "Room");

  return {
    key,
    searchCode: offer?.searchCode || offer?.HotelSearchCode || null,
    offerProof: offer?.offerProof || null,
    arrivalDate: arrivalDate || null,
    Rooms: roomsArr, // ✅ pass array
    roomName: roomNamePrimary, // keep primary for fallback
    board: offer?.board || offer?.RoomBasis || null,
    qty: 1,
    priceRetail: priceRetail,
    price: offer?.price || null,
    refundable:
      platformRef !== undefined
        ? platformRef
        : typeof offer?.refundable === "boolean"
        ? offer.refundable
        : null,
    platformCutoffUtc: offer?.cancellation?.platform?.cutoffUtc || null,
    cancellation: offer?.cancellation || null,
  };
}

export default function OffersList({
  offers = [],
  arrivalDate,
  selectionLocked = false, // եկավ HotelDetailsView-ից՝ երբ արդեն կա մի offer selection-ում
}) {
  const items = useSelectionStore((s) => s.items);
  const addItem = useSelectionStore((s) => s.addItem);
  const removeItem = useSelectionStore((s) => s.removeItem);

  const selectedKeys = useMemo(() => new Set(items.map((i) => i.key)), [items]);

  const handleToggle = useCallback(
    (offer) => {
      const item = buildSelectionItem(offer, arrivalDate);
      const isSelected = selectedKeys.has(item.key);

      if (isSelected) removeItem(item.key);
      else addItem(item);
    },
    [arrivalDate, selectedKeys, addItem, removeItem]
  );

  // շատ նուրբ “հուշում” disabled click-ի համար ( հիմա alert, հետո կարող ես փոխել toast-ով )
  const hintThrottleRef = useRef(0);
  const showLockHint = useCallback(() => {
    const now = Date.now();
    if (now - hintThrottleRef.current < 1000) return; // թեթև throttle, որ չսպամի
    hintThrottleRef.current = now;
    // TODO: փոխել ձեր toast/notification համակարգով
    alert(
      "Դուք արդեն ունեք ընտրված առաջարկ։ Նախ հեռացրեք այն Selection-ից, ապա ընտրեք նոր առաջարկ։"
    );
  }, []);

  if (!Array.isArray(offers) || offers.length === 0) {
    return <div style={{ color: "#9ca3af" }}>No offers</div>;
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {offers.map((offer, idx) => {
        const k = offer?.searchCode || offer?.HotelSearchCode || String(idx);
        const keyForSelected =
          offer?.searchCode || offer?.HotelSearchCode || null;
        const selected = keyForSelected
          ? selectedKeys.has(keyForSelected)
          : false;

        const isDisabled = !selected && selectionLocked;

        return (
          <div
            key={k}
            // wrapper — տալիս ենք կարմիր նշագիծ և “locked” state
            style={{
              position: "relative",
              border: isDisabled
                ? "1px solid #ef4444"
                : "1px solid transparent", // red-500
              borderRadius: 12,
              padding: 2,
              cursor: isDisabled ? "not-allowed" : "auto",
            }}
            onClick={isDisabled ? showLockHint : undefined}
            title={
              isDisabled
                ? "Արդեն ընտրված առաջարկ ունեք։ Հեռացրեք այն՝ ընտրելու համար նոր առաջարկ։"
                : undefined
            }
          >
            {/* 
              Քարտը դարձնում ենք semi-disabled (opacity + pointer-events: none),
              որպեսզի OfferCard-ի կոճակը չկամենա, և click-ը բարձրանա wrapper-ին,
              որտեղ ցույց ենք տալիս հուշումը։
            */}
            <div
              style={{
                opacity: isDisabled ? 0.55 : 1,
                filter: isDisabled ? "grayscale(0.15)" : "none",
                pointerEvents: isDisabled ? "none" : "auto",
                transition: "opacity 120ms ease",
              }}
            >
              <OfferCard
                offer={offer}
                selected={!!selected}
                disabled={isDisabled}
                onToggle={() => handleToggle(offer)}
              />
            </div>

            {/* “Locked” chip */}
            {isDisabled && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  background: "#fee2e2", // red-100
                  color: "#991b1b", // red-800
                  borderRadius: 999,
                  padding: "2px 10px",
                  fontSize: 12,
                  fontWeight: 700,
                  pointerEvents: "none",
                }}
              >
                Locked
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
