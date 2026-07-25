import { SurvivalScene } from './SurvivalScene';

export type GameClient = SurvivalScene;

export const createGame = (parent: string) => {
  const container = document.getElementById(parent);
  if (!container) throw new Error(`Game container #${parent} was not found`);
  return new SurvivalScene(container);
};
