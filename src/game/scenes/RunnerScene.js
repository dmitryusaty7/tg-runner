import { Math as PhaserMath, Scene } from 'phaser';
import { ASSETS } from '../../config/assetManifest';
import {
    BASE_SPEED,
    CRATER_DEPTH,
    CRATER_W,
    GRAVITY_Y,
    GROUND_THICKNESS,
    GROUND_Y,
    HEIGHT,
    JUMP_VELOCITY,
    METEOR,
    METEOR_COOLDOWN_SEGMENTS,
    METEOR_LANE_HIGH_Y,
    METEOR_LANE_LOW_Y,
    METEOR_LANE_MID_Y,
    PLAYER_H,
    PLAYER_W,
    PLAYER_X,
    PLAYER_Y,
    ROCK_BIG_H,
    ROCK_BIG_W,
    ROCK_SMALL_H,
    ROCK_SMALL_W,
    SEGMENT_WIDTH,
    SPEED_RAMP,
    WIDTH
} from '../../config/gameConfig';
import { setBestScoreIfHigher } from '../../services/highScore';
import {
    applySheetFromJson,
    fitBodyToFrame,
    hasJSON,
    hasTexture,
    safeLoadImage,
    safeLoadJSON
} from '../utils/assets';

export class RunnerScene extends Scene
{
    constructor ()
    {
        super('RunnerScene');
        this.player = null;
        this.playerSprite = null;
        this.ground = null;
        this.groundObstacles = null;
        this.flyingObstacles = null;
        this.currentSpeed = BASE_SPEED;
        this.score = 0;
        this.scoreText = null;
        this.isGameOver = false;
        this.isRestarting = false;
        this.playerState = 'run';
        this.craters = [];
        this.elapsedSeconds = 0;
        this.segmentProgress = 0;
        this.lastPatterns = [];
        this.segmentsSinceMeteor = METEOR_COOLDOWN_SEGMENTS;
        this.startTime = 0;
        this.parallaxLayers = null;
        this.playerSheetReady = false;
        this.obstaclesSheetReady = false;
        this.flameSheetReady = false;
        this.wasGrounded = true;
        this.landTimer = null;
    }

    preload ()
    {
        safeLoadImage(this, 'bg-sky', ASSETS.background.sky);
        safeLoadImage(this, 'bg-far-craters', ASSETS.background.farCraters);
        safeLoadImage(this, 'bg-ground', ASSETS.background.ground);

        safeLoadImage(this, 'player-sheet', ASSETS.player.sheet);
        safeLoadJSON(this, 'player-sheet-data', ASSETS.player.sheetData);

        safeLoadImage(this, 'obstacles-sheet', ASSETS.obstacles.sheet);
        safeLoadJSON(this, 'obstacles-sheet-data', ASSETS.obstacles.sheetData);

        safeLoadImage(this, 'meteor-flame', ASSETS.fx.meteorFlame);
        safeLoadJSON(this, 'meteor-flame-data', ASSETS.fx.meteorFlameData);

        safeLoadImage(this, 'ui-sheet', ASSETS.ui.sheet);
        safeLoadJSON(this, 'ui-sheet-data', ASSETS.ui.sheetData);
    }

