
// src/utils/formatMoney.js
export function formatMoney(amount, currency = "") {
  const n = Number.isFinite(+amount) ? Math.round(+amount) : 0; // ⬅️ կլորացում
  try {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(n) + (currency ? ` ${currency}` : "");
  } catch {
    return `${n.toLocaleString?.() ?? n}${currency ? ` ${currency}` : ""}`;
  }
}