import { Scene } from 'phaser';
import { ASSETS } from '../../config/assetManifest';
import {
    BASE_SPEED,
    BG_CRATERS_HEIGHT,
    BG_CRATERS_SPEED,
    BG_CRATERS_Y,
    BG_SKY_HEIGHT,
    BG_STARS_HEIGHT,
    BG_STARS_SPEED,
    BG_STARS_Y,
    BG_SURFACE_HEIGHT,
    BG_SURFACE_SPEED,
    BG_SURFACE_Y,
    DEPTHS,
    GROUND_THICKNESS,
    GROUND_Y,
    HEIGHT,
    METEOR_COOLDOWN_SEGMENTS,
    PLAYER_X,
    PLAYER_Y,
    SEGMENT_WIDTH,
    SPEED_RAMP,
    WIDTH
} from '../../config/gameConfig';
import { Player } from '../objects/Player';
import { Difficulty } from '../systems/Difficulty';
import { FairSpawn } from '../systems/FairSpawn';
import { ObstacleManager } from '../systems/ObstacleManager';
import { setHighScoreIfHigher } from '../systems/Storage';

export class RunnerScene extends Scene
{
    constructor ()
    {
        super('RunnerScene');
        this.player = null;
        this.ground = null;
        this.obstacleManager = null;
        this.backgroundLayers = null;
        this.scrollX = 0;
        this.difficulty = null;
        this.fairSpawn = null;
        this.currentSpeed = BASE_SPEED;
        this.score = 0;
        this.scoreText = null;
        this.isGameOver = false;
        this.isEnding = false;
        this.elapsedSeconds = 0;
        this.segmentProgress = 0;
        this.spawnWindow = 600;
        this.timeSinceSpawn = 0;
    }

    preload ()
    {
        this.load.image('bg-sky', ASSETS.background.sky);
        this.load.image('bg-stars', ASSETS.background.starsStrip);
        this.load.image('bg-craters', ASSETS.background.cratersStrip);
        this.load.image('bg-surface', ASSETS.background.moonSurface);
        this.load.image('obstacle-crater', ASSETS.obstacles.crater);
    }

    create ()
    {
        this.currentSpeed = BASE_SPEED;
        this.score = 0;
        this.isGameOver = false;
        this.isEnding = false;
        this.elapsedSeconds = 0;
        this.segmentProgress = 0;
        this.startTime = this.time.now;

        this.cameras.main.setBackgroundColor('#0f0f0f');
        this.physics.world.setBounds(0, 0, WIDTH, HEIGHT);

        this.backgroundLayers = this.createBackgroundLayers();

        this.ground = this.add.rectangle(WIDTH / 2, GROUND_Y + GROUND_THICKNESS / 2, WIDTH, GROUND_THICKNESS, 0x2b2b2b)
            .setDepth(DEPTHS.GROUND);
        this.physics.add.existing(this.ground, true);

        this.player = new Player(this, PLAYER_X, PLAYER_Y);
        this.physics.add.collider(this.player.sprite, this.ground);

        this.obstacleManager = new ObstacleManager(this);
        const groups = this.obstacleManager.getGroups();
        this.physics.add.collider(this.player.sprite, groups.ground, () => this.handleGameOver());
        this.physics.add.collider(this.player.sprite, groups.air, () => this.handleGameOver());

        this.scoreText = this.add.text(24, 24, 'Score: 0', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff'
        }).setScrollFactor(0).setDepth(DEPTHS.UI);

        this.difficulty = new Difficulty({
            baseSpeed: BASE_SPEED,
            maxSpeed: 900,
            speedRamp: SPEED_RAMP,
            spawnIntervalStart: 1100,
            spawnIntervalMin: 600,
            spawnIntervalRamp: 25
        });

        this.fairSpawn = new FairSpawn({
            segmentWidth: SEGMENT_WIDTH,
            spawnWindow: this.spawnWindow,
            meteorCooldownSegments: METEOR_COOLDOWN_SEGMENTS,
            maxAttempts: 6
        });

