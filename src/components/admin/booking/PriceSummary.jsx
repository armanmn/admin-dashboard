// src/components/booking/PriceSummary.jsx
"use client";

import React from "react";
import { useCurrencyStore } from "@/stores/currencyStore";
import usePublicSettings from "@/hooks/usePublicSettings";
import { tryConvert } from "@/utils/fx";

const fmtMoney = (n) =>
  Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PriceSummary({
  baseAmount = 0,
  baseCurrency = "AMD",
  taxes = 0,
  fees = 0,
  nights = 1,
  showAMDNote = true,
}) {
  const userCurrency = useCurrencyStore((s) => s.currency);
  const { exchangeRates: rates } = usePublicSettings() || { exchangeRates: null };

  // All incoming numbers are presumed in baseCurrency (supplier’s currency)
  const subtotalBase = Number(baseAmount || 0);
  const taxesBase = Number(taxes || 0);
  const feesBase = Number(fees || 0);
  const totalBase = subtotalBase + taxesBase + feesBase;

  const show = (amount, from, to) => {
    const src = String(from || "").toUpperCase();
    const tgt = String(to || src).toUpperCase();
    if (!rates || !src || !tgt || src === tgt) return { value: amount, cur: src || tgt };
    const conv = tryConvert(Number(amount), src, tgt, rates);
    if (conv?.ok) return { value: conv.value, cur: tgt };
    return { value: amount, cur: src || tgt };
  };

  const row = (label, amount) => {
    const disp = show(amount, baseCurrency, userCurrency);
    return (
      <div style={{ display: "flex", justifyContent: "space-between", margin: "6px 0" }}>
        <span>{label}</span>
        <strong>{fmtMoney(disp.value)} {disp.cur}</strong>
      </div>
    );
  };

  const totalDisp = show(totalBase, baseCurrency, userCurrency);
  const amdDisp = show(totalBase, baseCurrency, "AMD");

  return (
    <div>
      {row("Subtotal", subtotalBase)}
      {row("Taxes", taxesBase)}
      {row("Fees", feesBase)}
      <div style={{ height: 1, background: "#eee", margin: "8px 0" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Total for {nights} night{nights > 1 ? "s" : ""}</span>
        <span style={{ fontSize: 18, fontWeight: 800 }}>
          {fmtMoney(totalDisp.value)} {totalDisp.cur}
        </span>
      </div>

      {showAMDNote && (
        <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
          Payment will be captured in <b>AMD</b>: {fmtMoney(amdDisp.value)} AMD
        </div>
      )}
    </div>
  );
}