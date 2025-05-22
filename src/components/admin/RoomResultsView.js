"use client";
import React from "react";
import RoomCard from "./RoomCard";

const sampleRooms = [
  {
    id: 1,
    name: "Deluxe Lake View Room",
    price: 120,
    image: "/images/room1.jpg",
    beds: 2,
    bathrooms: 2,
    size: "24 ft²",
    description: "Luxurious room with lake view and modern amenities.",
  },
  {
    id: 2,
    name: "Family Suite",
    price: 180,
    image: "/images/room2.jpg",
    beds: 3,
    bathrooms: 2,
    size: "35 ft²",
    description: "Spacious suite perfect for families with kids.",
  },
];

const RoomResultsView = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {sampleRooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
};

export default RoomResultsView;