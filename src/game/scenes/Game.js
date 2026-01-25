import { Math as PhaserMath, Scene } from 'phaser';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
        this.player = null;
        this.ground = null;
        this.obstacles = null;
        this.flyingObstacles = null;
        this.score = 0;
        this.scoreText = null;
        this.speed = 320;
        this.speedIncrease = 18;
        this.groundHeight = 120;
    }

    create ()
    {
        const { width, height } = this.scale;

        this.cameras.main.setBackgroundColor('#0c0c0c');
        this.physics.world.setBounds(0, 0, width, height);

        this.ground = this.add.rectangle(width / 2, height - this.groundHeight / 2, width, this.groundHeight, 0x2f2f2f);
        this.physics.add.existing(this.ground, true);

        const playerSize = 80;
        this.player = this.add.rectangle(140, height - this.groundHeight - playerSize / 2, playerSize, playerSize, 0x4fd1c5);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setGravityY(2000);
        this.player.body.setSize(playerSize, playerSize, true);

        this.physics.add.collider(this.player, this.ground);

        this.obstacles = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        this.flyingObstacles = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        this.physics.add.collider(this.player, this.obstacles, () => this.handleGameOver());
        this.physics.add.collider(this.player, this.flyingObstacles, () => this.handleGameOver());

        this.score = 0;
        this.scoreText = this.add.text(24, 24, 'Счёт: 0', {
            fontFamily: 'Arial Black',
            fontSize: 32,
            color: '#ffffff'
        }).setScrollFactor(0);

        this.time.addEvent({
            delay: 1200,
            loop: true,
            callback: () => this.spawnGroundObstacle()
        });

        this.time.addEvent({
            delay: 2300,
            loop: true,
            callback: () => this.spawnFlyingObstacle()
        });

        const jump = () => {
            if (this.player.body.blocked.down)
            {
                this.player.body.setVelocityY(-900);
            }
        };

        this.input.on('pointerdown', jump);
        this.input.keyboard.on('keydown-SPACE', jump);
    }

    spawnGroundObstacle ()
    {
        const { width, height } = this.scale;
        const obstacleWidth = PhaserMath.Between(60, 140);
        const obstacleHeight = PhaserMath.Between(60, 160);
        const x = width + obstacleWidth;
        const y = height - this.groundHeight - obstacleHeight / 2;
        const obstacle = this.add.rectangle(x, y, obstacleWidth, obstacleHeight, 0xff7a7a);

        this.physics.add.existing(obstacle);
        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityX(-this.speed);
        obstacle.body.setSize(obstacleWidth, obstacleHeight, true);

        this.obstacles.add(obstacle);
    }

    spawnFlyingObstacle ()
    {
        const { width, height } = this.scale;
        const obstacleSize = PhaserMath.Between(60, 110);
        const x = width + obstacleSize;
        const minY = height * 0.35;
        const maxY = height * 0.65;
        const y = PhaserMath.Between(minY, maxY);
        const obstacle = this.add.rectangle(x, y, obstacleSize, obstacleSize, 0xffc857);

        this.physics.add.existing(obstacle);
        obstacle.body.setAllowGravity(false);
        obstacle.body.setImmovable(true);
        obstacle.body.setVelocityX(-this.speed * 0.9);
        obstacle.body.setSize(obstacleSize, obstacleSize, true);

        this.flyingObstacles.add(obstacle);
    }

    handleGameOver ()
    {
        this.physics.pause();
        this.scene.start('GameOver', { score: Math.floor(this.score) });
    }

    update (_, delta)
    {
        this.speed += this.speedIncrease * (delta / 1000);
        this.score += (delta / 1000) * (this.speed / 100);
        this.scoreText.setText(`Счёт: ${Math.floor(this.score)}`);

        this.obstacles.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(-this.speed);
            if (obstacle.x < -obstacle.width)
            {
                obstacle.destroy();
            }
        });

        this.flyingObstacles.getChildren().forEach((obstacle) => {
            obstacle.body.setVelocityX(-this.speed * 0.9);
            if (obstacle.x < -obstacle.width)
            {
                obstacle.destroy();
            }
        });
    }
}
