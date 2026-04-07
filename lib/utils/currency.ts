export const formatPrice = (price: number | undefined | null, currency: string = 'CHF'): string => {
  if (price === undefined || price === null || isNaN(price)) {
    price = 0;
  }
  
  switch(currency?.toUpperCase()) {
    case 'EUR':
      return `${price.toFixed(2).replace('.', ',')} €`;
    case 'CHF':
    default:
      return `${price.toFixed(2)} CHF`;
  }
};