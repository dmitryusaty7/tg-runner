import Phaser from 'phaser';

const VIEWPORT_WIDTH = 540;
const VIEWPORT_HEIGHT = 960;
const RUN_LINE_Y = 840;
const BASE_SCROLL_SPEED = 200;

const OBSTACLE_TYPES = Object.freeze([
    'crater',
    'rock_big',
    'rock_small',
    'meteor'
]);

const OBSTACLE_SIZE = Object.freeze({
    crater: { width: 100, height: 30 },
    rock_big: { width: 75, height: 85 },
    rock_small: { width: 60, height: 50 },
    meteor: { width: 85, height: 40 }
});

export default class RunnerScene extends Phaser.Scene {
    constructor () {
        super({ key: 'RunnerScene' });
        this.surface = null;
        this.mountains = null;
        this.player = null;
        this.obstacles = [];
    }

    preload () {
        this.load.image('bg_space', '/assets/images/layers/bg_space_540x960.png');
        this.load.image('stars', '/assets/images/layers/bg_stars_overlay_540x960.png');
        this.load.image('surface', '/assets/images/layers/layer_moon_surface_1080x210.png');
        this.load.image('mountains', '/assets/images/layers/mountains_1080x155.png');
        this.load.image('crater', '/assets/images/obstacles/crater_100x30.png');
        this.load.image('meteor', '/assets/images/obstacles/meteor_85x40.png');
        this.load.image('rock_big', '/assets/images/obstacles/rock_big_75x85.png');
        this.load.image('rock_small', '/assets/images/obstacles/rock_small_60x50.png');
    }

    create () {
        this.add.image(0, 0, 'bg_space').setOrigin(0, 0);
        this.add.image(0, 0, 'stars').setOrigin(0, 0).setAlpha(1);

        this.surface = this.add.tileSprite(0, 750, VIEWPORT_WIDTH, 210, 'surface').setOrigin(0, 0);
        this.mountains = this.add.tileSprite(0, 595, VIEWPORT_WIDTH, 155, 'mountains').setOrigin(0, 0);

        this.player = this.add.rectangle(100, RUN_LINE_Y - 85, 60, 85, 0xffffff).setOrigin(0, 0);
        this.obstacles = [];

        this.time.addEvent({
            delay: 1200,
            loop: true,
            callback: () => this.spawnObstacle()
        });
    }

    spawnObstacle () {
        const type = Phaser.Utils.Array.GetRandom(OBSTACLE_TYPES);
        const x = VIEWPORT_WIDTH + 20;
        const { height } = OBSTACLE_SIZE[type];

        let y = RUN_LINE_Y - height;
        if (type === 'meteor') {
            const bottomY = RUN_LINE_Y - 140;
            y = bottomY - OBSTACLE_SIZE.meteor.height;
        }

        const obstacle = this.add.image(x, y, type).setOrigin(0, 0);
        this.obstacles.push(obstacle);
    }

    update (_, delta) {
        const deltaSec = delta / 1000;

        this.surface.tilePositionX += BASE_SCROLL_SPEED * deltaSec;
        this.mountains.tilePositionX += BASE_SCROLL_SPEED * 0.35 * deltaSec;

        const moveX = BASE_SCROLL_SPEED * deltaSec;
        for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
            const obstacle = this.obstacles[i];
            obstacle.x -= moveX;

            if (obstacle.x < -200) {
                obstacle.destroy();
                this.obstacles.splice(i, 1);
            }
        }
    }
}
