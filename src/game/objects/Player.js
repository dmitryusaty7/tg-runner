import { DEBUG, DEPTHS, GRAVITY_Y, GROUND_Y, JUMP_VELOCITY, PLAYER_H, PLAYER_W } from '../../config/gameConfig';

export class Player
{
    constructor (scene, x, y, opts = {})
    {
        const { groundY = GROUND_Y } = opts;
        this.scene = scene;
        this.isFalling = false;

        // Игрок остаётся простым прямоугольником до появления готовых player PNG.
        // Позиционируем по нижнему центру, чтобы y = groundY всегда означал линию "ступней".
        this.sprite = scene.add.rectangle(x, groundY, PLAYER_W, PLAYER_H, 0x4fd1c5).setOrigin(0.5, 1).setDepth(DEPTHS.PLAYER);
        this.scene.physics.add.existing(this.sprite);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setGravityY(GRAVITY_Y);
        this.sprite.body.setSize(PLAYER_W, PLAYER_H, false);
        this.sprite.body.setOffset(-PLAYER_W / 2, -PLAYER_H);

        if (DEBUG)
        {
            console.log('[player] created', {
                x,
                groundY,
                w: PLAYER_W,
                h: PLAYER_H
            });
        }
    }

    get body ()
    {
        return this.sprite.body;
    }

    get x ()
    {
        return this.sprite.x;
    }

    jump ()
    {
        if (this.isFalling)
        {
            return;
        }

        if (this.sprite.body.blocked.down)
        {
            if (DEBUG)
            {
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
