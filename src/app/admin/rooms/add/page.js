"use client";

import { useSearchParams } from "next/navigation";
import RoomForm from "@/components/admin/RoomForm";
import styles from "@/styles/addRoomPage.module.css"; // path ըստ քո setup-ի

export default function AddRoomPage() {
  const params = useSearchParams();
  const hotelId = params.get("hotelId");

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add New Room</h1>
      <p className={styles.subtitle}>
        Fill in the details below to create a room for your hotel.
      </p>
      <RoomForm mode="create" preselectedHotelId={hotelId} />
    </div>
  );
}