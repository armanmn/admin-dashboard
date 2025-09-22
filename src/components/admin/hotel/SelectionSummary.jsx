"use client";

import React, { useMemo } from "react";
import { useSelectionStore } from "@/stores/selectionStore";
import { displayAmountWithRoleAndCurrency, fmtMoney } from "@/utils/pricingDisplay";
// import styles from "@/styles/SelectionSummary.module.css"; // հիմա չօգտագործենք

const PRIMARY = "#f36323";

export default function SelectionSummary({
  arrivalDate,
  checkOutDate,
  nights,
  adults,
  children,
  rooms,
  role,
  user,
  userCurrency,
  settings,
  exchangeRates,
  onCheckAvailability,
}) {
  // Zustand (SAFE selector)
  const items = useSelectionStore((s) => s.items);

  // Derived
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

  return (
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
  );
}