        const jump = () => this.handleJump();

        this.input.on('pointerdown', jump);
        this.input.keyboard.on('keydown-SPACE', jump);
    }

    handleJump ()
    {
        if (this.isGameOver)
        {
            return;
        }

        this.player.jump();
    }

    createBackgroundLayers ()
    {
        const layers = {};

        if (this.textures.exists('bg-sky'))
        {
            layers.sky = this.add.image(0, 0, 'bg-sky')
                .setOrigin(0, 0)
                .setDisplaySize(WIDTH, BG_SKY_HEIGHT)
                .setDepth(DEPTHS.SKY);
        }
        else
        {
            const top = this.add.rectangle(WIDTH / 2, BG_SKY_HEIGHT * 0.25, WIDTH, BG_SKY_HEIGHT * 0.5, 0x0b0f1f)
                .setDepth(DEPTHS.SKY);
            const bottom = this.add.rectangle(WIDTH / 2, BG_SKY_HEIGHT * 0.75, WIDTH, BG_SKY_HEIGHT * 0.5, 0x141b2d)
                .setDepth(DEPTHS.SKY);
            layers.sky = [top, bottom];
        }

        layers.stars = this.createStripLayer({
            key: 'bg-stars',
            fallbackKey: 'bg-stars-fallback',
            width: WIDTH,
            height: BG_STARS_HEIGHT,
            y: BG_STARS_Y,
            depth: DEPTHS.STARS,
            draw: (context, width, height) => {
                context.fillStyle = '#0b0f1f';
                context.fillRect(0, 0, width, height);
                for (let i = 0; i < 12; i += 1)
                {
                    const x = (width / 12) * i + 8;
                    const y = 20 + (i % 4) * 18;
                    const radius = 2 + (i % 3);
                    context.fillStyle = '#ffffff';
                    context.beginPath();
                    context.arc(x, y, radius, 0, Math.PI * 2);
                    context.fill();
                }
            }
        });

        layers.craters = this.createStripLayer({
            key: 'bg-craters',
            fallbackKey: 'bg-craters-fallback',
            width: WIDTH,
            height: BG_CRATERS_HEIGHT,
            y: BG_CRATERS_Y,
            depth: DEPTHS.CRATERS,
            draw: (context, width, height) => {
                context.fillStyle = '#141b2d';
                context.fillRect(0, 0, width, height);
                context.fillStyle = '#0f1524';
                for (let i = 0; i < 4; i += 1)
                {
                    const craterX = 80 + i * 140;
                    const craterY = height;
                    context.beginPath();
                    context.ellipse(craterX, craterY, 60, 25, 0, Math.PI, 0);
                    context.fill();
                }
            }
        });

        layers.surface = this.createStripLayer({
            key: 'bg-surface',
            fallbackKey: 'bg-surface-fallback',
            width: WIDTH,
            height: BG_SURFACE_HEIGHT,
            y: BG_SURFACE_Y,
            depth: DEPTHS.SURFACE,
            draw: (context, width, height) => {
                context.fillStyle = '#2a2a2a';
                context.fillRect(0, 0, width, height);
                context.fillStyle = '#1c1c1c';
                for (let i = 0; i < 6; i += 1)
                {
                    const dotX = 50 + i * 80;
                    const dotY = 30 + (i % 3) * 20;
                    context.beginPath();
                    context.arc(dotX, dotY, 6 + (i % 2) * 2, 0, Math.PI * 2);
                    context.fill();
                }
            }
        });

        return layers;
    }

    createStripLayer ({ key, fallbackKey, width, height, y, depth, draw })
    {
        const textureKey = this.ensureStripTexture(key, fallbackKey, width, height, draw);
        return this.add.tileSprite(0, y, width, height, textureKey)
            .setOrigin(0, 0)
            .setDepth(depth);
    }

    ensureStripTexture (key, fallbackKey, width, height, draw)
    {
        if (this.textures.exists(key))
        {
            return key;
        }

        if (!this.textures.exists(fallbackKey))
        {
            const canvasTexture = this.textures.createCanvas(fallbackKey, width, height);
            const context = canvasTexture.getContext();
            draw(context, width, height);
            canvasTexture.refresh();
        }

        return fallbackKey;
    }

    updateBackgroundLayers ()
    {
        if (!this.backgroundLayers)
        {
            return;
        }

        if (this.backgroundLayers.stars)
        {
            this.backgroundLayers.stars.tilePositionX = this.scrollX * BG_STARS_SPEED;
        }
        if (this.backgroundLayers.craters)
        {
            this.backgroundLayers.craters.tilePositionX = this.scrollX * BG_CRATERS_SPEED;
        }
        if (this.backgroundLayers.surface)
        {
            this.backgroundLayers.surface.tilePositionX = this.scrollX * BG_SURFACE_SPEED;
        }
    }

    spawnSegment ()
    {
        const spawnX = WIDTH + 60;
        const pattern = this.fairSpawn.nextPattern(this.elapsedSeconds, () => this.canPlaceMeteor());

        if (pattern.ground === 'ROCK_SMALL')
        {
            this.obstacleManager.spawnRock('ROCK_SMALL', spawnX);
        }
        else if (pattern.ground === 'ROCK_BIG')
        {
            this.obstacleManager.spawnRock('ROCK_BIG', spawnX);
        }
        else if (pattern.ground === 'CRATER')
        {
            this.obstacleManager.spawnCrater(spawnX);
        }

        if (pattern.meteor !== 'NONE')
        {
            this.obstacleManager.spawnMeteor(pattern.meteor, spawnX);
        }
    }

    canPlaceMeteor ()
    {
        const groups = this.obstacleManager.getGroups();
        const playerX = this.player.x;
        return groups.air.getChildren().every((meteor) => meteor.x < playerX || meteor.x > playerX + this.spawnWindow);
    }

    handleGameOver ()
    {
        if (this.isGameOver)
        {
            return;
        }

        this.isGameOver = true;
        this.player.body.setVelocity(0, 0);
        this.player.body.setAllowGravity(false);
        this.score = Math.floor(this.score);
        setHighScoreIfHigher(this.score);
        this.time.delayedCall(100, () => {
            this.scene.start('GameOver', { score: this.score });
        });
    }

    update (_, delta)
    {
        if (this.isGameOver)
        {
            return;
        }

        this.elapsedSeconds = (this.time.now - this.startTime) / 1000;
        this.currentSpeed = this.difficulty.getSpeed(this.elapsedSeconds);
        this.score += (delta / 1000) * (this.currentSpeed / 100);
        this.scoreText.setText(`Score: ${Math.floor(this.score)}`);

        this.scrollX += this.currentSpeed * (delta / 1000);
        this.updateBackgroundLayers();

        this.segmentProgress += (this.currentSpeed * delta) / 1000;
        this.timeSinceSpawn += delta;
        while (this.segmentProgress >= SEGMENT_WIDTH)
        {
            const interval = this.difficulty.getSpawnInterval(this.elapsedSeconds);
            if (this.timeSinceSpawn < interval)
            {
                break;
            }
            this.segmentProgress -= SEGMENT_WIDTH;
            this.timeSinceSpawn = 0;
            this.spawnSegment();
        }

        this.obstacleManager.update(this.currentSpeed, delta / 1000);

        if (this.player.body.blocked.down)
        {
            const playerX = this.player.x;
            const inCrater = this.obstacleManager.craters.some((craterData) => playerX >= craterData.xStart && playerX <= craterData.xEnd);
            if (inCrater && !this.isEnding)
            {
                this.isEnding = true;
                this.player.fallIntoCrater(() => this.handleGameOver());
            }
        }
    }
}
