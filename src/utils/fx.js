// src/utils/fx.js
function normalizeRates(ratesObj) {
  if (!ratesObj || typeof ratesObj !== "object") return { base: null, rates: null };
  const base = ratesObj.base || ratesObj.Base || null;
  const rates = ratesObj.rates || ratesObj.Rates || ratesObj;
  return { base, rates };
}

/**
 * Անվտանգ փոխարկում:
 * rate semantics: 1 <CODE> = rates[CODE] <BASE>
 * Օր. 1 USD = 388.95 AMD
 */
export function tryConvert(amount, from, to, ratesObj) {
  const amt = Number(amount);
  if (!isFinite(amt)) return { ok: false };
  if (!from || !to || from === to) return { ok: true, value: amt, used: "same" };

  const { base, rates } = normalizeRates(ratesObj);
  if (!rates || typeof rates !== "object") return { ok: false };

  const rFrom = rates[from];
  const rTo = rates[to];

  // Եթե rate չկա կամ <=0, չենք փոխարկում
  if ((from !== base && (!rFrom || rFrom <= 0)) || (to !== base && (!rTo || rTo <= 0))) {
    return { ok: false };
  }

  let inBase;
  if (base && from === base) inBase = amt;
  else if (rFrom && rFrom > 0) inBase = amt * rFrom;
  else return { ok: false };

  let out;
  if (base && to === base) out = inBase;
  else if (rTo && rTo > 0) out = inBase / rTo;
  else return { ok: false };

  if (!isFinite(out)) return { ok: false };
  return { ok: true, value: out, used: "fx" };
}