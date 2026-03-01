import { computeAnchorPosition } from './anchor';

const FALLBACK_COLORS = Object.freeze({
    static: '#2c3e50',
    tile: '#34495e'
});

export class LayerRenderer {
    constructor({ ctx, viewport, assetLoader, layerConfig }) {
        this.ctx = ctx;
        this.viewport = viewport;
        this.assetLoader = assetLoader;
        this.layerConfig = Array.isArray(layerConfig) ? layerConfig : [];
    }

    render({ worldX = 0 } = {}) {
        if (!this.ctx) {
            return;
        }

        const sortedLayers = [...this.layerConfig].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

        for (const layer of sortedLayers) {
            const cacheKey = layer.id;
            const cachedAsset = this.assetLoader.get(cacheKey);
            const elementSize = {
                width: cachedAsset?.width ?? layer.width,
                height: cachedAsset?.height ?? layer.height
            };
            const { x, y } = computeAnchorPosition({
                anchor: layer.anchor,
                viewport: this.viewport,
                elementSize,
                offsetBottom: layer.offsetBottom
            });

            if (layer.type === 'static') {
                this.renderStaticLayer(layer, cachedAsset, x, y);
                continue;
            }

            if (layer.type === 'tile') {
                this.renderTileLayer(layer, cachedAsset, y, worldX);
            }
        }
    }

    renderStaticLayer(layer, cachedAsset, x, y) {
        const source = cachedAsset?.img ?? this.createFallback(layer.width, layer.height, FALLBACK_COLORS.static);
        const prevAlpha = this.ctx.globalAlpha;

        if (typeof layer.opacity === 'number') {
            this.ctx.globalAlpha = layer.opacity;
        }

        this.ctx.drawImage(source, x, y, this.viewport.width, this.viewport.height);
        this.ctx.globalAlpha = prevAlpha;
    }

    renderTileLayer(layer, cachedAsset, y, worldX) {
        const tileWidth = layer.width;
        const tileHeight = layer.height;
        const source = cachedAsset?.img ?? this.createFallback(tileWidth, tileHeight, FALLBACK_COLORS.tile);

        if (!layer.repeatX) {
            this.ctx.drawImage(source, 0, y, tileWidth, tileHeight);
            return;
        }

        const parallaxSpeed = layer.parallaxSpeed ?? 1;
        const offsetX = -(worldX * parallaxSpeed) % tileWidth;
        const tileCount = Math.ceil(this.viewport.width / tileWidth) + 2;

        for (let i = 0; i < tileCount; i += 1) {
            const drawX = offsetX + (i - 1) * tileWidth;
            this.ctx.drawImage(source, drawX, y, tileWidth, tileHeight);
        }
    }

    createFallback(width, height, color) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = color;
            context.fillRect(0, 0, width, height);
        }
        return canvas;
    }
}
