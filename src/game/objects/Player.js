import { DEPTHS, GRAVITY_Y, JUMP_VELOCITY, PLAYER_H, PLAYER_W } from '../../config/gameConfig';
import { ASSET_BY_ID } from '../../config/assetManifest';

export class Player
{
    constructor (scene, x, y)
    {
        this.scene = scene;
        this.state = 'run';
        this.isFalling = false;

        const runTexture = this.ensurePlayerTexture('player.run', 'player-run-fallback', '#4fd1c5');
        this.sprite = scene.physics.add.image(x, y, runTexture);
        this.sprite.setDisplaySize(PLAYER_W, PLAYER_H);
        this.sprite.setDepth(DEPTHS.PLAYER);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setGravityY(GRAVITY_Y);
        this.sprite.body.setSize(PLAYER_W, PLAYER_H, true);
    }

    ensurePlayerTexture (id, fallbackKey, color)
    {
        if (this.scene.textures.exists(id) && !this.scene.missingAssetIds?.has(id))
        {
            return id;
        }

        if (!this.scene.textures.exists(fallbackKey))
        {
            const asset = ASSET_BY_ID[id];
            const texture = this.scene.textures.createCanvas(fallbackKey, asset.w, asset.h);
            const context = texture.getContext();
            context.fillStyle = color;
            context.fillRect(0, 0, asset.w, asset.h);
            context.fillStyle = '#111111';
            context.fillRect(8, 12, asset.w - 16, asset.h - 24);
            texture.refresh();
        }

        return fallbackKey;
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
        this.swapTextureForState();
    }

    swapTextureForState ()
    {
        const stateToId = {
            run: 'player.run',
            jump: 'player.jump',
            hurt: 'player.hurt'
        };

        const id = stateToId[this.state] ?? 'player.run';
        const texture = this.ensurePlayerTexture(id, `${id}-fallback`, '#4fd1c5');
        this.sprite.setTexture(texture);
        this.sprite.setDisplaySize(PLAYER_W, PLAYER_H);
    }

    update ()
    {
        if (!this.isFalling && this.sprite.body.blocked.down && this.state !== 'run')
        {
            this.setState('run');
        }
    }

    fallIntoCrater (onComplete)
    {
        if (this.isFalling)
        {
            return;
        }
        this.isFalling = true;
        this.setState('hurt');
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
