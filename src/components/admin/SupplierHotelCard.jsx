// src/components/admin/SupplierHotelCard.jsx
// NEW
"use client";
import React, { useCallback } from "react";
import Link from "next/link";
import styles from "@/styles/supplierHotelCard.module.css";
import { useAuthStore } from "@/stores/authStore";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
import { formatMoney } from "@/utils/formatMoney";

function toNights(checkIn, checkOut, fallback = 1) {
  try {
    if (checkIn && checkOut) {
      const a = new Date(checkIn);
      const b = new Date(checkOut);
      if (!isNaN(+a) && !isNaN(+b)) {
        const ms = b - a;
        return Math.max(1, Math.round(ms / 86400000));
      }
    }
  } catch {}
  return Math.max(1, Number(fallback) || 1);
}

const SupplierHotelCard = ({ hotel, viewType, criteria }) => {
  const imageSrc =
    hotel?.images?.find((x) => x?.isMain)?.url ||
    hotel?.images?.[0]?.url ||
    hotel?.thumbnail ||
    "/placeholder.jpg";

  const stars = Number(hotel?.stars ?? hotel?.category ?? 0);

  // --- price preview (from ResultsView if converted) ---
  const rawAmount =
    hotel?.minPrice?.amount ??
    hotel?.minOffer?.price?.amount ??
    hotel?.minOffer?.amount ??
    null;
  const rawCurrency =
    hotel?.minPrice?.currency ||
    hotel?.minOffer?.price?.currency ||
    hotel?.minOffer?.currency ||
    "";

  const displayAmount =
    hotel?._displayTotal != null ? hotel._displayTotal : rawAmount;
  const displayCurrency = hotel?._displayCurrency || rawCurrency || "";

  // --- offer bits ---
  const min = hotel?.minOffer || {};
  const board = min?.board || null;
  const roomName = min?.roomName || null;

  const platCut =
    min?.cancellation?.platformCutoffUtc ||
    hotel?.platformCutoffUtc ||
    hotel?.minPrice?.platformCutoffUtc ||
    null;
  const suppCut =
    min?.cancellation?.supplierDeadlineUtc ||
    hotel?.supplierDeadlineUtc ||
    hotel?.minPrice?.supplierDeadlineUtc ||
    null;

  const rawAddr = hotel?.location?.address;
  const infoAddr = hotel?.hotelInfo?.hotel?.address || hotel?.address;
  const address = rawAddr && rawAddr !== "N/A" ? rawAddr : infoAddr || null;

  const role = useAuthStore((s) => s.user?.role);
  const isOps = ["admin", "office_user", "finance_user", "finance"].includes(
    String(role || "").toLowerCase()
  );

  const hotelCode =
    hotel?.externalSource?.hotelCode ||
    hotel?.hotelCode ||
    hotel?._id ||
    hotel?.HotelCode ||
    hotel?.code ||
    "";

  const cityIdFromHotel =
    hotel?.externalSource?.cityId ||
    hotel?.cityId ||
    hotel?.location?.cityId ||
    "";

  const searchCode =
    min?.searchCode ||
    hotel?.searchCode ||
    hotel?.offersPreview?.[0]?.searchCode ||
    "";

  const offerProof =
    min?.offerProof ||
    hotel?.offerProof ||
    hotel?.offersPreview?.[0]?.offerProof ||
    "";

  // criteria fallback
  const checkInFromStore = useSearchCriteriaStore((s) => s.checkInDate);
  const checkOutFromStore = useSearchCriteriaStore((s) => s.checkOutDate);
  const cityCodeFromStore = useSearchCriteriaStore((s) => s.cityCode);
  const adultsFromStore = useSearchCriteriaStore((s) => s.adults);
  const childrenFromStore = useSearchCriteriaStore((s) => s.children);
  const agesFromStore = useSearchCriteriaStore((s) => s.childrenAges);

  const arrivalDate = criteria?.arrivalDate || checkInFromStore || "";
  const nights =
    criteria?.nights ??
    toNights(
      criteria?.arrivalDate || checkInFromStore,
      criteria?.checkOutDate || checkOutFromStore,
      1
    );
  const cityId = criteria?.cityId || cityCodeFromStore || cityIdFromHotel || "";
  const adults = criteria?.adults ?? adultsFromStore ?? 2;
  const children = criteria?.children ?? childrenFromStore ?? 0;
  const childrenAges = Array.isArray(criteria?.childrenAges)
    ? criteria.childrenAges
    : Array.isArray(agesFromStore)
    ? agesFromStore
    : [];

  const qsObj = {
    source: "live",
    provider: "goglobal",
    arrivalDate: String(arrivalDate || ""),
    nights: String(nights || 1),
    cityId: String(cityId || ""),
    adults: String(adults || 2),
    children: String(children || 0),
    searchCode: String(searchCode || ""),
    offerProof: String(offerProof || ""),
  };
  if (
    Number(children) > 0 &&
    Array.isArray(childrenAges) &&
    childrenAges.length === Number(children)
  ) {
    qsObj.childrenAges = childrenAges.join(",");
  }
  const qs = new URLSearchParams(qsObj).toString();

  const handleClick = useCallback(() => {
    try {
      const snapshot = {
        id: String(
          hotel?._id || hotel?.hotelId || hotel?.HotelCode || hotelCode || ""
        ),
        hotel,
        source: "live",
        provider: "goglobal",
        criteria: {
          arrivalDate,
          nights,
          cityId,
          adults,
          children,
          childrenAges,
        },
        codes: { offerProof, searchCode, hotelCode },
      };
      sessionStorage.setItem("lastHotelSnapshot", JSON.stringify(snapshot));
    } catch (_) {}
  }, [
    hotel,
    arrivalDate,
    nights,
    cityId,
    adults,
    children,
    childrenAges,
    offerProof,
    searchCode,
    hotelCode,
  ]);

  const fmt = (iso) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      if (Number.isNaN(+d)) return null;
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return null;
    }
  };

  return (
    <div className={`${styles.card} ${viewType === "list" ? styles.row : ""}`}>
      <div className={styles.thumb}>
        <img src={imageSrc} alt={hotel?.name || "Hotel"} />
      </div>

      <div className={styles.main}>
        <div className={styles.header}>
          <h4 className={styles.title}>{hotel?.name}</h4>
          <div className={styles.stars}>
            {stars > 0 ? "⭐".repeat(stars) : "—"}
          </div>
        </div>

        <div className={styles.meta}>
          <span className={styles.location}>
            {hotel?.location?.city}, {hotel?.location?.country}
          </span>
          {address && <span className={styles.address}>• {address}</span>}
        </div>

        {/* !!! badges block REMOVED to avoid duplication !!! */}

        <div className={styles.offerRow}>
          <div className={styles.offerInfo}>
            {roomName && <div className={styles.roomName}>{roomName}</div>}

            <div
              className={`${styles.summaryLine} ${
                viewType === "list" ? styles.summaryList : ""
              }`}
            >
              {board && <span className={styles.dotItem}>Room Only</span>}
              {!!nights && (
                <span className={styles.dotItem}>{nights} nights</span>
              )}
              {platCut && (
                <span className={styles.dotItem}>
                  Free cancel until: <b>{fmt(platCut)}</b>
                </span>
              )}
              {isOps && suppCut && (
                <span className={styles.dotItem}>
                  Supplier cutoff: <b>{fmt(suppCut)}</b>
                </span>
              )}
            </div>
          </div>

          <div className={styles.priceBox}>
            <div className={styles.from}>From</div>
            <div className={styles.price}>
              {displayAmount != null ? formatMoney(displayAmount, displayCurrency) : "—"}
              
            </div>
            <div className={styles.total}>total</div>
          </div>
        </div>

        <div className={styles.actions}>
          <Link
            prefetch={false}
            href={`/admin/bookings/hotel/${encodeURIComponent(
              hotel._id || hotelCode
            )}?${qs}`}
            className={styles.btn}
            onClick={handleClick}
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SupplierHotelCard;
