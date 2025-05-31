import React, { useEffect, useState } from "react";
import RoomCard from "./RoomCard";
import styles from "@/styles/hotelDetails.module.css";
import api from "@/utils/api";
import HotelRoomFilters from "./HotelRoomFilters";
import { useSearchCriteriaStore } from "@/stores/searchCriteriaStore";

const HotelDetails = ({ hotel }) => {
  const [rooms, setRooms] = useState([]);
  const [sortRoomsBy, setSortRoomsBy] = useState("price-asc"); // ✅ default

  const { adults, children, filters } = useSearchCriteriaStore();
  const totalGuests = adults + children;

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get(`/rooms/hotel/${hotel._id}`);
        setRooms(res);
      } catch (err) {
        console.error("❌ Failed to fetch rooms:", err);
      }
    };
    if (hotel?._id) fetchRooms();
  }, [hotel]);

  if (!hotel) return <p>Hotel not found.</p>;

  const min = parseInt(filters.minPrice) || 0;
  const max = parseInt(filters.maxPrice) || Infinity;

  const selectedAmenities = Object.entries(filters.amenities || {})
    .filter(([_, checked]) => checked)
    .map(([key]) => key);

  const selectedTypes = Object.entries(filters.roomTypes || {})
    .filter(([_, checked]) => checked)
    .map(([type]) => type.toLowerCase());

  const minBeds = Number(filters.minBeds || 0);

  const matchesRefundable =
  !filters.refundable || room.isRefundable === true;

  const selectedMealPlans = filters.mealPlans || [];

  const filteredRooms = rooms.filter((room) => {
    const matchesOccupancy = room.maxOccupancy >= totalGuests;
    const matchesPrice = room.price >= min && room.price <= max;
    const hasAllAmenities = selectedAmenities.every((a) =>
      room.amenities?.includes(a)
    );
    const matchesType =
      selectedTypes.length === 0 ||
      selectedTypes.includes(room.type?.toLowerCase());
    const matchesBeds = !minBeds || Number(room.beds || 0) >= minBeds;

    const matchesMealPlan =
      selectedMealPlans.length === 0 ||
      selectedMealPlans.includes(room.mealPlan); // ✅ համեմատում ենք ըստ տվյալ դաշտի

    return (
      matchesOccupancy &&
      matchesPrice &&
      hasAllAmenities &&
      matchesType &&
      matchesBeds &&
      matchesMealPlan // ✅ նոր պայման
    );
  });

  // ✅ Սորտավորում ըստ ընտրության
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

      {/* ✅ Սենյակների սորտավորում + ցուցադրում */}
      <div style={{ marginTop: "40px" }}>
      <HotelRoomFilters />
        <div className={styles.roomsHeader}>
          <h3>
            Available Rooms for {totalGuests} guest
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

        {sortedRooms.length > 0 ? (
          sortedRooms.map((room) => (
            <RoomCard key={room._id} room={room} hotelId={hotel._id} />
          ))
        ) : (
          <p>No rooms available matching your criteria.</p>
        )}
      </div>
    </div>
  );
};

export default HotelDetails;
