import Phaser from 'phaser';

const VIEWPORT_WIDTH = 540;
const VIEWPORT_HEIGHT = 960;
const RUN_LINE_OFFSET_FROM_BOTTOM = 150;
const RUN_LINE_Y = VIEWPORT_HEIGHT - RUN_LINE_OFFSET_FROM_BOTTOM;
const WORLD_SPEED_PX_S = 260;
const MOUNTAINS_PARALLAX = 0.35;
const JUMP_VELOCITY = 680;
const COYOTE_MS = 120;
const JUMP_BUFFER_MS = 120;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 85;

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
        this.ground = null;
        this.jumpKey = null;
        this.obstacles = [];
        this.spawnTimer = null;
        this.isGameOver = false;
        this.coyoteUntil = 0;
        this.jumpBufferedUntil = 0;
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

        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT);
        g.generateTexture('player_rect', PLAYER_WIDTH, PLAYER_HEIGHT);
        g.clear();
        g.fillStyle(0xffffff, 1);
        g.fillRect(0, 0, VIEWPORT_WIDTH, 10);
        g.generateTexture('ground_rect', VIEWPORT_WIDTH, 10);
        g.destroy();

        this.player = this.physics.add.sprite(100, RUN_LINE_Y, 'player_rect');
        this.player.setOrigin(0.5, 1);
        this.player.body.setAllowGravity(true);
        this.player.body.setGravityY(1400);
        this.player.setCollideWorldBounds(true);

        this.ground = this.physics.add.staticImage(VIEWPORT_WIDTH / 2, RUN_LINE_Y + 5, 'ground_rect')
            .setDisplaySize(VIEWPORT_WIDTH, 10)
            .setVisible(false);
        this.physics.add.collider(this.player, this.ground);

        this.jumpKey = this.input.keyboard.addKey('SPACE');
        this.obstacles = [];
        this.isGameOver = false;

        this.spawnTimer = this.time.addEvent({
            delay: 1200,
            loop: true,
            callback: () => this.spawnObstacle()
        });
    }

    spawnObstacle () {
        if (this.isGameOver) {
            return;
        }

        const type = Phaser.Utils.Array.GetRandom(OBSTACLE_TYPES);
        const x = 560;
        const size = OBSTACLE_SIZE[type];

        let y = RUN_LINE_Y - size.height;
        if (type === 'meteor') {
            const bottomY = RUN_LINE_Y - 140;
            y = bottomY - OBSTACLE_SIZE.meteor.height;
        }

        const obstacle = this.physics.add.image(x, y, type).setOrigin(0, 0);
        obstacle.body.setAllowGravity(false);
        obstacle.setImmovable(true);

        this.physics.add.overlap(this.player, obstacle, () => this.handleGameOver(), null, this);
        this.obstacles.push(obstacle);
    }

    handleGameOver () {
        if (this.isGameOver) {
            return;
        }

        this.isGameOver = true;

        if (this.spawnTimer) {
            this.spawnTimer.remove(false);
        }

        this.player.setVelocity(0, 0);

        this.add.text(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2, 'Game Over\nНажми R для рестарта', {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.input.keyboard.once('keydown-R', () => this.scene.restart());
    }

    update (_, delta) {
        const dt = delta / 1000;

        if (!this.isGameOver) {
            if (this.player.body.blocked.down) {
                this.coyoteUntil = this.time.now + COYOTE_MS;
            }

            if (Phaser.Input.Keyboard.JustDown(this.jumpKey) || this.input.activePointer.justDown) {
                this.jumpBufferedUntil = this.time.now + JUMP_BUFFER_MS;
            }

            if (this.time.now < this.jumpBufferedUntil && this.time.now < this.coyoteUntil) {
                this.jumpBufferedUntil = 0;
                this.coyoteUntil = 0;
                this.player.y -= 1;
                this.player.setVelocityY(-JUMP_VELOCITY);
            }

            this.surface.tilePositionX += WORLD_SPEED_PX_S * dt;
            this.mountains.tilePositionX += WORLD_SPEED_PX_S * MOUNTAINS_PARALLAX * dt;

            const moveX = WORLD_SPEED_PX_S * dt;
            for (let i = this.obstacles.length - 1; i >= 0; i -= 1) {
                const obstacle = this.obstacles[i];
                obstacle.x -= moveX;
                obstacle.body.updateFromGameObject();

                if (obstacle.x < -200) {
                    obstacle.destroy();
                    this.obstacles.splice(i, 1);
                }
            }
        }
    }
}
