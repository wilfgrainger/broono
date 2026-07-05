export { leaderboard, shopItems, type PaymentProductId, type VitalName } from './game';
export { paymentProducts } from './platform/payment';

export const supportedVitals = [
  { id: 'hunger', label: 'Hunger' },
  { id: 'hydration', label: 'Hydration' },
  { id: 'temperature', label: 'Temperature' },
  { id: 'happiness', label: 'Happiness' },
] as const;
