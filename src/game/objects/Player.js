import { DEPTHS, GRAVITY_Y, JUMP_VELOCITY, PLAYER_H, PLAYER_W } from '../../config/gameConfig';

export class Player
{
    constructor (scene, x, y, { assetLoader, playerConfig, groundY })
    {
        this.scene = scene;
        this.isFalling = false;

        // Игрок остаётся простым прямоугольником до появления готовых player PNG.
        this.sprite = scene.add.rectangle(x, y, PLAYER_W, PLAYER_H, 0x4fd1c5).setOrigin(0, 0).setDepth(DEPTHS.PLAYER);
        this.scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setGravityY(GRAVITY_Y);
        this.sprite.body.setSize(PLAYER_W, PLAYER_H, true);
    }

    get body ()
    {
        return this.sprite.body;
    }

    get x ()
    {
        return this.sprite.x + this.sprite.displayWidth / 2;
    }

    jump ()
    {
        if (this.isFalling)
        {
            return;
        }

        if (this.sprite.body.blocked.down)
        {
            if (DEBUG) {
                console.log('[jump] triggered by input');
            }
            this.sprite.body.setVelocityY(JUMP_VELOCITY);
        }
    }

    update ()
    {
    }

    fallIntoCrater (onComplete)
    {
        if (this.isFalling)
        {
            return;
        }

        this.isFalling = true;
        this.sprite.body.enable = false;
        this.sprite.body.setVelocity(0, 0);
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.sprite.y + 50,
            alpha: 0,
            duration: 350,
            ease: 'Sine.easeIn',
            onComplete: () => {
                if (onComplete)
                {
                    onComplete();
                }
            }
        });
    }
}
