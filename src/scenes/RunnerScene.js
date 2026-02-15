import { Scene } from 'phaser';
import registry from '../config/assetRegistry.json';
import {
    GAMEPLAY_SPEED,
    GROUND_LINE_Y,
    LAYER_Y_POSITIONS,
    PLAYER_X,
    VIEWPORT_HEIGHT,
    VIEWPORT_WIDTH
} from '../config/gameConfig';

const toFillColor = (hexColor) => Number.parseInt(hexColor.replace('#', '0x'), 16);

export class RunnerScene extends Scene {
    constructor() {
        super('RunnerScene');
        this.missingAssets = new Set();
        this.loadedAssets = new Set();
        this.parallaxLayers = [];
        this.player = null;
        this.obstacles = null;
    }

    preload() {
        this.load.on('filecomplete-image', (key) => {
            this.loadedAssets.add(key);
            this.missingAssets.delete(key);
        });

        this.load.on('loaderror', (file) => {
            this.missingAssets.add(file.key);
        });

        Object.entries(registry).forEach(([key, data]) => {
            this.load.image(key, data.path);
        });
    }

    create() {
        this.cameras.main.setBackgroundColor('#101010');
        this.physics.world.setBounds(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);

        this.createLayers();
        this.createPlayer();
        this.createObstacles();
        this.bindControls();
    }

    createLayers() {
        this.createParallaxLayer('background_cut', LAYER_Y_POSITIONS.foregroundCut, 0.35);
        this.createParallaxLayer('moon_surface', LAYER_Y_POSITIONS.moonSurface, 1);
        this.createParallaxLayer('mountains', LAYER_Y_POSITIONS.mountains, 0.2);
    }

    createParallaxLayer(assetKey, y, speed) {
        const asset = registry[assetKey];
        const x = VIEWPORT_WIDTH / 2;
        const hasTexture = this.textures.exists(assetKey) && !this.missingAssets.has(assetKey);

        if (hasTexture) {
            const layer = this.add.tileSprite(x, y, VIEWPORT_WIDTH, asset.height, assetKey)
                .setOrigin(0.5, 0)
                .setDepth(asset.layer);
            this.parallaxLayers.push({ layer, speed });
            return;
        }

        this.add.rectangle(x, y + asset.height / 2, VIEWPORT_WIDTH, asset.height, toFillColor(asset.placeholderColor))
            .setDepth(asset.layer);
    }

    createPlayer() {
        const asset = registry.player;
        const centerY = GROUND_LINE_Y - asset.height / 2;
        const hasTexture = this.textures.exists('player') && !this.missingAssets.has('player');

        if (hasTexture) {
            this.player = this.physics.add.image(PLAYER_X, centerY, 'player')
                .setDisplaySize(asset.width, asset.height)
                .setDepth(asset.layer);
        } else {
            this.player = this.add.rectangle(PLAYER_X, centerY, asset.width, asset.height, toFillColor(asset.placeholderColor))
                .setDepth(asset.layer);
            this.physics.add.existing(this.player);
        }

        this.player.body.setCollideWorldBounds(true);
        this.player.body.setSize(asset.width, asset.height);
        this.player.body.setOffset(-asset.width / 2, -asset.height / 2);
    }

    createObstacles() {
        this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
        this.time.addEvent({
            delay: 1400,
            loop: true,
            callback: () => this.spawnObstacle()
        });
    }

    spawnObstacle() {
        const asset = registry.obstacle_rock;
        const centerY = GROUND_LINE_Y - asset.height / 2;
        const x = VIEWPORT_WIDTH + asset.width;
        const hasTexture = this.textures.exists('obstacle_rock') && !this.missingAssets.has('obstacle_rock');

        let obstacle;
        if (hasTexture) {
            obstacle = this.physics.add.image(x, centerY, 'obstacle_rock')
                .setDisplaySize(asset.width, asset.height)
                .setDepth(asset.layer);
        } else {
            obstacle = this.add.rectangle(x, centerY, asset.width, asset.height, toFillColor(asset.placeholderColor))
                .setDepth(asset.layer);
            this.physics.add.existing(obstacle);
        }

        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityX(-GAMEPLAY_SPEED);
        this.obstacles.add(obstacle);
    }

    bindControls() {
        const jump = () => {
            if (this.player.body.blocked.down || this.player.body.touching.down) {
                this.player.body.setVelocityY(-820);
            }
        };

        this.input.keyboard.on('keydown-SPACE', jump);
        this.input.on('pointerdown', jump);
        this.physics.add.overlap(this.player, this.obstacles, () => this.resetRun(), undefined, this);
    }

    resetRun() {
        this.scene.restart();
    }

    update(_, delta) {
        const step = (delta / 1000) * GAMEPLAY_SPEED;

        this.parallaxLayers.forEach(({ layer, speed }) => {
            layer.tilePositionX += step * speed;
        });

        this.obstacles.getChildren().forEach((obstacle) => {
            if (obstacle.x < -120) {
                obstacle.destroy();
            }
        });
    }
}
