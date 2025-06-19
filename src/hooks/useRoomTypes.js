// ✅ useRoomTypes.js
import { useEffect, useState } from "react";
import api from "@/utils/api"; // Axios wrapper with credentials

export default function useRoomTypes() {
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRoomTypes = async () => {
      try {
        const res = await api.get("/rooms/types"); // 👈 API endpoint
        setRoomTypes(res || []);
      } catch (err) {
        setError("Failed to load room types");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomTypes();
  }, []);

  return { roomTypes, loading, error };
}