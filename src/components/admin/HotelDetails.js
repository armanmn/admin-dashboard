import React, { useEffect, useState } from "react";
import RoomCard from "./RoomCard";
import styles from "@/styles/hotelDetails.module.css";
import api from "@/utils/api";
import HotelRoomFilters from "./HotelRoomFilters";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import RoomCombinationCard from "@/components/admin/RoomCombinationCard";
import { differenceInDays } from "date-fns";

const HotelDetails = ({ hotel }) => {
  const [rooms, setRooms] = useState([]);
  const [sortRoomsBy, setSortRoomsBy] = useState("price-asc");

  const {
    adults,
    children,
    rooms: numberOfRooms = 1,
    filters,
  } = useSearchCriteriaStore();
  const { currency } = useCurrencyStore();
  const totalGuests = adults + children;
  const numberOfRoomsFromFilters = filters.rooms || numberOfRooms;

  const { checkInDate, checkOutDate } = useSearchCriteriaStore();
  const nightsCount = differenceInDays(
    new Date(checkOutDate),
    new Date(checkInDate)
  );

  useEffect(() => {
  const fetchRooms = async () => {
    try {
      const res = await api.get(`/rooms/hotel/${hotel._id}`, {
        params: {
          currency,
          adults,
          children,
          nights: nightsCount,
        },
      });
      setRooms(res);
    } catch (err) {
      console.error("❌ Failed to fetch rooms:", err);
    }
  };

  if (hotel?._id) fetchRooms();
}, [hotel, currency, adults, children, nightsCount]);

  if (!hotel) return <p>Hotel not found.</p>;

  // 🔍 Debug info
  console.log("🔍 adults:", adults);
  console.log("🔍 children:", children);
  console.log("🔍 totalGuests:", totalGuests);
  console.log("🔍 numberOfRoomsFromFilters:", numberOfRoomsFromFilters);

  const min = parseInt(filters.minPrice) || 0;
  const max = parseInt(filters.maxPrice) || Infinity;

  const selectedAmenities = Object.entries(filters.amenities || {})
    .filter(([_, checked]) => checked)
    .map(([key]) => key);

  const selectedTypes = Object.entries(filters.roomTypes || {})
    .filter(([_, checked]) => checked)
    .map(([type]) => type.toLowerCase());

  const minBeds =
    filters.minBeds === "any" || !filters.minBeds
      ? null
      : parseInt(filters.minBeds, 10);
  const selectedMealPlans = filters.mealPlans || [];
  const refundableOnly = filters.refundable || false;

  const prelimFilteredRooms = rooms.filter((room) => {
    const roomBeds = room.beds ?? room.maxOccupancy;
    const matchesBeds = minBeds === null || Number(roomBeds || 0) >= minBeds;
    const matchesPrice = room.price >= min && room.price <= max;
    const hasAllAmenities = selectedAmenities.every((a) =>
      room.amenities?.includes(a)
    );
    const matchesType =
      selectedTypes.length === 0 ||
      selectedTypes.includes(room.type?.toLowerCase());
    const matchesRefundable = !refundableOnly || room.isRefundable === true;
    const matchesMealPlan =
      selectedMealPlans.length === 0 ||
      selectedMealPlans.includes(room.mealPlan);

    return (
      matchesPrice &&
      hasAllAmenities &&
      matchesType &&
      matchesBeds &&
      matchesRefundable &&
      matchesMealPlan
    );
  });

  console.log("🔍 prelimFilteredRooms:", prelimFilteredRooms);

  function generateCombinations(arr, k) {
    const results = [];

    const helper = (start, combo) => {
      if (combo.length === k) {
        results.push([...combo]);
        return;
      }

      for (let i = start; i < arr.length; i++) {
        combo.push(arr[i]);
        helper(i + 1, combo);
        combo.pop();
      }
    };

    helper(0, []);
    return results;
  }

  const validCombinations = generateCombinations(
    prelimFilteredRooms,
    numberOfRoomsFromFilters
  ).filter(
    (combo) =>
      combo.reduce((sum, room) => sum + room.maxOccupancy, 0) >= totalGuests
  );

  console.log("🔍 validCombinations:", validCombinations);

  const validRoomIds = new Set(
    validCombinations.flat().map((room) => room._id)
  );
  console.log("🔍 validRoomIds:", [...validRoomIds]);

  const filteredRooms = prelimFilteredRooms.filter((room) =>
    validRoomIds.has(room._id)
  );

  console.log("🔍 final filteredRooms:", filteredRooms);

  const sortedRooms = [...filteredRooms].sort((a, b) => {
    switch (sortRoomsBy) {
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      default:
        return 0;
    }
  });

  return (
    <div className={styles.container}>
      <h2>{hotel.name}</h2>
      <p className={styles.location}>
        {hotel.location?.city}, {hotel.location?.country}
      </p>
      <img src={hotel.image} alt={hotel.name} className={styles.coverImage} />

      <div className={styles.infoSection}>
        <p>{hotel.description}</p>
        <div className={styles.details}>
          <span>⭐ {hotel.rating} rating</span>
          <span>Price from ${hotel.price} / night</span>
        </div>

        <div className={styles.amenities}>
          <h4>Amenities:</h4>
          <ul>
            {hotel.amenities?.map((a, index) => (
              <li key={index}>{a}</li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: "40px" }}>
        <HotelRoomFilters />
        <div className={styles.roomsHeader}>
          <h3>
            Available Room Combinations for {totalGuests} guest
            {totalGuests > 1 ? "s" : ""}
          </h3>

          <div className={styles.sortContainer}>
            <label>Sort by:</label>
            <select
              value={sortRoomsBy}
              onChange={(e) => setSortRoomsBy(e.target.value)}
              className={styles.sortSelect}
            >
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {validCombinations.length > 0 ? (
          validCombinations.map((combo, index) => {
            const enrichedCombo = combo.map((room) => ({
              ...room,
              totalPrice: room.price * nightsCount,
            }));

            // Եթե միայն 1 սենյակ է, ցույց տուր RoomCard
            if (enrichedCombo.length === 1) {
              return (
                <RoomCard
                  key={enrichedCombo[0]._id}
                  room={enrichedCombo[0]}
                  hotelId={hotel._id}
                />
              );
            }

            // Եթե 2 կամ ավելի սենյակ է → Combination
            return (
              <RoomCombinationCard
                key={index}
                combination={enrichedCombo}
                hotelId={hotel._id}
              />
            );
          })
        ) : (
          <p>No room combinations available for your criteria.</p>
        )}
      </div>
    </div>
  );
};

export default HotelDetails;
