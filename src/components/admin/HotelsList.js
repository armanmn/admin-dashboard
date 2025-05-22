"use client";
import { useEffect, useState } from "react";
import api from "@/utils/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "react-bootstrap";
import styles from "@/styles/HotelsList.module.css"; // Կամ կարող ես ստեղծել HotelsList.module.css

const HotelsList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuthStore();

  // ✅ Բերում ենք հյուրանոցները
  const fetchHotels = async () => {
    try {
      const data = await api.get("/hotels");
      setHotels(data);
    } catch (error) {
      console.error("Failed to fetch hotels", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Approve կամ Suspend
  const handleApprovalToggle = async (hotelId, approve) => {
    try {
      await api.patch(`/hotels/${hotelId}/approve`, { isApproved: approve });

      // ✅ Թարմացնում ենք կոնկրետ հյուրանոցը տեղում
      setHotels((prevHotels) =>
        prevHotels.map((hotel) =>
          hotel._id === hotelId ? { ...hotel, isApproved: approve } : hotel
        )
      );
    } catch (error) {
      console.error("Approval error:", error);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>All Hotels</h2>

      {loading ? (
        <p>Loading hotels...</p>
      ) : hotels.length === 0 ? (
        <p>No hotels found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>Address</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Rooms</th>
              {user?.role === "admin" && (
              <th>Approve</th>
              )}
            </tr>
          </thead>
          <tbody>
            {hotels.map((hotel) => (
              <tr key={hotel._id}>
                <td>{hotel.name}</td>
                <td>{hotel.location?.city}</td>
                <td>{hotel.location?.address}</td>
                <td>{hotel.owner?.email || "N/A"}</td>
                <td
                  className={
                    hotel.isApproved
                      ? styles.statusApproved
                      : styles.statusPending
                  }
                >
                  {hotel.isApproved ? "✅ Approved" : "❌ Pending"}
                </td>
                <td>{hotel.rooms?.length || 0}</td>
                {user?.role === "admin" && (
                <td className={styles.actionsCell}>
                  <Button
                    className={`${styles.actionBtn} ${
                      hotel.isApproved ? styles.suspendBtn : styles.approveBtn
                    }`}
                    onClick={() =>
                      handleApprovalToggle(hotel._id, !hotel.isApproved)
                    }
                  >
                    {hotel.isApproved ? "Suspend" : "Approve"}
                  </Button>
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HotelsList;
