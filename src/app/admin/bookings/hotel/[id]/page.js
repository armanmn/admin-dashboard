"use client";

import React, { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

import HotelDetailsView from "@/components/admin/hotel/HotelDetailsView";
import { useHotelDetails } from "@/hooks/useHotelDetails";
import { useSelectionStore } from "@/stores/selectionStore";

export default function HotelDetailsPage() {
  const { id } = useParams();
  const q = useSearchParams();
  const router = useRouter();

  // ---- query params ----
  const arrivalDate = q.get("arrivalDate") || undefined;
  const nights = Number(q.get("nights") || 1);
  const rooms = Number(q.get("rooms") || 1);
  const adults = Number(q.get("adults") || 2);
  const children = Number(q.get("children") || 0);
  const childrenAges = q.get("childrenAges") || ""; // e.g. "5,12" or "5,12|3"
  const cityId = q.get("cityId") || undefined;
  const filterBasis = q.get("filterBasis") || q.get("basis") || undefined; // e.g. "BB,HB"
  const userCurrency = q.get("currency") || "USD";

  const resetSelection = useSelectionStore((s) => s.reset); // selector-ով վերցնենք հենց ֆունկցիան

  useEffect(() => {
    if (typeof resetSelection === "function") resetSelection();
  }, [
    resetSelection,
    id,
    arrivalDate,
    nights,
    rooms,
    adults,
    children,
    childrenAges,
  ]);

  // ---- data hook (single-hotel endpoint + parallel info) ----
  const {
    loading,
    hotel,
    offersPreview,
    fullAddress,
    areaLabel,
    aboutText,
    facilities,
    distances,
    heroPhotos,
    totalPhotoCount,
  } = useHotelDetails({
    id,
    arrivalDate,
    nights,
    rooms,
    adults,
    children,
    childrenAges,
    cityCode: cityId,
    filterBasis,
  });

  // fallback միայն URL-ից, եթե hook-ը դեռ չի բերել
  const mergedHotel = hotel || {
    _id: id,
    name: q.get("name") || "",
    stars: Number(q.get("stars") || 0),
  };

  const checkOutDate = arrivalDate
    ? new Date(new Date(arrivalDate).getTime() + nights * 86400000)
        .toISOString()
        .slice(0, 10)
    : "";

  return (
    <div>
      {loading && (
        <div style={{ padding: 8, color: "#6b7280", fontStyle: "italic" }}>
          Loading hotel…
        </div>
      )}

      <HotelDetailsView
        hotel={mergedHotel}
        offers={offersPreview || []}
        arrivalDate={arrivalDate}
        checkOutDate={checkOutDate}
        nights={nights}
        adults={adults}
        children={children}
        rooms={rooms}
        userCurrency={userCurrency}
        role={null}
        user={null}
        exchangeRates={null}
        settings={null}
        onBack={() => router.back()}
        onChangeSearch={() => {}}
        onCheckAvailability={() => {}}
        fullAddress={fullAddress}
        areaLabel={areaLabel}
        aboutText={aboutText}
        facilities={facilities}
        distances={distances}
        heroPhotos={heroPhotos}
        totalPhotoCount={totalPhotoCount}
      />
    </div>
  );
}
