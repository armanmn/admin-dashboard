"use client";

import React, { useMemo, useState, useCallback } from "react";
import { useSelectionStore } from "@/stores/selectionStore";
import { displayAmountWithRoleAndCurrency, fmtMoney } from "@/utils/pricingDisplay";

const PRIMARY = "#f36323";

const SectionTitle = ({ children }) => (
  <div style={{ fontWeight: 800, margin: "18px 0 10px", fontSize: 16 }}>{children}</div>
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

function CollapsibleText({ text = "", maxChars = 420 }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const needs = text.length > maxChars;
  const shown = open || !needs ? text : text.slice(0, maxChars).trimEnd() + "…";
  return (
    <div>
      <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, color: "#374151" }}>{shown}</p>
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

export default function HotelDetailsView({
  hotel,
  offers = [],            // ← hook-ից կարող ես փոխանցել `offers` կամ rely անել hotel.offers-ի վրա
  arrivalDate,
  checkOutDate,
  nights,
  adults,
  children,
  rooms,
  userCurrency,
  role,
  user,
  exchangeRates,
  settings,
  onBack,
  onChangeSearch,
  onCheckAvailability,

  // from hook:
  fullAddress,
  areaLabel,
  aboutText,
  facilities = [],
  distances = [],
  heroPhotos = [],
  totalPhotoCount = 0,
}) {
  /* --------------------------- SAFE Zustand selectors --------------------------- */
  const items = useSelectionStore((s) => s.items);
  const upsertItem = useSelectionStore((s) => s.upsertItem); // OK եթե չկա՝ կլինի undefined
  const setQty = useSelectionStore((s) => s.setQty);         // OK եթե չկա՝ կլինի undefined

  /* --------------------------- Derived from items (memo) ------------------------ */
  const nonRefundablePolicy = useMemo(
    () => Array.isArray(items) && items.some((x) => x?.refundable === false),
    [items]
  );

  const cutoffAgg = useMemo(() => {
    if (!Array.isArray(items) || items.length === 0) return null;
    const ts = items
      .map((x) => (x?.platformCutoffUtc ? +new Date(x.platformCutoffUtc) : null))
      .filter((n) => Number.isFinite(n));
    if (!ts.length) return null;
    return new Date(Math.min(...ts)).toISOString();
  }, [items]);

  const totalBase = useMemo(() => {
    if (!Array.isArray(items) || !items.length) return 0;
    return items.reduce((sum, it) => {
      const shown = displayAmountWithRoleAndCurrency({
        baseAmount: it?.price?.amount ?? it?.amount ?? 0,
        baseCurrency: it?.price?.currency ?? it?.currency ?? "AMD",
        role,
        user,
        settings,
        targetCurrency: userCurrency,
        exchangeRates,
      });
      return sum + Number(shown.value || 0) * Number(it.qty || 0);
    }, 0);
  }, [items, role, user, settings, userCurrency, exchangeRates]);

  /* ------------------------------ Offers plumbing ------------------------------ */
  const offersList = useMemo(() => {
    const fromProp = Array.isArray(offers) ? offers : [];
    const fromHotel = Array.isArray(hotel?.offers) ? hotel.offers : [];
    const list = fromProp.length ? fromProp : fromHotel;
    // sort by price just in case (hook արդեն սորտավորում է, բայց double-safe)
    return [...list].sort(
      (a, b) => (a?.price?.amount ?? Infinity) - (b?.price?.amount ?? Infinity)
    );
  }, [offers, hotel?.offers]);

  console.log(
    "[HDV] offers to render:",
    offersList.length,
    { fromProp: offers?.length || 0, fromHotel: hotel?.offers?.length || 0 }
  );

  const canAddToCart = typeof upsertItem === "function";

  const handleAdd = useCallback(
    (o) => {
      if (!canAddToCart) return;
      const key =
        o?.offerProof ||
        o?.searchCode ||
        `${hotel?._id || hotel?.id || hotel?.hotelId || "h"}/${o?.roomName || "room"}/${o?.board || "BB"}/${o?.price?.amount || "0"}`;

      // normalize minimal cart item
      const cartItem = {
        key,
        hotelId: hotel?._id || hotel?.hotelId || hotel?.id || "",
        hotelName: hotel?.name || "",
        roomName: o?.roomName || "Room",
        board: o?.board || "",
        refundable: o?.refundable,
        platformCutoffUtc: o?.platformCutoffUtc || o?.platform?.cutoffUtc || null,
        supplierDeadlineUtc: o?.supplierDeadlineUtc || o?.supplier?.deadlineUtc || null,
        price: {
          amount: Number(o?.price?.amount || 0),
          currency: o?.price?.currency || "USD",
        },
        qty: 1,
        raw: o, // keep whole offer for later steps
      };

      upsertItem(cartItem);
      if (typeof setQty === "function") setQty(key, 1);
    },
    [canAddToCart, upsertItem, setQty, hotel?._id, hotel?.hotelId, hotel?.id, hotel?.name]
  );

  /* ----------------------------------- UI ----------------------------------- */

  return (
    <div style={{ padding: 12 }}>
      <button
        onClick={onBack}
        style={{
          marginBottom: 12,
          border: "1px solid #ccc",
          background: "#fff",
          padding: "6px 10px",
          borderRadius: 6,
        }}
      >
        ← Back to results
      </button>

      {/* header strip */}
      <div style={{ marginBottom: 8, color: "#444" }}>
        {hotel?.location?.city || "—"} • {arrivalDate || "—"} → {checkOutDate || "—"} •{" "}
        {adults || 2} adults • {rooms || 1} room{Number(rooms) > 1 ? "s" : ""}
      </div>

      <button
        onClick={onChangeSearch}
        style={{
          marginBottom: 16,
          border: "1px solid #ddd",
          background: "#fafafa",
          padding: "6px 10px",
          borderRadius: 6,
        }}
      >
        Change search
      </button>

      {/* name + stars */}
      <h1 style={{ margin: "8px 0", fontSize: 28, lineHeight: 1.2 }}>
        {hotel?.name} {hotel?.stars ? " " + "⭐".repeat(Number(hotel.stars)) : ""}
      </h1>

      {/* area + map + full address */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
        {areaLabel ? <Chip>📍 {areaLabel}</Chip> : null}
        <a
          href={
            hotel?.location?.lat && hotel?.location?.lng
              ? `https://www.google.com/maps?q=${hotel.location.lat},${hotel.location.lng}`
              : `https://www.google.com/maps?q=${encodeURIComponent(fullAddress || hotel?.name || "")}`
          }
          target="_blank"
          rel="noreferrer"
          style={{ color: "#1a73e8", textDecoration: "underline" }}
        >
          show map
        </a>
      </div>
      {fullAddress && <div style={{ color: "#6b7280", marginBottom: 8 }}>{fullAddress}</div>}

      {/* === GRID: left content + sticky right rail === */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) 360px",
          gap: 18,
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          {/* Photo collage */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gridTemplateRows: "220px 110px 110px",
              gap: 8,
              margin: "10px 0 16px",
            }}
          >
            {/* big main */}
            <div style={{ gridRow: "1 / span 3" }}>
              {heroPhotos[0] ? (
                <img
                  src={heroPhotos[0]}
                  alt="main"
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 12,
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#9ca3af",
                  }}
                >
                  No photo
                </div>
              )}
            </div>

            {[heroPhotos[1], heroPhotos[2]].map((src, i) => (
              <div key={`top-${i}`}>
                {src ? (
                  <img
                    src={src}
                    alt={`p${i + 1}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 12,
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af",
                    }}
                  >
                    No photo
                  </div>
                )}
              </div>
            ))}

            {[heroPhotos[3], heroPhotos[4]].map((src, i, arr) => {
              const isLast = i === arr.length - 1;
              const more = Math.max(0, totalPhotoCount - heroPhotos.length);
              return (
                <div key={`bot-${i}`} style={{ position: "relative" }}>
                  {src ? (
                    <img
                      src={src}
                      alt={`p${i + 3}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 12,
                        background: "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9ca3af",
                      }}
                    >
                      No photo
                    </div>
                  )}

                  {isLast && more > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 18,
                        borderRadius: 12,
                      }}
                    >
                      +{more} photos
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Facilities */}
          <SectionTitle>Most popular facilities</SectionTitle>
          {facilities.length ? (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 88, overflow: "hidden" }}>
                {facilities.slice(0, 16).map((f, i) => (
                  <Chip key={i}>{f}</Chip>
                ))}
              </div>
              {facilities.length > 16 && (
                <details>
                  <summary style={{ cursor: "pointer", color: PRIMARY, fontWeight: 600, marginTop: 6 }}>
                    See more
                  </summary>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                    {facilities.slice(16).map((f, i) => (
                      <Chip key={`m-${i}`}>{f}</Chip>
                    ))}
                  </div>
                </details>
              )}
            </>
          ) : (
            <div style={{ color: "#9ca3af" }}>No items</div>
          )}

          {/* About */}
          <SectionTitle>About this property</SectionTitle>
          {aboutText ? <CollapsibleText text={aboutText} /> : <div style={{ color: "#9ca3af" }}>No description</div>}

          {/* Distances */}
          <SectionTitle>Distances</SectionTitle>
          {distances.length ? (
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
          ) : (
            <div style={{ color: "#9ca3af" }}>No distances provided</div>
          )}

          {/* === OFFERS LIST === */}
          <SectionTitle>Available rooms & rates</SectionTitle>
          {offersList.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {offersList.map((o, idx) => {
                const priceView = displayAmountWithRoleAndCurrency({
                  baseAmount: o?.price?.amount ?? 0,
                  baseCurrency: o?.price?.currency ?? "USD",
                  role,
                  user,
                  settings,
                  targetCurrency: userCurrency,
                  exchangeRates,
                });

                const cutoff =
                  o?.platformCutoffUtc ||
                  o?.platform?.cutoffUtc ||
                  o?.supplierDeadlineUtc ||
                  o?.supplier?.deadlineUtc ||
                  null;

                return (
                  <div
                    key={o?.offerProof || o?.searchCode || idx}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 12,
                      display: "grid",
                      gridTemplateColumns: "minmax(0,1fr) auto",
                      alignItems: "center",
                      gap: 10,
                      background: "#fff",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700 }}>
                        {o?.roomName || "Room"} {o?.board ? `• ${o.board}` : ""}
                      </div>
                      <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                        {o?.refundable === false
                          ? "Non-refundable"
                          : cutoff
                          ? `Free cancel until ${new Date(cutoff).toLocaleString()}`
                          : o?.cxlDeadline
                          ? `Free cancel until ${o.cxlDeadline}`
                          : "Flexible cancellation"}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>
                        {fmtMoney(priceView.value)} {priceView.currency}
                      </div>
                      <button
                        disabled={!canAddToCart}
                        onClick={() => handleAdd(o)}
                        style={{
                          marginTop: 6,
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "none",
                          background: canAddToCart ? PRIMARY : "#ddd",
                          color: "#fff",
                          fontWeight: 700,
                          cursor: canAddToCart ? "pointer" : "not-allowed",
                        }}
                        title={canAddToCart ? "Add to selection" : "Cart actions not wired"}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: "#9ca3af" }}>No current offers for your dates.</div>
          )}
        </div>

        {/* RIGHT STICKY SUMMARY */}
        <div
          style={{
            position: "sticky",
            top: 12,
            alignSelf: "start",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 14,
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 16 }}>Your selection</div>
          <div style={{ color: "#444", marginBottom: 8 }}>
            {arrivalDate || "—"} → {checkOutDate || "—"} • {nights} night{nights > 1 ? "s" : ""}
            <br />
            {adults || 2} adults • {children || 0} children • {rooms || 1} room
            {Number(rooms) > 1 ? "s" : ""}
          </div>

          {items.length ? (
            <div style={{ marginBottom: 10 }}>
              {items.map((it) => {
                const line = displayAmountWithRoleAndCurrency({
                  baseAmount: it?.price?.amount ?? 0,
                  baseCurrency: it?.price?.currency ?? "AMD",
                  role,
                  user,
                  settings,
                  targetCurrency: userCurrency,
                  exchangeRates,
                });
                const lineTotal = Number(line.value || 0) * Number(it.qty || 0);
                return (
                  <div
                    key={it.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    <div style={{ maxWidth: 220, color: "#555" }}>
                      {it.roomName || "Room"}
                      {it.board ? ` • ${it.board}` : ""} × {it.qty}
                    </div>
                    <div>
                      {fmtMoney(lineTotal)} {line.currency}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: "#777", marginBottom: 10 }}>No rooms selected yet.</div>
          )}

          {items.length > 0 && (
            <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
              {nonRefundablePolicy
                ? "⚠️ Contains non-refundable room(s). The whole booking will be treated as non-refundable."
                : cutoffAgg
                ? `Free cancellation until ${new Date(cutoffAgg).toLocaleString()}.`
                : "Free cancellation policy depends on selected rooms."}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              margin: "8px 0",
              fontWeight: 800,
            }}
          >
            <div>Subtotal (rooms only)</div>
            <div>
              {fmtMoney(totalBase)} {userCurrency || "AMD"}
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#777", marginBottom: 10 }}>
            Taxes & fees are calculated at the next step.
          </div>

          <button
            disabled={!items.length}
            onClick={onCheckAvailability}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: items.length ? PRIMARY : "#ddd",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              cursor: items.length ? "pointer" : "not-allowed",
            }}
          >
            Check availability
          </button>
        </div>
      </div>
    </div>
  );
}