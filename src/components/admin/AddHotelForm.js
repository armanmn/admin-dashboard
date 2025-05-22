"use client";
import { useState } from "react";
import api from "@/utils/api";
import styles from "@/styles/AddHotelForm.module.css";
import { useRouter } from "next/navigation";

export default function AddHotelForm() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: {
      country: "",
      city: "",
      address: "",
      coordinates: {
        lat: "",
        lng: "",
      },
    },
    images: [""],
    facilities: [],
    popularFilters: [],
  });

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e, nestedPath) => {
    const value = e.target.value;
    if (nestedPath) {
      const [section, field] = nestedPath;
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [e.target.name]: value }));
    }
  };

  const handleCoordinateChange = (e, axis) => {
    const value = parseFloat(e.target.value);
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        coordinates: {
          ...prev.location.coordinates,
          [axis]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/hotels", formData);
      router.push("/admin/hotels");
    } catch (err) {
      setError("Failed to add hotel.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Add Hotel</h2>
      {error && <p className={styles.error}>{error}</p>}

      <input
        type="text"
        name="name"
        placeholder="Hotel Name"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
      />

      <input
        type="text"
        placeholder="Country"
        value={formData.location.country}
        onChange={(e) => handleChange(e, ["location", "country"])}
        required
      />

      <input
        type="text"
        placeholder="City"
        value={formData.location.city}
        onChange={(e) => handleChange(e, ["location", "city"])}
        required
      />

      <input
        type="text"
        placeholder="Address"
        value={formData.location.address}
        onChange={(e) => handleChange(e, ["location", "address"])}
        required
      />

      <input
        type="number"
        step="0.0001"
        placeholder="Latitude"
        value={formData.location.coordinates.lat}
        onChange={(e) => handleCoordinateChange(e, "lat")}
        required
      />

      <input
        type="number"
        step="0.0001"
        placeholder="Longitude"
        value={formData.location.coordinates.lng}
        onChange={(e) => handleCoordinateChange(e, "lng")}
        required
      />

      <input
        type="text"
        placeholder="Image URL"
        value={formData.images[0]}
        onChange={(e) =>
          setFormData((prev) => ({ ...prev, images: [e.target.value] }))
        }
      />

      <input
        type="text"
        placeholder="Facilities (comma-separated)"
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            facilities: e.target.value.split(",").map((item) => item.trim()),
          }))
        }
      />

      <input
        type="text"
        placeholder="Popular Filters (comma-separated)"
        onChange={(e) =>
          setFormData((prev) => ({
            ...prev,
            popularFilters: e.target.value.split(",").map((item) => item.trim()),
          }))
        }
      />

      <button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Hotel"}
      </button>
    </form>
  );
}