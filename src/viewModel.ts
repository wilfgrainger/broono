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
  berry: { label: 'Berry', glyph: 'B' },
  lemon: { label: 'Lemon', glyph: 'L' },
  mint: { label: 'Mint', glyph: 'M' },
  soda: { label: 'Soda', glyph: 'S' },
  grape: { label: 'Grape', glyph: 'G' },
} as const;
