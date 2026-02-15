import { Scene } from 'phaser';
import { ASSET_BY_ID, ASSET_LIST } from '../../config/assetManifest';
import {
    BASE_SPEED,
    BG_BACKGROUND_HEIGHT,
    BG_BACKGROUND_WIDTH,
    BG_BACKGROUND_Y,
    BG_MOON_FOREGROUND_HEIGHT,
    BG_MOON_FOREGROUND_SPEED,
    BG_MOON_FOREGROUND_WIDTH,
    BG_MOON_FOREGROUND_Y,
    BG_MOON_SURFACE_HEIGHT,
    BG_MOON_SURFACE_SPEED,
    BG_MOON_SURFACE_WIDTH,
    BG_MOON_SURFACE_Y,
    BG_MOUNTAINS_HEIGHT,
    BG_MOUNTAINS_SPEED,
    BG_MOUNTAINS_WIDTH,
    BG_MOUNTAINS_Y,
    BG_STARS_HEIGHT,
    BG_STARS_WIDTH,
    BG_STARS_Y,
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
        this.missingAssetIds = new Set();
    }

    preload ()
    {
        this.preloadAssetsFromRegistry();
    }

    preloadAssetsFromRegistry ()
    {
        this.missingAssetIds.clear();
        this.load.on('loaderror', (file) => {
            if (file?.key)
            {
                this.missingAssetIds.add(file.key);
            }
        });

        ASSET_LIST.forEach((asset) => {
            this.load.image(asset.id, asset.path);
        });
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

        this.logAssetValidation();
        this.createMissingAssetDebugOverlay();
    }

    logAssetValidation ()
    {
        const tableData = ASSET_LIST.map((asset) => {
            const texture = this.textures.get(asset.id);
            const source = texture?.getSourceImage?.();
            const actualW = source?.width ?? null;
            const actualH = source?.height ?? null;
            const isMissing = this.missingAssetIds.has(asset.id) || !this.textures.exists(asset.id);
            const wrongSize = !isMissing && (actualW !== asset.w || actualH !== asset.h);

            return {
                status: isMissing ? 'missing' : (wrongSize ? 'loaded (size mismatch)' : 'loaded'),
                id: asset.id,
                path: asset.path,
                expected: `${asset.w}x${asset.h}`,
                actual: actualW && actualH ? `${actualW}x${actualH}` : '-'
            };
        });

        // Единая таблица для быстрой проверки ассетов в dev/prod.
        console.groupCollapsed('[MoonRunner] Проверка ассетов');
        console.table(tableData);
        console.groupEnd();
    }

    createMissingAssetDebugOverlay ()
    {
        if (!import.meta.env.DEV || this.missingAssetIds.size === 0)
        {
            return;
        }

        const missingList = Array.from(this.missingAssetIds).join(', ');
        this.add.text(12, 12, `Missing: ${missingList}`, {
            fontFamily: 'monospace',
            fontSize: 14,
            color: '#ff8f8f',
            backgroundColor: '#000000bb',
            padding: { x: 6, y: 4 }
        }).setDepth(DEPTHS.UI + 1).setScrollFactor(0);
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

        layers.background = this.createStaticLayer({
            key: ASSET_BY_ID['background.sky'].id,
            fallbackKey: 'bg-background-fallback',
            width: BG_BACKGROUND_WIDTH,
            height: BG_BACKGROUND_HEIGHT,
            x: 0,
            y: BG_BACKGROUND_Y,
            depth: DEPTHS.BACKGROUND,
            draw: (context, width, height) => {
                context.fillStyle = '#070b1a';
                context.fillRect(0, 0, width, height);
            }
        });

        layers.stars = this.createStaticLayer({
            key: ASSET_BY_ID['background.stars'].id,
            fallbackKey: 'bg-stars-fallback',
            width: BG_STARS_WIDTH,
            height: BG_STARS_HEIGHT,
            x: 0,
            y: BG_STARS_Y,
            depth: DEPTHS.STARS,
            draw: (context, width, height) => {
                context.fillStyle = 'rgba(0, 0, 0, 0)';
                context.fillRect(0, 0, width, height);
                context.fillStyle = '#ffffff';
                for (let i = 0; i < 28; i += 1)
                {
                    const x = 10 + (i * 19) % width;
                    const y = 20 + (i * 31) % (height * 0.55);
                    context.beginPath();
                    context.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
                    context.fill();
                }
            }
        });

        layers.mountains = this.createTileLayer({
            key: ASSET_BY_ID['background.mountains'].id,
            fallbackKey: 'bg-mountains-fallback',
            width: BG_MOUNTAINS_WIDTH,
            height: BG_MOUNTAINS_HEIGHT,
            y: BG_MOUNTAINS_Y,
            depth: DEPTHS.MOUNTAINS,
            draw: (context, width, height) => {
                context.fillStyle = '#171d33';
                context.fillRect(0, 0, width, height);
                context.fillStyle = '#202a48';
                for (let i = 0; i < 8; i += 1)
                {
                    const peakX = i * (width / 7);
                    context.beginPath();
                    context.moveTo(peakX - 80, height);
                    context.lineTo(peakX, 8 + (i % 3) * 10);
                    context.lineTo(peakX + 80, height);
                    context.closePath();
                    context.fill();
                }
            }
        });

        layers.surface = this.createTileLayer({
            key: ASSET_BY_ID['background.moonSurface'].id,
            fallbackKey: 'bg-surface-fallback',
            width: BG_MOON_SURFACE_WIDTH,
            height: BG_MOON_SURFACE_HEIGHT,
            y: BG_MOON_SURFACE_Y,
            depth: DEPTHS.SURFACE,
            draw: (context, width, height) => {
                context.fillStyle = '#343434';
                context.fillRect(0, 0, width, height);
                context.fillStyle = '#222222';
                for (let i = 0; i < 10; i += 1)
                {
                    const dotX = 40 + i * 52;
                    const dotY = 20 + (i % 4) * 24;
                    context.beginPath();
                    context.arc(dotX, dotY, 6 + (i % 2), 0, Math.PI * 2);
                    context.fill();
                }
            }
        });

        layers.foreground = this.createTileLayer({
            key: ASSET_BY_ID['background.moonForeground'].id,
            fallbackKey: 'bg-foreground-fallback',
            width: BG_MOON_FOREGROUND_WIDTH,
            height: BG_MOON_FOREGROUND_HEIGHT,
            y: BG_MOON_FOREGROUND_Y,
            depth: DEPTHS.FOREGROUND,
            draw: (context, width, height) => {
                // Передний срез луны перекрывает нижнюю часть геймплея.
                context.fillStyle = '#1f1f1f';
                context.fillRect(0, 0, width, height);
                context.fillStyle = '#2b2b2b';
                for (let i = 0; i < 6; i += 1)
                {
                    context.beginPath();
                    context.ellipse(80 + i * 90, 16, 42, 14, 0, 0, Math.PI * 2);
                    context.fill();
                }
            }
        });

        return layers;
    }

    createStaticLayer ({ key, fallbackKey, width, height, x, y, depth, draw })
    {
        const textureKey = this.ensureTexture(key, fallbackKey, width, height, draw);
        return this.add.image(x, y, textureKey)
            .setOrigin(0, 0)
            .setDisplaySize(width, height)
            .setDepth(depth);
    }

    createTileLayer ({ key, fallbackKey, width, height, y, depth, draw })
    {
        const textureKey = this.ensureTexture(key, fallbackKey, width, height, draw);
        return this.add.tileSprite(0, y, WIDTH, height, textureKey)
            .setOrigin(0, 0)
            .setDepth(depth);
    }

    ensureTexture (key, fallbackKey, width, height, draw)
    {
        if (this.textures.exists(key) && !this.missingAssetIds.has(key))
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

        if (this.backgroundLayers.mountains)
        {
            this.backgroundLayers.mountains.tilePositionX = this.scrollX * BG_MOUNTAINS_SPEED;
        }

        if (this.backgroundLayers.surface)
        {
            this.backgroundLayers.surface.tilePositionX = this.scrollX * BG_MOON_SURFACE_SPEED;
        }

        if (this.backgroundLayers.foreground)
        {
            this.backgroundLayers.foreground.tilePositionX = this.scrollX * BG_MOON_FOREGROUND_SPEED;
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
}
