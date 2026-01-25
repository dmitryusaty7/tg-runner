import { Scene } from 'phaser';
import { ASSETS } from '../../config/assetManifest';
import {
    BASE_SPEED,
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
import { Parallax } from '../systems/Parallax';
import { setHighScoreIfHigher } from '../systems/Storage';

export class RunnerScene extends Scene
{
    constructor ()
    {
        super('RunnerScene');
        this.player = null;
        this.ground = null;
        this.obstacleManager = null;
        this.parallax = null;
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
        this.load.image('bg-far-craters', ASSETS.background.farCraters);
        this.load.image('bg-ground', ASSETS.background.ground);
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

        this.parallax = new Parallax(this, [
            {
                key: 'bg-sky',
                color: '#0b0f1f',
                height: HEIGHT,
                y: 0,
                speedFactor: 0.15
            },
            {
                key: 'bg-far-craters',
                color: '#141c2f',
                height: HEIGHT,
                y: 0,
                speedFactor: 0.35,
                alpha: 0.8
            },
            {
                key: 'bg-ground',
                color: '#1f1f1f',
                height: GROUND_THICKNESS * 1.4,
                y: GROUND_Y - GROUND_THICKNESS * 0.2,
                speedFactor: 1.0
            }
        ]);

        this.ground = this.add.rectangle(WIDTH / 2, GROUND_Y + GROUND_THICKNESS / 2, WIDTH, GROUND_THICKNESS, 0x2b2b2b);
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
        }).setScrollFactor(0).setDepth(5);

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

        this.parallax.update(this.currentSpeed, delta / 1000);

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
