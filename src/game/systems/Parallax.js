export class Parallax
{
    constructor (scene, layers)
    {
        this.scene = scene;
        this.layers = layers.map((layer, index) => this.createLayer(layer, index));
    }

    createLayer (layer, index)
    {
        const { key, color, height, y, alpha = 1 } = layer;
        const textureKey = this.ensureTexture(key, color);
        const sprite = this.scene.add.tileSprite(0, y, this.scene.scale.width, height, textureKey)
            .setOrigin(0, 0)
            .setDepth(index)
            .setAlpha(alpha);
        return {
            sprite,
            speedFactor: layer.speedFactor
        };
    }

    ensureTexture (key, fallbackColor)
    {
        if (this.scene.textures.exists(key))
        {
            return key;
        }

        const fallbackKey = `${key}-fallback`;
        if (!this.scene.textures.exists(fallbackKey))
        {
            const canvasTexture = this.scene.textures.createCanvas(fallbackKey, 2, 2);
            const context = canvasTexture.getContext();
            context.fillStyle = fallbackColor;
            context.fillRect(0, 0, 2, 2);
            canvasTexture.refresh();
        }

        return fallbackKey;
    }

    update (speed, deltaSeconds)
    {
        this.layers.forEach((layer) => {
            layer.sprite.tilePositionX += speed * layer.speedFactor * deltaSeconds;
        });
    }
}
