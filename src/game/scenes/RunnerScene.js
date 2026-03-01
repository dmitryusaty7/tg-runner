import { Scene } from 'phaser';
import {
    BASE_SPEED,
    DEPTHS,
    GROUND_THICKNESS,
    GROUND_Y,
    HEIGHT,
    METEOR_COOLDOWN_SEGMENTS,
    PLAYER_X,
    SEGMENT_WIDTH,
    SPEED_RAMP,
    WIDTH,
    DEBUG
} from '../../config/gameConfig';
import { ASSET_CONFIG } from '../../systems/AssetManifest';
import { AssetLoader } from '../../systems/AssetLoader';
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

        this.assetLoader = null;

        this.backgroundLayer = null;
        this.starsLayer = null;
        this.moonSurfaceLayer = null;
        this.mountainsLayer = null;
    }

    preload ()
    {
        // Стабильная загрузка фона через Phaser Loader (WebGL/Canvas).
        this.load.image('bg_space', '/assets/images/layers/bg_space_540x960.png');
        this.load.image('stars', '/assets/images/layers/bg_stars_overlay_540x960.png');
        this.load.image('surface', '/assets/images/layers/layer_moon_surface_1080x210.png');
        this.load.image('mountains', '/assets/images/layers/mountains_1080x155.png');
    }

    create ()
    {
        this.currentSpeed = BASE_SPEED;
        this.score = 0;
        this.isGameOver = false;
        this.isEnding = false;
        this.elapsedSeconds = 0;
        this.segmentProgress = 0;
        this.scrollX = 0;
        this.startTime = this.time.now;

        this.cameras.main.setBackgroundColor('#0f0f0f');
        this.physics.world.setBounds(0, 0, WIDTH, HEIGHT);

        if (DEBUG)
        {
            console.log('[debug] scene start');
            console.log('[debug] viewport', ASSET_CONFIG.viewport);
            console.log('[debug] GROUND_Y', GROUND_Y);
        }

        this.setupLayerRendering();
        this.startGameplay();

        if (DEBUG)
        {
            console.log('[scene] ready');
        }
    }

    startGameplay ()
    {
        this.ground = this.add.rectangle(WIDTH / 2, GROUND_Y + GROUND_THICKNESS / 2, WIDTH, GROUND_THICKNESS, 0x2b2b2b)
            .setDepth(DEPTHS.GROUND)
            .setAlpha(0.001);
        this.physics.add.existing(this.ground, true);

        this.player = new Player(this, PLAYER_X, GROUND_Y, { groundY: GROUND_Y });
        this.physics.add.collider(this.player.sprite, this.ground);

        this.assetLoader = new AssetLoader({ basePath: '/assets/images' });
        this.assetLoader.loadAll(ASSET_CONFIG).catch((error) => {
            console.warn('[assets] obstacle preload failed', error);
        });

        this.obstacleManager = new ObstacleManager(this, {
            assetLoader: this.assetLoader,
            obstacleConfig: ASSET_CONFIG.obstacles
        });
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

        if (DEBUG)
        {
            console.log('[scene] gameplay started');
        }
    }

    setupLayerRendering ()
    {
        const ySurface = HEIGHT - 210;
        const yMountains = ySurface - 155;

        this.backgroundLayer = this.add.image(0, 0, 'bg_space').setOrigin(0, 0).setDepth(DEPTHS.BACKGROUND);
        this.starsLayer = this.add.image(0, 0, 'stars').setOrigin(0, 0).setDepth(DEPTHS.STARS);
        this.moonSurfaceLayer = this.add.tileSprite(0, ySurface, WIDTH, 210, 'surface').setOrigin(0, 0).setDepth(DEPTHS.SURFACE);
        this.mountainsLayer = this.add.tileSprite(0, yMountains, WIDTH, 155, 'mountains').setOrigin(0, 0).setDepth(DEPTHS.MOUNTAINS);

        if (DEBUG)
        {
            console.log('[layers] created', { key: 'bg_space', w: WIDTH, h: HEIGHT, y: 0 });
            console.log('[layers] created', { key: 'stars', w: WIDTH, h: HEIGHT, y: 0 });
            console.log('[layers] created', { key: 'surface', w: WIDTH, h: 210, y: ySurface });
            console.log('[layers] created', { key: 'mountains', w: WIDTH, h: 155, y: yMountains });
        }
    }

    handleJump ()
    {
        if (this.isGameOver || !this.player)
        {
            return;
        }

        this.player.jump();
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
        if (this.isGameOver || !this.player || !this.obstacleManager || !this.scoreText)
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
        try
        {
            if (this.isGameOver || !this.player || !this.obstacleManager || !this.scoreText)
            {
                return;
            }

            this.elapsedSeconds = (this.time.now - this.startTime) / 1000;
            this.currentSpeed = this.difficulty.getSpeed(this.elapsedSeconds);
            this.score += (delta / 1000) * (this.currentSpeed / 100);
            this.scoreText.setText(`Score: ${Math.floor(this.score)}`);

            this.scrollX += this.currentSpeed * (delta / 1000);

        if (this.moonSurfaceLayer)
        {
            this.moonSurfaceLayer.tilePositionX = this.scrollX * 1.0;
        }

        if (this.mountainsLayer)
        {
            this.mountainsLayer.tilePositionX = this.scrollX * 0.35;
        }

        if (this.moonSurfaceLayer)
        {
            this.moonSurfaceLayer.tilePositionX = this.scrollX * 1.0;
        }

        if (this.mountainsLayer)
        {
            this.mountainsLayer.tilePositionX = this.scrollX * 0.35;
        }

        if (this.moonSurfaceLayer)
        {
            this.moonSurfaceLayer.tilePositionX = this.scrollX * 1.0;
        }

        if (this.mountainsLayer)
        {
            this.mountainsLayer.tilePositionX = this.scrollX * 0.35;
        }

        if (this.moonSurfaceLayer)
        {
            this.moonSurfaceLayer.tilePositionX = this.scrollX * 1.0;
        }

        if (this.mountainsLayer)
        {
            this.mountainsLayer.tilePositionX = this.scrollX * 0.35;
        }

        this.segmentProgress += (this.currentSpeed * delta) / 1000;
        this.timeSinceSpawn += delta;
        while (this.segmentProgress >= SEGMENT_WIDTH)
        {
            const interval = this.difficulty.getSpawnInterval(this.elapsedSeconds);
            if (this.timeSinceSpawn < interval)
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

            this.player.update();
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
        catch (error)
        {
            console.error('[scene] update error', error);
            this.handleGameOver();
        }
    }
}
