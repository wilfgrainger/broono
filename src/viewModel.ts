export {
  categories,
  leaderboard,
  styleThemes,
  wardrobeItems,
  type BroonoCard,
  type PaymentProductId,
  type StyleCategory,
  type StyleTag,
  type WardrobeItem,
} from './game';

export const categoryLabels = {
  hair: 'Hair',
  top: 'Top',
  bottom: 'Bottom',
  shoes: 'Shoes',
  prop: 'Prop',
  backdrop: 'Scene',
} as const;

export const reactionLabels = {
  clever: 'So clever',
  colors: 'Love colors',
  wild: 'Wild choice',
} as const;
