import { tryConvert } from "./fx";

/**
 * Անվտանգ հաշվարկ:
 * - Փոխարկում միայն եթե rate-երը կան
 * - Հակառակ դեպքում չի փոխարկում (վերադարձնում է null-եր)
 * - nights բազմապատկումը թողնում ենք որպես պարամետր (որոշ դեպքերում պետք չի)
 */
export const calculatePrice = (
  net,
  fromCurrency,
  toCurrency,
  markup = 0,
  nights = 1,
  rates
) => {
  const amount = Number(net);
  if (!isFinite(amount) || !fromCurrency || !toCurrency) {
    return { ok: false, total: null, convertedNet: null };
  }

  const conv = tryConvert(amount, String(fromCurrency).toUpperCase(), String(toCurrency).toUpperCase(), rates);
  if (!conv?.ok) {
    return { ok: false, total: null, convertedNet: null };
  }

  const baseNet = Number(conv.value);
  const finalPerStay = baseNet * (1 + (Number(markup) || 0) / 100);
  const nightsMult = Number(nights) || 1;

  return {
    ok: true,
    total: finalPerStay * nightsMult,
    convertedNet: baseNet * nightsMult,
  };
};