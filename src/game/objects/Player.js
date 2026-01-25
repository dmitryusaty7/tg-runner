import { DEPTHS, GRAVITY_Y, JUMP_VELOCITY, PLAYER_H, PLAYER_W } from '../../config/gameConfig';

export class Player
{
    constructor (scene, x, y)
    {
        this.scene = scene;
        this.state = 'run';
        this.isFalling = false;

        this.sprite = scene.add.rectangle(x, y, PLAYER_W, PLAYER_H, 0x4fd1c5);
        scene.physics.add.existing(this.sprite);
        this.sprite.setDepth(DEPTHS.PLAYER);
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
            this.sprite.body.setVelocityY(JUMP_VELOCITY);
            this.setState('jump');
        }
    }

    setState (state)
    {
        this.state = state;
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
