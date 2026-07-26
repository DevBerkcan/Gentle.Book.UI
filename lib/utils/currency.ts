export const formatPrice = (
  price: number | undefined | null,
  currency: string = 'EUR',
  locale: string = 'de-DE',
): string => {
  const value = typeof price === 'number' && Number.isFinite(price) ? price : 0;
  const normalizedCurrency = currency?.trim().toUpperCase() || 'EUR';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${normalizedCurrency}`;
  }
};