    create ()
    {
        this.currentSpeed = BASE_SPEED;
        this.score = 0;
        this.isGameOver = false;
        this.isRestarting = false;
        this.playerState = 'run';
        this.craters = [];
        this.elapsedSeconds = 0;
        this.segmentProgress = 0;
        this.lastPatterns = [];
        this.segmentsSinceMeteor = METEOR_COOLDOWN_SEGMENTS;
        this.startTime = this.time.now;
        this.parallaxLayers = null;
        this.playerSheetReady = false;
        this.obstaclesSheetReady = false;
        this.flameSheetReady = false;
        this.wasGrounded = true;
        this.landTimer = null;

        this.cameras.main.setBackgroundColor('#0f0f0f');
        this.physics.world.setBounds(0, 0, WIDTH, HEIGHT);

        this.prepareSheets();
        this.parallaxLayers = this.createParallaxLayers();

        this.ground = this.add.rectangle(WIDTH / 2, GROUND_Y + GROUND_THICKNESS / 2, WIDTH, GROUND_THICKNESS, 0x2b2b2b)
            .setDepth(3);
        this.physics.add.existing(this.ground, true);

        if (this.playerSheetReady)
        {
            this.player = this.physics.add.sprite(PLAYER_X, PLAYER_Y, 'player-sheet', 'run_0');
            this.applyPlayerScale();
            this.player.play('player-sheet:run');
            this.player.on('animationupdate', () => {
                fitBodyToFrame(this.player, { padX: 4, padY: 6 });
            });
            this.playerSprite = this.player;
            fitBodyToFrame(this.player, { padX: 4, padY: 6 });
        }
        else
        {
            this.player = this.add.rectangle(PLAYER_X, PLAYER_Y, PLAYER_W, PLAYER_H, 0x4fd1c5);
            this.physics.add.existing(this.player);
        }
        this.player.setDepth(4);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(GRAVITY_Y);
        this.player.body.setSize(PLAYER_W, PLAYER_H, true);

        this.physics.add.collider(this.player, this.ground);

        this.groundObstacles = this.physics.add.group({ allowGravity: false, immovable: true });
        this.flyingObstacles = this.physics.add.group({ allowGravity: false, immovable: true });

        this.physics.add.collider(this.player, this.groundObstacles, () => this.handleGameOver());
        this.physics.add.collider(this.player, this.flyingObstacles, () => this.handleGameOver());

        this.scoreText = this.add.text(24, 24, 'Счёт: 0', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff'
        }).setScrollFactor(0).setDepth(5);

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

