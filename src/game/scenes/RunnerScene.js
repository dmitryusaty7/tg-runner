import { Math as PhaserMath, Scene } from 'phaser';
import { ASSETS } from '../../config/assetManifest';
import {
    BASE_SPEED,
    CRATER_DEPTH,
    CRATER_W,
    DEBUG_FAIRNESS,
    FAIRNESS_WINDOW_MS,
    GROUND_MIN_GAP_PX,
    GRAVITY_Y,
    GROUND_THICKNESS,
    GROUND_Y,
    HEIGHT,
    JUMP_VELOCITY,
    METEOR_LANE_HIGH_Y,
    METEOR_LANE_LOW_Y,
    METEOR,
    UNFAIR_OVERLAP_PX,
    AIR_MIN_GAP_MS,
    PLAYER_H,
    PLAYER_W,
    PLAYER_X,
    PLAYER_Y,
    ROCK_BIG_H,
    ROCK_BIG_W,
    ROCK_SMALL_H,
    ROCK_SMALL_W,
    SPAWN_FLY_MS,
    SPAWN_GROUND_MS,
    SPEED_RAMP,
    WIDTH
} from '../../config/gameConfig';

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
        this.hintText = null;
        this.startText = null;
        this.groundTimer = null;
        this.flyTimer = null;
        this.isGameOver = false;
        this.isRestarting = false;
        this.hasJumped = false;
        this.hasStarted = false;
        this.playerState = 'run';
        this.craters = [];
        this.missingTextures = new Set();
        this.timedEvents = [];
        this.lastGroundSpawnTime = 0;
        this.lastAirSpawnTime = 0;
        this.forceLowMeteorUntil = 0;
    }

    preload ()
    {
        this.missingTextures.clear();
        this.load.on('loaderror', (file) => {
            if (file?.key)
            {
                this.missingTextures.add(file.key);
            }
        });

        this.load.image('bg-sky', ASSETS.background.sky);
        this.load.image('bg-stars', ASSETS.background.stars);
        this.load.image('bg-moon', ASSETS.background.moonSurface);
        this.load.image('player-run', ASSETS.player.vaderRun);
        this.load.image('player-jump', ASSETS.player.vaderJump);
        this.load.image('player-hurt', ASSETS.player.vaderHurt);
        this.load.image('obstacle-crater', ASSETS.obstacles.crater);
        this.load.image('obstacle-rock-small', ASSETS.obstacles.rockSmall);
        this.load.image('obstacle-rock-big', ASSETS.obstacles.rockBig);
        this.load.image('obstacle-meteor', ASSETS.obstacles.meteor);
    }

    hasTexture (key)
    {
        return this.textures.exists(key) && !this.missingTextures.has(key);
    }

    create ()
    {
        this.currentSpeed = BASE_SPEED;
        this.score = 0;
        this.isGameOver = false;
        this.isRestarting = false;
        this.hasJumped = false;
        this.hasStarted = false;
        this.playerState = 'run';
        this.craters = [];
        this.timedEvents = [];
        this.lastGroundSpawnTime = 0;
        this.lastAirSpawnTime = 0;
        this.forceLowMeteorUntil = 0;

        this.cameras.main.setBackgroundColor('#0f0f0f');
        this.physics.world.setBounds(0, 0, WIDTH, HEIGHT);

        if (this.hasTexture('bg-sky'))
        {
            this.add.image(0, 0, 'bg-sky').setOrigin(0, 0).setDisplaySize(WIDTH, HEIGHT);
        }

        if (this.hasTexture('bg-stars'))
        {
            this.add.image(0, 0, 'bg-stars').setOrigin(0, 0).setAlpha(0.6).setDisplaySize(WIDTH, HEIGHT);
        }

        if (this.hasTexture('bg-moon'))
        {
            this.add.image(0, GROUND_Y + GROUND_THICKNESS / 2, 'bg-moon').setOrigin(0, 0.5).setDisplaySize(WIDTH, GROUND_THICKNESS);
        }

        this.ground = this.add.rectangle(WIDTH / 2, GROUND_Y + GROUND_THICKNESS / 2, WIDTH, GROUND_THICKNESS, 0x2b2b2b);
        this.physics.add.existing(this.ground, true);

        if (this.hasTexture('player-run'))
        {
            this.player = this.physics.add.sprite(PLAYER_X, PLAYER_Y, 'player-run');
            this.player.setDisplaySize(PLAYER_W, PLAYER_H);
            this.playerSprite = this.player;
        }
        else
        {
            this.player = this.add.rectangle(PLAYER_X, PLAYER_Y, PLAYER_W, PLAYER_H, 0x4fd1c5);
            this.physics.add.existing(this.player);
        }
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(GRAVITY_Y);
        this.player.body.setSize(PLAYER_W, PLAYER_H, true);

        this.physics.add.collider(this.player, this.ground);

        this.groundObstacles = this.physics.add.group({ allowGravity: false, immovable: true });
        this.flyingObstacles = this.physics.add.group({ allowGravity: false, immovable: true });

        this.physics.add.collider(this.player, this.groundObstacles, () => this.handleGameOver());
        this.physics.add.collider(this.player, this.flyingObstacles, () => this.handleGameOver());

        this.scoreText = this.add.text(24, 24, 'Score: 0', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff'
        }).setScrollFactor(0);

        this.startText = this.add.text(WIDTH / 2, HEIGHT * 0.28, 'Left click to start', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        this.hintText = this.add.text(WIDTH / 2, HEIGHT * 0.35, 'Space — jump', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        this.groundTimer = this.time.addEvent({
            delay: SPAWN_GROUND_MS,
            loop: true,
            callback: () => this.spawnGroundObstacle()
        });
        this.timedEvents.push(this.groundTimer);

        this.flyTimer = this.time.addEvent({
            delay: SPAWN_FLY_MS,
            loop: true,
            callback: () => this.spawnFlyingObstacle()
        });
        this.timedEvents.push(this.flyTimer);

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
            this.setPlayerState('jump');
            if (!this.hasStarted)
            {
                this.hasStarted = true;
                this.startText.setVisible(false);
            }
            if (!this.hasJumped)
            {
                this.hasJumped = true;
                this.hintText.setVisible(false);
            }
        }
    }

    spawnGroundObstacle ()
    {
        if (this.isGameOver)
        {
            return;
        }

        const now = this.time.now;
        const minGapMs = (GROUND_MIN_GAP_PX / this.currentSpeed) * 1000;
        if (now - this.lastGroundSpawnTime < minGapMs)
        {
            this.logFairness('Skip ground spawn due to minimum gap.');
            return;
        }

        const roll = PhaserMath.Between(0, 2);
        if (roll === 0)
        {
            this.spawnCrater();
            this.lastGroundSpawnTime = now;
            this.forceLowMeteorUntil = Math.max(this.forceLowMeteorUntil, now + FAIRNESS_WINDOW_MS);
            return;
        }

        const obstacleType = roll === 1 ? 'ROCK_SMALL' : 'ROCK_BIG';
        const width = obstacleType === 'ROCK_SMALL' ? ROCK_SMALL_W : ROCK_BIG_W;
        const height = obstacleType === 'ROCK_SMALL' ? ROCK_SMALL_H : ROCK_BIG_H;
        const x = WIDTH + width;
        const y = GROUND_Y - height / 2;
        const textureKey = obstacleType === 'ROCK_SMALL' ? 'obstacle-rock-small' : 'obstacle-rock-big';
        let obstacle;

        if (this.hasTexture(textureKey))
        {
            obstacle = this.physics.add.sprite(x, y, textureKey);
            obstacle.setDisplaySize(width, height);
        }
        else
        {
            obstacle = this.add.rectangle(x, y, width, height, 0xff7a7a);
            this.physics.add.existing(obstacle);
        }

        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityX(-this.currentSpeed);
        obstacle.body.setSize(width, height, true);
        obstacle.setData('type', obstacleType);
        obstacle.setData('requiresJump', true);

        this.groundObstacles.add(obstacle);
        this.lastGroundSpawnTime = now;
        this.forceLowMeteorUntil = Math.max(this.forceLowMeteorUntil, now + FAIRNESS_WINDOW_MS);
    }

    spawnFlyingObstacle ()
    {
        if (this.isGameOver)
        {
            return;
        }

        const now = this.time.now;
        if (now - this.lastAirSpawnTime < AIR_MIN_GAP_MS)
        {
            this.logFairness('Skip air spawn due to minimum gap.');
            return;
        }

        const x = WIDTH + METEOR.W;
        let y = METEOR.yLevels[PhaserMath.Between(0, METEOR.yLevels.length - 1)];
        const forceLow = this.shouldForceLowMeteorite(x);
        if (forceLow)
        {
            y = METEOR_LANE_LOW_Y;
            this.logFairness('Force low meteorite due to fairness window.');
        }
        else if (y === METEOR_LANE_HIGH_Y && this.hasGroundOverlap(x))
        {
            y = METEOR_LANE_LOW_Y;
            this.logFairness('Avoided high meteorite due to ground overlap.');
        }
        let obstacle;

        if (this.hasTexture('obstacle-meteor'))
        {
            obstacle = this.physics.add.sprite(x, y, 'obstacle-meteor');
            obstacle.setDisplaySize(METEOR.W, METEOR.H);
        }
        else
        {
            obstacle = this.add.rectangle(x, y, METEOR.W, METEOR.H, 0xffc857);
            this.physics.add.existing(obstacle);
        }

        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityX(-this.currentSpeed * 0.9);
        obstacle.body.setSize(METEOR.W, METEOR.H, true);
        obstacle.setData('type', 'METEOR');

        this.flyingObstacles.add(obstacle);
        this.lastAirSpawnTime = now;
    }

    spawnCrater ()
    {
        const x = WIDTH + CRATER_W;
        const y = GROUND_Y + CRATER_DEPTH / 2;
        let crater;

        if (this.hasTexture('obstacle-crater'))
        {
            crater = this.add.image(x, y, 'obstacle-crater');
            crater.setDisplaySize(CRATER_W, CRATER_DEPTH);
        }
        else
        {
            crater = this.add.rectangle(x, y, CRATER_W, CRATER_DEPTH, 0x151515);
        }
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
        this.stopSpawners();
        this.player.body.setVelocity(0, 0);
        this.player.body.setAllowGravity(false);
        this.groundObstacles.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(0);
        });
        this.flyingObstacles.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(0);
        });

        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.5);
        this.add.text(WIDTH / 2, HEIGHT * 0.45, 'Game Over', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(WIDTH / 2, HEIGHT * 0.55, 'Press R to restart', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        const restart = () => this.restartGame();
        this.input.once('pointerdown', restart);
        this.input.keyboard.once('keydown-R', restart);
    }

    update (_, delta)
    {
        if (this.isGameOver)
        {
            return;
        }

        this.currentSpeed += SPEED_RAMP * (delta / 1000);
        this.score += (delta / 1000) * (this.currentSpeed / 100);
        this.scoreText.setText(`Score: ${Math.floor(this.score)}`);
        if (this.player.body.blocked.down)
        {
            this.setPlayerState('run');
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
            if (obstacle.x < -obstacle.width)
            {
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

    stopSpawners ()
    {
        this.timedEvents.forEach((event) => event.remove(false));
        this.timedEvents = [];
        this.groundTimer = null;
        this.flyTimer = null;
    }

    restartGame ()
    {
        if (this.isRestarting)
        {
            return;
        }

        this.isRestarting = true;
        this.stopSpawners();

        this.groundObstacles?.clear(true, true);
        this.flyingObstacles?.clear(true, true);
        this.craters.forEach((craterData) => craterData.sprite.destroy());
        this.craters = [];

        this.scene.restart();
    }

    shouldForceLowMeteorite (spawnX)
    {
        if (this.time.now < this.forceLowMeteorUntil)
        {
            return true;
        }

        return this.hasGroundOverlap(spawnX);
    }

    hasGroundOverlap (spawnX)
    {
        const overlapDistance = UNFAIR_OVERLAP_PX;
        const playerX = this.player?.x ?? PLAYER_X;
        const groundOverlap = this.groundObstacles.getChildren().some((obstacle) => {
            if (!obstacle.active || !obstacle.getData('requiresJump'))
            {
                return false;
            }
            if (obstacle.x < playerX)
            {
                return false;
            }
            return Math.abs(spawnX - obstacle.x) <= overlapDistance;
        });

        if (groundOverlap)
        {
            return true;
        }

        return this.craters.some((craterData) => {
            if (!craterData.requiresJump)
            {
                return false;
            }
            if (craterData.sprite.x < playerX)
            {
                return false;
            }
            return Math.abs(spawnX - craterData.sprite.x) <= overlapDistance;
        });
    }

    logFairness (message)
    {
        if (!DEBUG_FAIRNESS)
        {
            return;
        }

        // eslint-disable-next-line no-console
        console.debug(`[Fairness] ${message}`);
    }

    setPlayerState (state)
    {
        if (this.playerState === state)
        {
            return;
        }

        this.playerState = state;

        if (!this.playerSprite)
        {
            return;
        }

        const textureMap = {
            run: 'player-run',
            jump: 'player-jump',
            hurt: 'player-hurt'
        };
        const nextTexture = textureMap[state];
        if (nextTexture && this.hasTexture(nextTexture))
        {
            this.playerSprite.setTexture(nextTexture);
            this.playerSprite.setDisplaySize(PLAYER_W, PLAYER_H);
        }
    }
}
