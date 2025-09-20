import { tryConvert } from "@/utils/fx";

// role: 'b2c' | 'b2b_sales_partner' | 'admin' | 'office_user' | 'finance_user' | 'b2b_hotel_partner' ...
export function applyRoleMarkup(baseAmount, role, opts = {}) {
  const amt = Number(baseAmount || 0);
  const user = opts.user || {};
  const settings = opts.settings || {};
  const pricing = settings?.pricing || settings; // allow both shapes

  let pct = 0;
  const r = String(role || "").toLowerCase();

  if (r === "b2b_sales_partner") {
    pct = Number(user?.markupPercentage ?? 0);
  } else if (r === "b2c") {
    // Try several common keys
    pct = Number(
      pricing?.b2cMarkup ??
      pricing?.B2C_MARKUP ??
      pricing?.b2c_markup ??
      0
    );
  } else {
    // admin/office/finance/hotel_partner → usually net view
    pct = 0;
  }
  return Math.max(0, amt * (1 + pct / 100));
}

export function displayAmountWithRoleAndCurrency({
  baseAmount,
  baseCurrency,
  role,
  user,
  settings,
  targetCurrency,
  exchangeRates
}) {
  const withMarkup = applyRoleMarkup(baseAmount, role, { user, settings });
  const src = String(baseCurrency || "AMD").toUpperCase();
  const tgt = String(targetCurrency || src).toUpperCase();
  if (!exchangeRates || !src || !tgt || src === tgt) {
    return { value: withMarkup, currency: src };
  }
  const conv = tryConvert(withMarkup, src, tgt, exchangeRates);
  if (conv?.ok) return { value: conv.value, currency: tgt };
  return { value: withMarkup, currency: src };
}

export const fmtMoney = (n) =>
  Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });