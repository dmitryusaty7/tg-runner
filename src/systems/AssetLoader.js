const PLACEHOLDER_COLORS = Object.freeze({
    background: '#2c3e50',
    stars: '#2c3e50',
    tile: '#34495e',
    player: '#3498db',
    obstacle: '#e74c3c',
    ui: '#f1c40f'
});

export class AssetLoader {
    constructor({ basePath = '/assets/moonrunner' } = {}) {
        this.basePath = basePath.replace(/\/$/, '');
        this.cache = new Map();

        if (import.meta.env.DEV) {
            console.log('[assets] basePath=', this.basePath);
        }
    }

    async loadAll(assetConfig) {
        const tasks = [];

        for (const layer of assetConfig.layers || []) {
            tasks.push(this.loadImage(
                layer.id,
                layer.file,
                layer.size || { width: layer.width, height: layer.height },
                this.getLayerPlaceholderColor(layer)
            ));
        }

        const playerStates = assetConfig.player?.states || {};
        for (const [stateName, stateConfig] of Object.entries(playerStates)) {
            tasks.push(this.loadImage(
                `player:${stateName}`,
                stateConfig.file,
                assetConfig.player?.baseSize,
                PLACEHOLDER_COLORS.player
            ));
        }

        for (const [obstacleName, obstacleConfig] of Object.entries(assetConfig.obstacles || {})) {
            tasks.push(this.loadImage(
                obstacleName,
                obstacleConfig.file,
                obstacleConfig.baseSize,
                PLACEHOLDER_COLORS.obstacle
            ));
        }

        return Promise.all(tasks);
    }

    async loadImage(key, relPath, fallbackSize = { width: 1, height: 1 }, placeholderColor = '#000000') {
        const normalizedFallback = this.normalizeSize(fallbackSize);
        const src = `${this.basePath}/${relPath}`;

        if (import.meta.env.DEV) {
            console.log('[assets] loading:', src);
        }

        try {
            const img = await this.createImage(src);
            const asset = {
                key,
                img,
                width: img.naturalWidth,
                height: img.naturalHeight,
                isPlaceholder: false
            };
            this.cache.set(key, asset);
            return asset;
        } catch {
            console.warn(`[AssetLoader] Ассет не найден: ${src}. Используется placeholder. Положите файл в public/assets/moonrunner/${relPath}.`);
            const canvas = this.createPlaceholderCanvas(normalizedFallback, placeholderColor);
            const asset = {
                key,
                img: canvas,
                width: normalizedFallback.width,
                height: normalizedFallback.height,
                isPlaceholder: true
            };
            this.cache.set(key, asset);
            return asset;
        }
    }

    get(key) {
        return this.cache.get(key);
    }

    getSize(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        return {
            width: entry.width,
            height: entry.height
        };
    }

    has(key) {
        return this.cache.has(key);
    }

    getLayerPlaceholderColor(layer) {
        if (layer.type === 'tile') {
            return PLACEHOLDER_COLORS.tile;
        }

        return PLACEHOLDER_COLORS[layer.key] || PLACEHOLDER_COLORS.background;
    }

    normalizeSize(size) {
        return {
            width: Number(size?.width) > 0 ? Number(size.width) : 1,
            height: Number(size?.height) > 0 ? Number(size.height) : 1
        };
    }

    createImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Не удалось загрузить изображение: ${src}`));
            image.src = src;
        });
    }

    createPlaceholderCanvas(size, color) {
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, size.width, size.height);
        }

        return canvas;
    }
}
