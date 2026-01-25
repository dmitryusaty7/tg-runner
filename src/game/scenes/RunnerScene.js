import { Math as PhaserMath, Scene } from 'phaser';
import {
    BASE_SPEED,
    CRATER_DEPTH,
    CRATER_W,
    GRAVITY_Y,
    GROUND_THICKNESS,
    GROUND_Y,
    HEIGHT,
    JUMP_VELOCITY,
    METEOR_H,
    METEOR_W,
    METEOR_Y_LEVELS,
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
        this.hasJumped = false;
        this.hasStarted = false;
        this.playerState = 'run';
        this.craters = [];
    }

    create ()
    {
        this.cameras.main.setBackgroundColor('#0f0f0f');
        this.physics.world.setBounds(0, 0, WIDTH, HEIGHT);

        this.ground = this.add.rectangle(WIDTH / 2, GROUND_Y + GROUND_THICKNESS / 2, WIDTH, GROUND_THICKNESS, 0x2b2b2b);
        this.physics.add.existing(this.ground, true);

        this.player = this.add.rectangle(PLAYER_X, PLAYER_Y, PLAYER_W, PLAYER_H, 0x4fd1c5);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(GRAVITY_Y);
        this.player.body.setSize(PLAYER_W, PLAYER_H, true);

        this.physics.add.collider(this.player, this.ground);

        this.groundObstacles = this.physics.add.group({ allowGravity: false, immovable: true });
        this.flyingObstacles = this.physics.add.group({ allowGravity: false, immovable: true });

        this.physics.add.collider(this.player, this.groundObstacles, () => this.handleGameOver());
        this.physics.add.collider(this.player, this.flyingObstacles, () => this.handleGameOver());

        this.scoreText = this.add.text(24, 24, 'Очки: 0', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff'
        }).setScrollFactor(0);

        this.startText = this.add.text(WIDTH / 2, HEIGHT * 0.28, 'Нажми ЛКМ, чтобы начать', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        this.hintText = this.add.text(WIDTH / 2, HEIGHT * 0.35, 'Пробел — прыжок', {
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

        this.flyTimer = this.time.addEvent({
            delay: SPAWN_FLY_MS,
            loop: true,
            callback: () => this.spawnFlyingObstacle()
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

        if (this.player.body.blocked.down)
        {
            this.player.body.setVelocityY(JUMP_VELOCITY);
            this.playerState = 'jump';
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

        const roll = PhaserMath.Between(0, 2);
        if (roll === 0)
        {
            this.spawnCrater();
            return;
        }

        const obstacleType = roll === 1 ? 'ROCK_SMALL' : 'ROCK_BIG';
        const width = obstacleType === 'ROCK_SMALL' ? ROCK_SMALL_W : ROCK_BIG_W;
        const height = obstacleType === 'ROCK_SMALL' ? ROCK_SMALL_H : ROCK_BIG_H;
        const x = WIDTH + width;
        const y = GROUND_Y - height / 2;
        const obstacle = this.add.rectangle(x, y, width, height, 0xff7a7a);

        this.physics.add.existing(obstacle);
        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityX(-this.currentSpeed);
        obstacle.body.setSize(width, height, true);
        obstacle.setData('type', obstacleType);

        this.groundObstacles.add(obstacle);
    }

    spawnFlyingObstacle ()
    {
        if (this.isGameOver)
        {
            return;
        }

        const x = WIDTH + METEOR_W;
        const y = METEOR_Y_LEVELS[PhaserMath.Between(0, METEOR_Y_LEVELS.length - 1)];
        const obstacle = this.add.rectangle(x, y, METEOR_W, METEOR_H, 0xffc857);

        this.physics.add.existing(obstacle);
        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityX(-this.currentSpeed * 0.9);
        obstacle.body.setSize(METEOR_W, METEOR_H, true);
        obstacle.setData('type', 'METEOR');

        this.flyingObstacles.add(obstacle);
    }

    spawnCrater ()
    {
        const x = WIDTH + CRATER_W;
        const y = GROUND_Y + CRATER_DEPTH / 2;
        const crater = this.add.rectangle(x, y, CRATER_W, CRATER_DEPTH, 0x151515);
        crater.setData('type', 'CRATER');
        this.craters.push({ sprite: crater, xStart: x - CRATER_W / 2, xEnd: x + CRATER_W / 2 });
    }

    handleGameOver ()
    {
        if (this.isGameOver)
        {
            return;
        }

        this.isGameOver = true;
        this.physics.pause();
        this.groundTimer?.remove(false);
        this.flyTimer?.remove(false);

        this.add.rectangle(WIDTH / 2, HEIGHT / 2, WIDTH, HEIGHT, 0x000000, 0.5);
        this.add.text(WIDTH / 2, HEIGHT * 0.45, 'Игра окончена', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(WIDTH / 2, HEIGHT * 0.55, 'Нажми R для рестарта', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        const restart = () => this.scene.restart();
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
        this.scoreText.setText(`Очки: ${Math.floor(this.score)}`);
        this.playerState = this.player.body.blocked.down ? 'run' : 'jump';

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
                this.playerState = 'hurt';
                this.handleGameOver();
            }
        }
    }
}
