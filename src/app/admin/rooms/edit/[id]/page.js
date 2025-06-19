"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/utils/api";
import RoomForm from "@/components/admin/RoomForm"; // մեր ընդհանուր կոմպոնենտը

const EditRoomPage = () => {
  const params = useParams();
  const roomId = params.id;

  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await api.get(`/rooms/${roomId}`);
        setRoomData(res);
      } catch (err) {
        console.error("❌ Failed to load room", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  if (loading) return <p>Loading room data...</p>;
  if (!roomData) return <p>❌ Room not found</p>;

  return <RoomForm mode="edit" initialData={roomData} />;
};

export default EditRoomPage;