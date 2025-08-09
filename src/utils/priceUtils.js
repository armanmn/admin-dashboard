export const calculatePrice = (
  net,
  fromCurrency,
  toCurrency,
  markup,
  nights,
  rates
) => {
  if (!net || !fromCurrency || !toCurrency || !rates) {
    return { total: 0, convertedNet: 0 };
  }

  const fromRate = rates[fromCurrency] ?? 1;
  const toRate = rates[toCurrency] ?? 1;

  if (!fromRate || !toRate) {
    return { total: 0, convertedNet: 0 };
  }

  const convertedNet = net * (fromRate / toRate);
  const finalPrice = convertedNet * (1 + (markup || 0) / 100);

  return {
    total: finalPrice * (nights || 1),
    convertedNet: convertedNet * (nights || 1),
  };
};
