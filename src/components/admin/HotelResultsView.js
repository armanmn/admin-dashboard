"use client";
import React, { useEffect, useMemo, useState } from "react";
import api from "@/utils/api";
import HotelCard from "./HotelCard";
import styles from "@/styles/hotelResultsView.module.css";
import { useCurrencyStore } from "@/stores/currencyStore";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
import usePublicSettings from "@/hooks/usePublicSettings";
import { calculatePrice } from "@/utils/priceUtils";

const CHUNK = 20;

const HotelResultsView = ({ searchParams, uiFilters }) => {
  const [allHotels, setAllHotels] = useState([]);
  const [visibleCount, setVisibleCount] = useState(CHUNK);
  const [loading, setLoading] = useState(false);
  const [viewType, setViewType] = useState("grid");
  const [sortBy, setSortBy] = useState("price_asc");

  // 🧭 same currency the user selected in Navbar
  const { currency } = useCurrencyStore();

  // 🧮 EXACT SAME inputs HotelCard uses
  const nights = useSearchCriteriaStore((s) => s.nights) || 1;
  const publicSettings = usePublicSettings(); // has exchangeRates + markup

  const DEBUG = false;

  // FETCH — only on searchParams / currency / sortBy
  useEffect(() => {
    const doFetch = async () => {
      if (
        !searchParams?.city ||
        !searchParams?.checkInDate ||
        !searchParams?.checkOutDate
      ) {
        setAllHotels([]);
        setVisibleCount(CHUNK);
        return;
      }

      try {
        setLoading(true);

        const params = {
          ...searchParams,
          page: 1,
          limit: 3000,
          sort: sortBy,
        };
        if (currency) params.currency = currency;

        const res = await api.get("/hotels", { params });
        const hotelsArray = Array.isArray(res) ? res : res.hotels || [];

        const processed = hotelsArray
          .map((hotel) => {
            const m = hotel?.minPrice;
            const amountNum = m && m.amount != null ? Number(m.amount) : null;
            return {
              ...hotel,
              minPrice:
                amountNum != null && !Number.isNaN(amountNum) && m?.currency
                  ? { amount: amountNum, currency: m.currency }
                  : null,
            };
          })
          .filter((h) => h.minPrice !== null);

        setAllHotels(processed);
        setVisibleCount(CHUNK);
      } catch (err) {
        console.error("❌ Failed to fetch hotels:", err);
        setAllHotels([]);
        setVisibleCount(CHUNK);
      } finally {
        setLoading(false);
      }
    };

    doFetch();
  }, [searchParams, currency, sortBy]);

  // ---------- Helpers ----------
  const toNum = (v) =>
    v === "" || v === null || v === undefined ? NaN : Number(v);

  // 🔹 Derive EXACTLY the number the card shows: total with conversion + markup + nights
  //    Then filter on that derived number.
  const pricedHotels = useMemo(() => {
    // If settings are not ready, just pass through without derived total
    const rates = publicSettings?.exchangeRates || null;
    const markup = Number(publicSettings?.markup || 0);

    const list = allHotels.map((h) => {
      const offerPrice = Number(h.minPrice?.amount ?? 0);
      const offerCurrency = h.minPrice?.currency;

      if (!offerPrice || !offerCurrency || !rates) {
        return { ...h, _displayTotal: null };
      }

      const { total } = calculatePrice(
        offerPrice,
        offerCurrency,
        currency || offerCurrency,
        markup,
        Number(nights) || 1,
        rates
      );

      const displayTotal = total && !isNaN(total) ? Number(total) : null;

      if (DEBUG && displayTotal === null) {
        console.log("⚠️ calcPrice failed", {
          name: h.name,
          offerPrice,
          offerCurrency,
          targetCurrency: currency || offerCurrency,
          markup,
          nights,
          rates,
        });
      }

      return { ...h, _displayTotal: displayTotal };
    });

    if (DEBUG) {
      console.log("💱 Derived totals sample:");
      console.table(
        list.slice(0, 5).map((x) => ({
          name: x.name,
          offer: `${x?.minPrice?.amount} ${x?.minPrice?.currency}`,
          to: currency,
          total: x._displayTotal,
        }))
      );
    }

    return list;
  }, [allHotels, currency, publicSettings, nights]);

  // ---------- Local filtering (NO fetch) — on _displayTotal ----------
  const locallyFiltered = useMemo(() => {
    let result = pricedHotels.filter((h) => h._displayTotal != null);

    const min = toNum(uiFilters?.minPrice);
    const max = toNum(uiFilters?.maxPrice);
    const applyBounds = !Number.isNaN(min) || !Number.isNaN(max);

    if (applyBounds) {
      result = result.filter((h) => {
        const amt = Number(h._displayTotal);
        if (!Number.isNaN(min) && amt < min) return false;
        if (!Number.isNaN(max) && amt > max) return false;
        return true;
      });
    }

    // (Optional) facilities etc...
    // if (uiFilters?.facilities) { ... }

    return result;
  }, [pricedHotels, uiFilters]);

  // ---------- Local pagination ----------
  const visibleHotels = useMemo(
    () => locallyFiltered.slice(0, visibleCount),
    [locallyFiltered, visibleCount]
  );

  const loadMore = () => setVisibleCount((prev) => prev + CHUNK);

  if (loading && visibleHotels.length === 0) return <p>Loading hotels...</p>;

  return (
    <div className={styles.resultsContainer}>
      <div className={styles.topBar}>
        <div className={styles.toggleButtons}>
          <button
            onClick={() => setViewType("grid")}
            className={viewType === "grid" ? styles.active : ""}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewType("list")}
            className={viewType === "list" ? styles.active : ""}
          >
            List View
          </button>
        </div>

        <div className={styles.sortContainer}>
          <label>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.sortSelect}
          >
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Rating: High to Low</option>
            <option value="newest">Newest Listings</option>
          </select>
        </div>
      </div>

      <div className={`${styles.cardsWrapper} ${styles[viewType]}`}>
        {visibleHotels.length > 0 ? (
          visibleHotels.map((hotel) => (
            <HotelCard
              key={hotel._id}
              hotel={hotel}
              viewType={viewType}
              rating={hotel.rating}
              thumbnail={hotel.thumbnail}
            />
          ))
        ) : (
          !loading && <p>No hotels match the selected filters.</p>
        )}
      </div>

      {!loading && visibleHotels.length < locallyFiltered.length && (
        <div className={styles.loadMoreWrapper}>
          <button onClick={loadMore} className={styles.loadMoreButton}>
            Load More
          </button>
        </div>
      )}

      {loading && visibleHotels.length > 0 && <p>Loading more hotels...</p>}
    </div>
  );
};

export default HotelResultsView;