import Phaser from 'phaser';
import { SurvivalScene } from './SurvivalScene';

export const createGame = (parent: string) => new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  backgroundColor: '#10150f',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [SurvivalScene],
  render: {
    antialias: true,
    roundPixels: true,
  },
});