        if (this.player.body.blocked.down)
        {
            this.player.body.setVelocityY(JUMP_VELOCITY);
            this.setPlayerState('jump_up');
        }
    }

    createParallaxLayers ()
    {
        const farKey = this.ensureTexture('bg-sky', '#0b0f1f');
        const midKey = this.ensureTexture('bg-far-craters', '#101828');
        const nearKey = this.ensureTexture('bg-ground', '#1f1f1f');

        const far = this.add.tileSprite(0, 0, WIDTH, HEIGHT, farKey)
            .setOrigin(0, 0)
            .setDepth(0);

        const mid = this.add.tileSprite(0, 0, WIDTH, HEIGHT, midKey)
            .setOrigin(0, 0)
            .setAlpha(0.75)
            .setDepth(1);

        const nearHeight = GROUND_THICKNESS * 1.4;
        const near = this.add.tileSprite(0, GROUND_Y + GROUND_THICKNESS / 2, WIDTH, nearHeight, nearKey)
            .setOrigin(0, 0.5)
            .setDepth(2);

        return {
            far,
            mid,
            near
        };
    }

    ensureTexture (key, fallbackColor)
    {
        if (hasTexture(this, key))
        {
            return key;
        }

        const fallbackKey = `${key}-fallback`;
        if (!this.textures.exists(fallbackKey))
        {
            const canvasTexture = this.textures.createCanvas(fallbackKey, 2, 2);
            const context = canvasTexture.getContext();
            context.fillStyle = fallbackColor;
            context.fillRect(0, 0, 2, 2);
            canvasTexture.refresh();
        }

        return fallbackKey;
    }

    prepareSheets ()
    {
        if (hasTexture(this, 'player-sheet') && hasJSON(this, 'player-sheet-data'))
        {
            const playerData = this.cache.json.get('player-sheet-data');
            this.playerSheetReady = applySheetFromJson(this, 'player-sheet', playerData);
        }

        if (hasTexture(this, 'obstacles-sheet') && hasJSON(this, 'obstacles-sheet-data'))
        {
            const obstaclesData = this.cache.json.get('obstacles-sheet-data');
            this.obstaclesSheetReady = applySheetFromJson(this, 'obstacles-sheet', obstaclesData);
        }

        if (hasTexture(this, 'meteor-flame') && hasJSON(this, 'meteor-flame-data'))
        {
            const flameData = this.cache.json.get('meteor-flame-data');
            this.flameSheetReady = applySheetFromJson(this, 'meteor-flame', flameData);
        }
    }

    applyPlayerScale ()
    {
        if (!this.playerSprite?.frame)
        {
            return;
        }
        const scaleX = PLAYER_W / this.playerSprite.frame.width;
        const scaleY = PLAYER_H / this.playerSprite.frame.height;
        this.playerSprite.setScale(scaleX, scaleY);
    }

    spawnSegment ()
    {
        const spawnX = WIDTH + SEGMENT_WIDTH;
        const pattern = this.rollSegmentPattern();

        if (pattern.ground === 'ROCK_SMALL')
        {
            this.spawnRock('ROCK_SMALL', spawnX);
        }
        else if (pattern.ground === 'ROCK_BIG')
        {
            this.spawnRock('ROCK_BIG', spawnX);
        }
        else if (pattern.ground === 'CRATER')
        {
            this.spawnCrater(spawnX);
        }

        if (pattern.meteor !== 'NONE')
        {
            this.spawnMeteor(pattern.meteor, spawnX);
        }

        this.lastPatterns.push(pattern);
        if (this.lastPatterns.length > 2)
        {
            this.lastPatterns.shift();
        }

        if (pattern.meteor !== 'NONE')
        {
            this.segmentsSinceMeteor = 0;
        }
        else
        {
            this.segmentsSinceMeteor += 1;
        }
    }

    rollSegmentPattern ()
    {
        const elapsed = this.elapsedSeconds;
        const groundChance = PhaserMath.Clamp(0.35 + elapsed * 0.003, 0.35, 0.75);
        const meteorChanceBase = PhaserMath.Clamp(0.18 + elapsed * 0.0015, 0.18, 0.4);
        const meteorChance = this.segmentsSinceMeteor < METEOR_COOLDOWN_SEGMENTS ? 0 : meteorChanceBase;

        for (let attempt = 0; attempt < 6; attempt += 1)
        {
            const ground = this.pickGroundType(groundChance);
            const meteor = this.pickMeteorLane(meteorChance);
            const pattern = this.buildPattern(ground, meteor);
            if (this.isPatternAllowed(pattern))
            {
                return pattern;
            }
        }

        return this.buildPattern('NONE', 'NONE');
    }

    pickGroundType (chance)
    {
        if (Math.random() > chance)
        {
            return 'NONE';
        }

        const roll = Math.random();
        if (roll < 0.55)
        {
            return 'ROCK_SMALL';
        }
        if (roll < 0.85)
        {
            return 'ROCK_BIG';
        }
        return 'CRATER';
    }

    pickMeteorLane (chance)
    {
        if (Math.random() > chance)
        {
            return 'NONE';
        }

        const roll = Math.random();
        if (roll < 0.4)
        {
            return 'HIGH';
        }
        if (roll < 0.75)
        {
            return 'MID';
        }
        return 'LOW';
    }

    buildPattern (ground, meteor)
    {
        const requiresJump = ['ROCK_SMALL', 'ROCK_BIG', 'CRATER'].includes(ground) || meteor === 'LOW';
        return {
            ground,
            meteor,
            requiresJump
        };
    }

    isPatternAllowed (pattern)
    {
        if (pattern.ground === 'CRATER' && pattern.meteor === 'LOW')
        {
            return false;
        }

        if (pattern.ground === 'ROCK_BIG' && pattern.meteor === 'LOW')
        {
            return false;
        }

        const recentRequiresJump = this.lastPatterns.filter((item) => item.requiresJump).length;
        if (recentRequiresJump >= 2 && pattern.requiresJump)
        {
            return false;
        }

        if (recentRequiresJump >= 2 && pattern.meteor === 'LOW')
        {
            return false;
        }

        return true;
    }

    spawnRock (type, spawnX)
    {
        const width = type === 'ROCK_SMALL' ? ROCK_SMALL_W : ROCK_BIG_W;
        const height = type === 'ROCK_SMALL' ? ROCK_SMALL_H : ROCK_BIG_H;
        const x = spawnX + width / 2;
        const y = GROUND_Y - height / 2;
        const frameKey = type === 'ROCK_SMALL' ? 'rock_small' : 'rock_big';
        let obstacle;

        if (this.obstaclesSheetReady)
        {
            obstacle = this.physics.add.sprite(x, y, 'obstacles-sheet', frameKey);
            obstacle.setScale(width / obstacle.frame.width, height / obstacle.frame.height);
            fitBodyToFrame(obstacle, { padX: 2, padY: 2 });
        }
        else
        {
            obstacle = this.add.rectangle(x, y, width, height, 0xff7a7a);
            this.physics.add.existing(obstacle);
        }
        obstacle.setDepth(4);

        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityX(-this.currentSpeed);
        if (!this.obstaclesSheetReady)
        {
            obstacle.body.setSize(width, height, true);
        }
        obstacle.setData('type', type);
        obstacle.setData('requiresJump', true);

        this.groundObstacles.add(obstacle);
    }

    spawnMeteor (lane, spawnX)
    {
        const x = spawnX + METEOR.W / 2;
        const yMap = {
            HIGH: METEOR_LANE_HIGH_Y,
            MID: METEOR_LANE_MID_Y,
            LOW: METEOR_LANE_LOW_Y
        };
        const y = yMap[lane] ?? METEOR_LANE_MID_Y;
        let obstacle;

        if (this.obstaclesSheetReady)
        {
            obstacle = this.physics.add.sprite(x, y, 'obstacles-sheet', 'meteor');
            obstacle.setScale(METEOR.W / obstacle.frame.width, METEOR.H / obstacle.frame.height);
            fitBodyToFrame(obstacle, { padX: 2, padY: 2 });
        }
        else
        {
            obstacle = this.add.rectangle(x, y, METEOR.W, METEOR.H, 0xffc857);
            this.physics.add.existing(obstacle);
        }
        obstacle.setDepth(4);

        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityX(-this.currentSpeed * 0.9);
        if (!this.obstaclesSheetReady)
        {
            obstacle.body.setSize(METEOR.W, METEOR.H, true);
        }
        obstacle.setData('type', 'METEOR');
        obstacle.setData('lane', lane);
        obstacle.setData('flame', this.createMeteorFlame(obstacle));

        this.flyingObstacles.add(obstacle);
    }

    createMeteorFlame (meteor)
    {
        if (!this.flameSheetReady)
        {
            return null;
        }

        const flame = this.add.sprite(meteor.x - METEOR.W * 0.4, meteor.y, 'meteor-flame', 'flame_0');
        const scale = METEOR.H / flame.frame.height;
        flame.setScale(scale, scale);
        flame.setDepth(4);
        flame.play('meteor-flame:flame');
        return flame;
    }

    spawnCrater (spawnX)
    {
        const x = spawnX + CRATER_W / 2;
        const y = GROUND_Y + CRATER_DEPTH / 2;
        let crater;

        if (this.obstaclesSheetReady)
        {
            crater = this.add.image(x, y, 'obstacles-sheet', 'crater');
            crater.setScale(CRATER_W / crater.width, CRATER_DEPTH / crater.height);
        }
        else
        {
            crater = this.add.rectangle(x, y, CRATER_W, CRATER_DEPTH, 0x151515);
        }
        crater.setDepth(3);
        crater.setData('type', 'CRATER');
        crater.setData('requiresJump', true);
        this.craters.push({
            sprite: crater,
            xStart: x - CRATER_W / 2,
            xEnd: x + CRATER_W / 2,
            requiresJump: true
        });
    }

    handleGameOver ()
    {
        if (this.isGameOver)
        {
            return;
        }

        this.setPlayerState('hurt');
        this.isGameOver = true;
        this.player.body.setVelocity(0, 0);
        this.player.body.setAllowGravity(false);
        this.groundObstacles.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(0);
        });
        this.flyingObstacles.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(0);
        });

        const finalScore = Math.floor(this.score);
        const bestScore = setBestScoreIfHigher(finalScore);

        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.55).setDepth(10);
        this.add.text(WIDTH / 2, HEIGHT * 0.38, 'Конец игры', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(11);

        this.add.text(WIDTH / 2, HEIGHT * 0.48, `Счёт: ${finalScore}`, {
            fontFamily: 'Arial',
            fontSize: 32,
            color: '#ffe08a',
            align: 'center'
        }).setOrigin(0.5).setDepth(11);

        this.add.text(WIDTH / 2, HEIGHT * 0.54, `Лучший: ${bestScore}`, {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5).setDepth(11);

        this.add.text(WIDTH / 2, HEIGHT * 0.64, 'Нажмите R, чтобы перезапустить', {
            fontFamily: 'Arial',
            fontSize: 26,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5).setDepth(11);

        this.add.text(WIDTH / 2, HEIGHT * 0.7, 'Esc — меню', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5).setDepth(11);

        const restart = () => this.restartGame();
        const toMenu = () => this.scene.start('MainMenuScene');
        this.input.keyboard.once('keydown-R', restart);
        this.input.keyboard.once('keydown-ESC', toMenu);
    }

    update (_, delta)
    {
        if (this.isGameOver)
        {
            return;
        }

        this.elapsedSeconds = (this.time.now - this.startTime) / 1000;
        this.currentSpeed = BASE_SPEED + this.elapsedSeconds * SPEED_RAMP;
        this.score += (delta / 1000) * (this.currentSpeed / 100);
        this.scoreText.setText(`Счёт: ${Math.floor(this.score)}`);
        const grounded = this.player.body.blocked.down;
        if (this.playerSheetReady)
        {
            if (!grounded)
            {
                const verticalSpeed = this.player.body.velocity.y;
                if (verticalSpeed < -80)
                {
                    this.setPlayerState('jump_up');
                }
                else if (Math.abs(verticalSpeed) < 80)
                {
                    this.setPlayerState('jump_peak');
                }
                else
                {
                    this.setPlayerState('fall');
                }
                this.wasGrounded = false;
            }
            else if (!this.wasGrounded)
            {
                this.wasGrounded = true;
                this.setPlayerState('land');
                this.landTimer?.remove(false);
                this.landTimer = this.time.delayedCall(120, () => this.setPlayerState('run'));
            }
            else if (this.playerState !== 'run' && this.playerState !== 'land')
            {
                this.setPlayerState('run');
            }
        }
        else if (grounded)
        {
            this.setPlayerState('run');
        }

        if (this.parallaxLayers)
        {
            const deltaSeconds = delta / 1000;
            this.parallaxLayers.far.tilePositionX += this.currentSpeed * 0.15 * deltaSeconds;
            this.parallaxLayers.mid.tilePositionX += this.currentSpeed * 0.35 * deltaSeconds;
            this.parallaxLayers.near.tilePositionX += this.currentSpeed * 1.0 * deltaSeconds;
        }

        this.segmentProgress += (this.currentSpeed * delta) / 1000;
        while (this.segmentProgress >= SEGMENT_WIDTH)
        {
            this.segmentProgress -= SEGMENT_WIDTH;
            this.spawnSegment();
        }

        this.groundObstacles.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(-this.currentSpeed);
            if (obstacle.x < -obstacle.width)
            {
                obstacle.destroy();
            }
        });

        this.flyingObstacles.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(-this.currentSpeed * 0.9);
            const flame = obstacle.getData('flame');
            if (flame)
            {
                flame.x = obstacle.x - METEOR.W * 0.4;
                flame.y = obstacle.y;
            }
            if (obstacle.x < -obstacle.width)
            {
                if (flame)
                {
                    flame.destroy();
                }
                obstacle.destroy();
            }
        });

        this.craters = this.craters.filter((craterData) => {
            craterData.sprite.x -= (this.currentSpeed * delta) / 1000;
            craterData.xStart = craterData.sprite.x - CRATER_W / 2;
            craterData.xEnd = craterData.sprite.x + CRATER_W / 2;
            if (craterData.sprite.x < -CRATER_W)
            {
                craterData.sprite.destroy();
                return false;
            }
            return true;
        });

        if (this.player.body.blocked.down)
        {
            const playerX = this.player.x;
            const inCrater = this.craters.some((craterData) => playerX >= craterData.xStart && playerX <= craterData.xEnd);
            if (inCrater)
            {
                this.setPlayerState('hurt');
                this.handleGameOver();
            }
        }
    }

    restartGame ()
    {
        if (this.isRestarting)
        {
            return;
        }

        this.isRestarting = true;

        this.flyingObstacles?.getChildren().forEach((obstacle) => {
            const flame = obstacle.getData('flame');
            if (flame)
            {
                flame.destroy();
            }
        });
        this.groundObstacles?.clear(true, true);
        this.flyingObstacles?.clear(true, true);
        this.craters.forEach((craterData) => craterData.sprite.destroy());
        this.craters = [];

        this.scene.restart();
    }

    setPlayerState (state)
    {
        if (this.playerState === state)
        {
            return;
        }

        this.playerState = state;

        if (!this.playerSprite || !this.playerSheetReady)
        {
            return;
        }

        if (state === 'run')
        {
            this.playerSprite.play('player-sheet:run', true);
        }
        else if (state === 'hurt')
        {
            if (this.anims.exists('player-sheet:hurt'))
            {
                this.playerSprite.play('player-sheet:hurt', true);
            }
            else
            {
                this.playerSprite.setFrame('hurt_0');
            }
        }
        else
        {
            this.playerSprite.setFrame(state);
        }

        this.applyPlayerScale();
        fitBodyToFrame(this.playerSprite, { padX: 4, padY: 6 });
    }
}
