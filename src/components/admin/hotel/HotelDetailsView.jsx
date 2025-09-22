// "use client";

// import React from "react";
// import {
//   displayAmountWithRoleAndCurrency,
//   fmtMoney,
// } from "@/utils/pricingDisplay";

// // Կոմպոնենտներ
// import HotelInfo from "@/components/admin/hotel/HotelInfo";
// import OffersList from "@/components/admin/hotel/OffersList";
// import SelectionSummary from "@/components/admin/hotel/SelectionSummary";

// // CSS
// import viewStyles from "@/styles/HotelDetailsView.module.css";

// const PRIMARY = "#f36323";

// export default function HotelDetailsView({
//   hotel,
//   offers = [],
//   arrivalDate,
//   checkOutDate,
//   nights,
//   adults,
//   children,
//   rooms,
//   userCurrency,
//   role,
//   user,
//   exchangeRates,
//   settings,
//   onBack,
//   onChangeSearch,
//   onCheckAvailability,

//   // from hook:
//   fullAddress,
//   areaLabel,
//   aboutText,
//   facilities = [],
//   distances = [],
//   heroPhotos = [],
//   totalPhotoCount = 0,
//   offersPreview = [],
// }) {
//   // Fallback logic՝ offersPreview → hotel.offers
//   const list = offersPreview?.length
//     ? offersPreview
//     : hotel?.offers?.length
//     ? hotel.offers
//     : [];

//   console.log("[HDV] offers to render:", list?.length ?? 0, {
//     fromProp: offersPreview?.length ?? 0,
//     fromHotel: hotel?.offers?.length ?? 0,
//   });

//   return (
//     <div className={viewStyles.container}>
//       <button
//         onClick={onBack}
//         style={{
//           marginBottom: 12,
//           border: "1px solid #ccc",
//           background: "#fff",
//           padding: "6px 10px",
//           borderRadius: 6,
//           cursor: "pointer",
//         }}
//       >
//         ← Back to results
//       </button>

//       {/* header strip */}
//       <div style={{ marginBottom: 8, color: "#444" }}>
//         {hotel?.location?.city || "—"} • {arrivalDate || "—"} →{" "}
//         {checkOutDate || "—"} • {adults || 2} adults • {rooms || 1} room
//         {Number(rooms) > 1 ? "s" : ""}
//       </div>

//       <button
//         onClick={onChangeSearch}
//         style={{
//           marginBottom: 16,
//           border: "1px solid #ddd",
//           background: "#fafafa",
//           padding: "6px 10px",
//           borderRadius: 6,
//           cursor: "pointer",
//         }}
//       >
//         Change search
//       </button>

//       {/* === GRID: left content + sticky right rail === */}
//       <div className={viewStyles.grid}>
//         {/* LEFT COLUMN */}
//         <div className={viewStyles.leftCol}>
//           <HotelInfo
//             hotel={hotel}
//             areaLabel={areaLabel}
//             fullAddress={fullAddress}
//             heroPhotos={heroPhotos}
//             totalPhotoCount={totalPhotoCount}
//             aboutText={aboutText}
//             facilities={facilities}
//             distances={distances}
//           />

//           <div className={viewStyles.offersWrap}>
//             <OffersList offers={list} />
//           </div>
//         </div>

//         {/* RIGHT STICKY SUMMARY */}
//         <div className={viewStyles.rightCol}>
//           <SelectionSummary
//             arrivalDate={arrivalDate}
//             checkOutDate={checkOutDate}
//             nights={nights}
//             adults={adults}
//             children={children}
//             rooms={rooms}
//             role={role}
//             user={user}
//             userCurrency={userCurrency}
//             settings={settings}
//             exchangeRates={exchangeRates}
//             onCheckAvailability={onCheckAvailability}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

"use client";

import React from "react";

import styles from "@/styles/HotelDetailsView.module.css";

// բաժանված կոմպոնենտներ
import HotelInfo from "@/components/admin/hotel/HotelInfo";
import OffersList from "@/components/admin/hotel/OffersList";
import SelectionSummary from "@/components/admin/hotel/SelectionSummary";

export default function HotelDetailsView({
  hotel,
  offers = [],
  arrivalDate,
  checkOutDate,
  nights,
  adults,
  children,
  rooms,
  userCurrency,
  role,
  user,
  exchangeRates,
  settings,
  onBack,
  onChangeSearch,
  onCheckAvailability,

  // from hook
  fullAddress,
  areaLabel,
  aboutText,
  facilities = [],
  distances = [],
  heroPhotos = [],
  totalPhotoCount = 0,
  offersPreview = [],
}) {
  const list = offersPreview?.length
    ? offersPreview
    : (hotel?.offers?.length ? hotel.offers : []);

  return (
    <div className={styles.page} style={{ '--app-header-h': '60px' }}>
      <button className={styles.backBtn} onClick={onBack}>← Back to results</button>

      <div className={styles.headerStrip}>
        {hotel?.location?.city || "—"} • {arrivalDate || "—"} → {checkOutDate || "—"} •{" "}
        {adults || 2} adults • {rooms || 1} room{Number(rooms) > 1 ? "s" : ""}
      </div>

      <button className={styles.changeBtn} onClick={onChangeSearch}>Change search</button>

      {/* GRID */}
      <div className={styles.grid}>
        {/* LEFT */}
        <div>
          <HotelInfo
            hotel={hotel}
            areaLabel={areaLabel}
            fullAddress={fullAddress}
            heroPhotos={heroPhotos}
            totalPhotoCount={totalPhotoCount}
            aboutText={aboutText}
            facilities={facilities}
            distances={distances}
          />

          <div className={styles.offersBlock}>
            <OffersList offers={list} />
          </div>
        </div>

        {/* RIGHT – STICKY RAIL */}
        <div className={styles.rail}>
          <SelectionSummary
            arrivalDate={arrivalDate}
            checkOutDate={checkOutDate}
            nights={nights}
            adults={adults}
            children={children}
            rooms={rooms}
            role={role}
            user={user}
            userCurrency={userCurrency}
            settings={settings}
            exchangeRates={exchangeRates}
            onCheckAvailability={onCheckAvailability}
          />
        </div>
      </div>
    </div>
  );
}