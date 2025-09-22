"use client";
import React, { useState } from "react";
import PhotoGallery from "@/components/admin/hotel/PhotoGallery";

import styles from "@/styles/HotelInfo.module.css"; // այժմ կարող է լինել դատարկ, չեմ օգտագործում className-ներ

const PRIMARY = "#f36323";

const SectionTitle = ({ children }) => (
  <div style={{ fontWeight: 800, margin: "18px 0 10px", fontSize: 16 }}>
    {children}
  </div>
);

const Chip = ({ children }) => (
  <span
    style={{
      border: "1px solid #e5e7eb",
      borderRadius: 999,
      padding: "4px 10px",
      fontSize: 12,
      background: "#fafafa",
    }}
  >
    {children}
  </span>
);

function CollapsibleChips({ items = [], max = 16, Chip }) {
  const [open, setOpen] = React.useState(false);
  if (!Array.isArray(items) || items.length === 0) return null;

  const hasMore = items.length > max;
  const shown = open ? items : items.slice(0, max);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {shown.map((f, i) => (
          <Chip key={i}>{f}</Chip>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setOpen((x) => !x)}
          style={{
            border: "none",
            background: "transparent",
            color: "#f36323",
            padding: 0,
            fontWeight: 600,
            cursor: "pointer",
            marginTop: 6,
          }}
        >
          {open ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}

function CollapsibleText({ text = "", maxChars = 420 }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const needs = text.length > maxChars;
  const shown = open || !needs ? text : text.slice(0, maxChars).trimEnd() + "…";
  return (
    <div>
      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, color: "#374151" }}>
        {shown}
      </p>
      {needs && (
        <button
          onClick={() => setOpen((x) => !x)}
          style={{
            border: "none",
            background: "transparent",
            color: PRIMARY,
            padding: 0,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {open ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
}

export default function HotelInfo({
  hotel,
  areaLabel,
  fullAddress,
  heroPhotos = [],
  totalPhotoCount = 0,
  aboutText,
  facilities = [],
  distances = [],
}) {
  return (
    <>
      {/* name + stars */}
      <h1 style={{ margin: "8px 0", fontSize: 28, lineHeight: 1.2 }}>
        {hotel?.name}{" "}
        {hotel?.stars ? " " + "⭐".repeat(Number(hotel.stars)) : ""}
      </h1>

      {/* area + map + full address */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 6,
        }}
      >
        {areaLabel ? <Chip>📍 {areaLabel}</Chip> : null}
        <a
          href={
            hotel?.location?.lat && hotel?.location?.lng
              ? `https://www.google.com/maps?q=${hotel.location.lat},${hotel.location.lng}`
              : `https://www.google.com/maps?q=${encodeURIComponent(
                  fullAddress || hotel?.name || ""
                )}`
          }
          target="_blank"
          rel="noreferrer"
          style={{ color: "#1a73e8", textDecoration: "underline" }}
        >
          show map
        </a>
      </div>
      {fullAddress && (
        <div style={{ color: "#6b7280", marginBottom: 8 }}>{fullAddress}</div>
      )}

      {/* Photo collage */}
      <PhotoGallery
        photos={heroPhotos}
        totalCount={totalPhotoCount}
        hotelName={hotel?.name}
      />

      {/* Facilities */}
      <SectionTitle>Most popular facilities</SectionTitle>
      {facilities?.length ? (
        <CollapsibleChips items={facilities} max={16} Chip={Chip} />
      ) : (
        <div style={{ color: "#9ca3af" }}>No items</div>
      )}

      {/* About */}
      <SectionTitle>About this property</SectionTitle>
      {aboutText ? (
        <CollapsibleText text={aboutText} />
      ) : (
        <div style={{ textAlign: "justify", color: "#9ca3af" }}>No description</div>
      )}

      {/* Distances */}
      {Array.isArray(distances) && distances.length > 0 && (
        <>
          <SectionTitle>Distances</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
              gap: 6,
            }}
          >
            {distances.map((d, i) => (
              <div key={i} style={{ color: "#374151" }}>
                <span style={{ fontWeight: 600 }}>{d?.label || "Place"}</span>{" "}
                <span style={{ color: "#6b7280" }}>— {d?.value || ""}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
