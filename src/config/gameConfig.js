import { AUTO } from 'phaser';
import { RunnerScene } from '../scenes/RunnerScene';

export const VIEWPORT_WIDTH = 1080;
export const VIEWPORT_HEIGHT = 1920;
export const GROUND_LINE_Y = 1500;

export const LAYER_Y_POSITIONS = {
    foregroundCut: 1600,
    moonSurface: GROUND_LINE_Y - 60,
    mountains: 1320
};

export const PLAYER_X = 220;
export const GAMEPLAY_SPEED = 460;

const gameConfig = {
    type: AUTO,
    parent: 'app',
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    backgroundColor: '#0f0f0f',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1800 },
            debug: false
        }
    },
    scene: [RunnerScene]
};

export default gameConfig;
