import { Math as PhaserMath, Scene } from 'phaser';
import {
    BASE_SPEED,
    FLY_Y_MAX,
    FLY_Y_MIN,
    GRAVITY,
    GROUND_HEIGHT,
    GROUND_Y,
    HEIGHT,
    JUMP_VELOCITY,
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
        this.groundTimer = null;
        this.flyTimer = null;
        this.isGameOver = false;
        this.hasJumped = false;
    }

    create ()
    {
        this.cameras.main.setBackgroundColor('#0f0f0f');
        this.physics.world.setBounds(0, 0, WIDTH, HEIGHT);

        this.ground = this.add.rectangle(WIDTH / 2, GROUND_Y, WIDTH, GROUND_HEIGHT, 0x2b2b2b);
        this.physics.add.existing(this.ground, true);

        const playerSize = 80;
        this.player = this.add.rectangle(140, GROUND_Y - GROUND_HEIGHT / 2 - playerSize / 2, playerSize, playerSize, 0x4fd1c5);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(GRAVITY);
        this.player.body.setSize(playerSize, playerSize, true);

        this.physics.add.collider(this.player, this.ground);

        this.groundObstacles = this.physics.add.group({ allowGravity: false, immovable: true });
        this.flyingObstacles = this.physics.add.group({ allowGravity: false, immovable: true });

        this.physics.add.collider(this.player, this.groundObstacles, () => this.handleGameOver());
        this.physics.add.collider(this.player, this.flyingObstacles, () => this.handleGameOver());

        this.scoreText = this.add.text(24, 24, 'Счёт: 0', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff'
        }).setScrollFactor(0);

        this.hintText = this.add.text(WIDTH / 2, HEIGHT * 0.35, 'Tap/Click/Space to jump', {
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

        const obstacleWidth = PhaserMath.Between(60, 140);
        const obstacleHeight = PhaserMath.Between(60, 160);
        const x = WIDTH + obstacleWidth;
        const y = GROUND_Y - GROUND_HEIGHT / 2 - obstacleHeight / 2;
        const obstacle = this.add.rectangle(x, y, obstacleWidth, obstacleHeight, 0xff7a7a);

        this.physics.add.existing(obstacle);
        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityX(-this.currentSpeed);
        obstacle.body.setSize(obstacleWidth, obstacleHeight, true);

        this.groundObstacles.add(obstacle);
    }

    spawnFlyingObstacle ()
    {
        if (this.isGameOver)
        {
            return;
        }

        const obstacleSize = PhaserMath.Between(60, 110);
        const x = WIDTH + obstacleSize;
        const y = PhaserMath.Between(FLY_Y_MIN, FLY_Y_MAX);
        const obstacle = this.add.rectangle(x, y, obstacleSize, obstacleSize, 0xffc857);

        this.physics.add.existing(obstacle);
        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityX(-this.currentSpeed * 0.9);
        obstacle.body.setSize(obstacleSize, obstacleSize, true);

        this.flyingObstacles.add(obstacle);
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
        this.add.text(WIDTH / 2, HEIGHT * 0.45, 'GAME OVER', {
            fontFamily: 'Arial Black',
            fontSize: 56,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.add.text(WIDTH / 2, HEIGHT * 0.55, 'Click/Tap to restart', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#dddddd',
            align: 'center'
        }).setOrigin(0.5);

        const restart = () => this.scene.restart();
        this.input.once('pointerdown', restart);
        this.input.keyboard.once('keydown-SPACE', restart);
    }

    update (_, delta)
    {
        if (this.isGameOver)
        {
            return;
        }

        this.currentSpeed += SPEED_RAMP * (delta / 1000);
        this.score += (delta / 1000) * (this.currentSpeed / 100);
        this.scoreText.setText(`Счёт: ${Math.floor(this.score)}`);

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
    }
}
