// "use client";
// import React, { useMemo } from "react";
// import Link from "next/link";
// import styles from "@/styles/hotelCard.module.css";
// import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
// import { useCurrencyStore } from "@/stores/currencyStore";
// import usePublicSettings from "@/hooks/usePublicSettings";
// import useSkeletonTimeout from "@/hooks/useSkeletonTimeout";
// import { calculatePrice } from "@/utils/priceUtils";

// const HotelCard = ({ hotel, viewType }) => {
//   const nights = useSearchCriteriaStore((s) => s.nights);
//   const selectedCurrency = useCurrencyStore((s) => s.currency);
//   const publicSettings = usePublicSettings();

//   // Նկար ընտրելու նոր կարգ․ նախ մեծ նկարը, հետո մնացածը
//   const imageSrc =
//     (hotel.images && hotel.images.find((img) => img.isMain)?.url) ||
//     hotel.images?.[0]?.url ||
//     hotel.thumbnail ||
//     "/placeholder.jpg";

//   // Հյուրանոցի գինը և արժույթը
//   const offerPrice = hotel.minPrice?.amount;
//   const offerCurrency = hotel.minPrice?.currency;

//   // Եթե արժեք կամ արժույթ չկա՝ skip անել
//   if (!offerPrice || !offerCurrency) return null;

//   // Ցուցադրման արժույթը՝ Navbar-ից
//   const displayCurrency = selectedCurrency || offerCurrency;

//   const formatPrice = (amount, currency) => {
//     return (
//       new Intl.NumberFormat("en-US", {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       }).format(amount) + ` ${currency}`
//     );
//   };

//   // Գնի հաշվարկ (կոնվերտացիա + markup + գիշերների բազմապատկում)
//   const priceData = useMemo(() => {
//     if (!offerPrice || !publicSettings?.exchangeRates) return null;

//     const rates = publicSettings.exchangeRates;
//     const markup = Number(publicSettings.markup) || 0;

//     const { total, convertedNet } = calculatePrice(
//       Number(offerPrice),
//       offerCurrency,
//       displayCurrency,
//       0,
//       Number(nights) || 1,
//       rates
//     );

//     if (!total || isNaN(total)) return null;

//     return {
//       displayPrice: total.toFixed(2),
//       convertedNet: convertedNet.toFixed(2),
//       currency: displayCurrency,
//     };
//   }, [offerPrice, offerCurrency, publicSettings, displayCurrency, nights]);

//   const ready = !!priceData;
//   const showSkeleton = useSkeletonTimeout(ready, 400); // ավելի արագ նկարվելու համար

//   // Աստղերի արտածում
//   const renderStars = (count) => {
//     const stars = [];
//     for (let i = 0; i < (count || 0); i++) {
//       stars.push(<span key={i}>⭐</span>);
//     }
//     return stars.length > 0 ? stars : "No rating";
//   };

//   return (
//     <Link href={`/admin/bookings/hotel/${hotel._id}`} className={styles.link}>
//       <div className={`${styles.card} ${styles[viewType]}`}>
//         <div className={styles.imageWrapper}>
//           <img src={imageSrc} alt={hotel.name} className={styles.image} />
//         </div>
//         <div className={styles.content}>
//           <h3 className={styles.title}>{hotel.name}</h3>
//           <p className={styles.location}>
//             {hotel.location?.city}, {hotel.location?.country}
//           </p>
//           <div className={styles.details}>
//             <span className={styles.rating}>{renderStars(hotel.stars)}</span>
//             {ready && !showSkeleton ? (
//               <span className={styles.price}>
//                 From{" "}
//                 <strong>{formatPrice(priceData.displayPrice, priceData.currency)}</strong>{" "}
//                 total
//               </span>
//             ) : (
//               <span className={styles.priceLoading}> </span>
//             )}
//           </div>
//         </div>
//       </div>
//     </Link>
//   );
// };

// export default React.memo(HotelCard);