"use client";
import React, { useEffect, useMemo, useState } from "react";
import styles from "@/styles/HotelDetailsView.module.css";
import HotelInfo from "@/components/admin/hotel/HotelInfo";
import OffersList from "@/components/admin/hotel/OffersList";
import SelectionSummary from "@/components/admin/hotel/SelectionSummary";
import { useSelectionStore } from "@/stores/selectionStore";

/** ——— helpers ——— */
function getSnap() {
  try { return JSON.parse(sessionStorage.getItem("lastHotelSnapshot") || "null"); }
  catch { return null; }
}
function getSearchParams() {
  try { return new URLSearchParams(window.location.search); }
  catch { return new URLSearchParams(); }
}
function getHotelIdFromUrl() {
  try {
    const p = window.location.pathname || "";
    // /admin/bookings/hotel/<ID>
    const m = p.match(/\/hotel\/([^/?#]+)/i);
    return m?.[1] || null;
  } catch { return null; }
}
/** date util */
function addDaysIso(iso, days) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(+d)) return null;
  d.setDate(d.getDate() + Number(days || 0));
  return d.toISOString().slice(0, 10);
}

export default function HotelDetailsView(props) {
  // ------- props (backup / UI wiring) -------
  const {
    hotel: hotelProp,
    offers: offersProp = [],
    offersPreview: offersPreviewProp = [],
    arrivalDate: arrivalDateProp,
    checkOutDate: checkOutDateProp,
    nights: nightsProp,
    adults: adultsProp,
    children: childrenProp,
    rooms: roomsProp,
    userCurrency,
    role,
    user,
    exchangeRates,
    settings,
    onBack,
    onChangeSearch,
    onCheckAvailability,
    fullAddress,
    areaLabel,
    aboutText,
    facilities = [],
    distances = [],
    heroPhotos = [],
    totalPhotoCount = 0,
  } = props;

  // ------- read URL + snapshot -------
  const sp = useMemo(() => getSearchParams(), []);
  const qsMap = useMemo(() => Object.fromEntries(sp.entries()), [sp]);

  const snap = useMemo(() => getSnap(), []);
  const hotelId =
    hotelProp?.hotelId ||
    hotelProp?._id ||
    qsMap.hotelId ||
    getHotelIdFromUrl();

  // criteria (URL first → snapshot → props → defaults)
  const arrivalDate =
    qsMap.arrivalDate ||
    snap?.criteria?.arrivalDate ||
    arrivalDateProp ||
    "";
  const nights = Number(
    qsMap.nights || snap?.criteria?.nights || nightsProp || 1
  );
  const rooms = Number(
    qsMap.rooms || snap?.criteria?.rooms || roomsProp || 1
  );

  // adults/children as CSV (hotel-availability API սպասում է CSV string)
  const adultsCSV =
    qsMap.adults ||
    snap?.criteria?.adultsCSV ||
    (typeof adultsProp === "string" ? adultsProp : String(adultsProp || "2"));
  const childrenCSV =
    qsMap.children ||
    snap?.criteria?.childrenCSV ||
    (typeof childrenProp === "string"
      ? childrenProp
      : String(childrenProp || "0"));
  const childrenAgesCSV =
    qsMap.childrenAges || snap?.criteria?.childrenAgesCSV || "";

  const cityId =
    qsMap.cityId || snap?.criteria?.cityId || hotelProp?.externalSource?.cityId || "";

  // optional filters / debug
  const filterBasis = qsMap.filterBasis || "";
  const offerProofQ = qsMap.offerProof || "";
  const searchCodeQ = qsMap.searchCode || "";

  // ---- build real request QS for live fetch ----
  const reqQs = useMemo(() => {
    const base = new URLSearchParams({
      cityId: String(cityId || ""),
      hotelId: String(hotelId || ""),
      arrivalDate: String(arrivalDate || ""),
      nights: String(nights || 1),
      rooms: String(rooms || 1),
      adults: String(adultsCSV || "2"),
      children: String(childrenCSV || "0"),
    });
    if (childrenAgesCSV) base.set("childrenAges", childrenAgesCSV);
    if (filterBasis) base.set("filterBasis", filterBasis);
    // these are optional; FE usually won’t send them, but keep if present
    if (offerProofQ) base.set("offerProof", offerProofQ);
    if (searchCodeQ) base.set("searchCode", searchCodeQ);
    return base;
  }, [
    cityId,
    hotelId,
    arrivalDate,
    nights,
    rooms,
    adultsCSV,
    childrenCSV,
    childrenAgesCSV,
    filterBasis,
    offerProofQ,
    searchCodeQ,
  ]);

  // ------- live fetch /hotel-availability -------
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    const ac = new AbortController();
    fetch(
      `/api/v1/suppliers/goglobal/hotel-availability?${reqQs.toString()}`,
      { credentials: "include", signal: ac.signal }
    )
      .then((r) => r.json())
      .then((j) => {
        if (!ignore) setLive(j);
      })
      .catch(() => {
        if (!ignore) setLive(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
      ac.abort();
    };
  }, [reqQs]);

  // ------- choose data: live → props fallback -------
  const hotelLive = live?.hotel || null;
  const hotel = hotelLive || hotelProp || null;
  const offersLive = hotelLive?.offers || [];
  const offersFromProps = offersPreviewProp.length
    ? offersPreviewProp
    : (hotelProp?.offers?.length ? hotelProp.offers : offersProp);
  const list = offersLive.length ? offersLive : offersFromProps;

  // header stripe dates
  const headerArrival = arrivalDate || arrivalDateProp || "—";
  const headerNights = nights || nightsProp || 1;
  const checkOut =
    checkOutDateProp || addDaysIso(arrivalDate, headerNights) || "—";

  // ---- selection actions (unchanged) ----
  const addItem = useSelectionStore((s) => s.addItem);
  const upsertItem = useSelectionStore((s) => s.upsertItem);
  const pushItem = useSelectionStore((s) => s.add || s.pushItem);
  const onSelectOffer = React.useCallback(
    (payload) => {
      if (typeof upsertItem === "function") return upsertItem(payload);
      if (typeof addItem === "function") return addItem(payload);
      if (typeof pushItem === "function") return pushItem(payload);
      console.warn("No selection add/upsert action in selectionStore");
    },
    [addItem, upsertItem, pushItem]
  );

  return (
    <div className={styles.page} style={{ "--app-header-h": "80px" }}>
      <button className={styles.backBtn} onClick={onBack}>
        ← Back to results
      </button>

      <div className={styles.headerStrip}>
        {hotel?.location?.city || "—"} • {headerArrival} → {checkOut} •{" "}
        {adultsCSV || "2"} adults • {rooms || 1} room{Number(rooms) > 1 ? "s" : ""}
      </div>

      <button className={styles.changeBtn} onClick={onChangeSearch}>
        Change search
      </button>

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
            loading={loading}
          />

          <div className={styles.offersBlock}>
            {/* Եթե loading է, կարող ես լցնել skeleton/loader՝ քո կոմպոնենտներով */}
            <OffersList
              offers={list}
              arrivalDate={arrivalDate}
              onSelectOffer={onSelectOffer}
            />
          </div>
        </div>

        {/* RIGHT – STICKY RAIL */}
        <div className={styles.rail}>
          <SelectionSummary
            arrivalDate={arrivalDate}
            checkOutDate={checkOut}
            nights={headerNights}
            adults={adultsCSV}
            children={childrenCSV}
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