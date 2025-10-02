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

  // ⚠ adults/children/childrenAges այժմ՝ CSV strings, ոչ թե single ints
  const adultsCSV = q.get("adults") || "2";
  const childrenCSV = q.get("children") || "0";
  const childrenAgesCSV = q.get("childrenAges") || ""; // e.g. "5,12|3"
  const cityId = q.get("cityId") || undefined;
  const filterBasis = q.get("filterBasis") || q.get("basis") || undefined;
  const userCurrency = q.get("currency") || "USD";

  const resetSelection = useSelectionStore((s) => s.reset);

  useEffect(() => {
    if (typeof resetSelection === "function") resetSelection();
  }, [resetSelection, id, arrivalDate, nights, rooms, adultsCSV, childrenCSV, childrenAgesCSV]);

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
    // FE → BE: adults/children/childrenAges որպես strings (CSV),
    // controller-ը արդեն same logic-ով կառուցում է pax array:
    rooms,
    adults: adultsCSV,
    children: childrenCSV,
    childrenAges: childrenAgesCSV,
    cityCode: cityId,
    filterBasis,
  });

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
        // Ցույց տալու նպատակով՝ կարող ես նաև փոխանցել parsed ցուցիչներ, բայց BE-ին արդեն CSV-ներն ենք տալիս
        adults={adultsCSV}
        children={childrenCSV}
        rooms={rooms}
        userCurrency={userCurrency}
        role={null}
        user={null}
        exchangeRates={null}
        settings={null}
        onBack={() => router.back()}
        // onChangeSearch հանվեց, որովհետև այլևս pax editor չկա
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