export {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  getCluster,
  labelForTile,
  leaderboard,
  shopItems,
  tileColors,
  type BoosterId,
  type PaymentProductId,
  type TileColor,
} from './game';
export { paymentProducts } from './platform/payment';

export const tileVisuals = {
  berry: { label: 'Berry' },
  lemon: { label: 'Lemon' },
  mint: { label: 'Mint' },
  soda: { label: 'Soda' },
  grape: { label: 'Grape' },
} as const;
