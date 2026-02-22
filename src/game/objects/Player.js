import { DEPTHS, GRAVITY_Y, JUMP_VELOCITY } from '../../config/gameConfig';

export class Player
{
    constructor (scene, x, y, { assetLoader, playerConfig, viewport, moonSurfaceHeight })
    {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.playerConfig = playerConfig;
        this.viewport = viewport;
        this.moonSurfaceHeight = moonSurfaceHeight;
        this.state = 'run';
        this.isFalling = false;

        const initialSize = this.getStateSize(this.state);
        const groundY = this.getGroundY();
        const initialX = x;
        const initialY = groundY - initialSize.height;

        this.sprite = scene.physics.add.image(initialX, initialY, '__DEFAULT');
        this.sprite.setOrigin(0, 0);
        this.sprite.setDepth(DEPTHS.PLAYER);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setGravityY(GRAVITY_Y);

        this.applyStateVisuals();
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

    setState (stateName)
    {
        if (!this.playerConfig?.states?.[stateName])
        {
            return;
        }

        if (this.state === stateName)
        {
            return;
        }

        this.state = stateName;
        this.applyStateVisuals();
    }

    getCurrentSpriteKey ()
    {
        return `player:${this.state}`;
    }

    getStateSize (stateName)
    {
        const key = `player:${stateName}`;
        const asset = this.assetLoader?.get(key);

        if (asset && !asset.isPlaceholder)
        {
            return { width: asset.width, height: asset.height };
        }

        return {
            width: this.playerConfig.baseSize.width,
            height: this.playerConfig.baseSize.height
        };
    }

    applyStateVisuals ()
    {
        const spriteKey = this.getCurrentSpriteKey();
        const textureKey = this.ensureTextureFromAsset(spriteKey);
        const size = this.getStateSize(this.state);

        const prevBottomY = this.sprite.y + this.sprite.displayHeight;

        this.sprite.setTexture(textureKey);
        this.sprite.setDisplaySize(size.width, size.height);
        this.sprite.body.setSize(size.width, size.height, true);

        // Не ломаем привязку к земле: меняем только высоту хитбокса/спрайта.
        if (this.sprite.body.blocked.down)
        {
            this.sprite.y = this.getGroundY() - size.height;
        }
        else
        {
            this.sprite.y = prevBottomY - size.height;
        }
    }

    ensureTextureFromAsset (assetKey)
    {
        const textureKey = `asset:${assetKey}`;

        const asset = this.assetLoader?.get(assetKey);

        if (asset?.img && !asset.isPlaceholder)
        {
            if (this.scene.textures.exists(textureKey))
            {
                this.scene.textures.remove(textureKey);
            }
            this.scene.textures.addImage(textureKey, asset.img);
            return textureKey;
        }

        if (this.scene.textures.exists(textureKey))
        {
            return textureKey;
        }

        const fallback = this.scene.textures.createCanvas(textureKey, this.playerConfig.baseSize.width, this.playerConfig.baseSize.height);
        const context = fallback.getContext();
        context.fillStyle = '#3498db';
        context.fillRect(0, 0, this.playerConfig.baseSize.width, this.playerConfig.baseSize.height);
        fallback.refresh();
        return textureKey;
    }

    getGroundY ()
    {
        const viewportHeight = this.viewport?.height ?? this.scene.scale.height;
        return viewportHeight - (this.moonSurfaceHeight ?? 0);
    }

    update ()
    {
        if (this.isFalling)
        {
            return;
        }

        if (!this.sprite.body.blocked.down)
        {
            if (this.sprite.body.velocity.y > 0)
            {
                this.setState('land');
            }
            else
            {
                this.setState('jump');
            }
            return;
        }

        if (this.state !== 'run')
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
        this.setState('damage');
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
