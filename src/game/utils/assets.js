const ensureMissingStore = (scene) => {
    if (!scene.__missingAssets)
    {
        scene.__missingAssets = new Set();
        scene.load.on('loaderror', (file) => {
            if (file?.key)
            {
                scene.__missingAssets.add(file.key);
            }
        });
    }

    return scene.__missingAssets;
};

export const safeLoadImage = (scene, key, url) => {
    ensureMissingStore(scene);
    if (!scene.textures.exists(key))
    {
        scene.load.image(key, url);
    }
};

export const safeLoadJSON = (scene, key, url) => {
    ensureMissingStore(scene);
    if (!scene.cache.json.exists(key))
    {
        scene.load.json(key, url);
    }
};

export const hasTexture = (scene, key) => {
    const missing = ensureMissingStore(scene);
    return scene.textures.exists(key) && !missing.has(key);
};

export const hasJSON = (scene, key) => {
    const missing = ensureMissingStore(scene);
    return scene.cache.json.exists(key) && !missing.has(key);
};

export const applySheetFromJson = (scene, sheetKey, jsonData) => {
    if (!jsonData || !hasTexture(scene, sheetKey))
    {
        return false;
    }

    const texture = scene.textures.get(sheetKey);
    const frames = jsonData.frames ?? {};
    Object.entries(frames).forEach(([frameName, frameData]) => {
        if (!texture.has(frameName))
        {
            texture.add(frameName, 0, frameData.x, frameData.y, frameData.w, frameData.h);
        }
    });

    const anims = jsonData.anims ?? {};
    Object.entries(anims).forEach(([animKey, animData]) => {
        const fullKey = `${sheetKey}:${animKey}`;
        if (scene.anims.exists(fullKey))
        {
            return;
        }
        const framesList = animData.frames.map((frameName) => ({
            key: sheetKey,
            frame: frameName
        }));
        scene.anims.create({
            key: fullKey,
            frames: framesList,
            frameRate: animData.fps ?? 12,
            repeat: animData.repeat ?? -1
        });
    });

    return true;
};

export const fitBodyToFrame = (sprite, options = {}) => {
    if (!sprite?.body || !sprite.frame)
    {
        return;
    }

    const { padX = 0, padY = 0, anchor = 'center' } = options;
    const width = Math.max(1, sprite.frame.width * sprite.scaleX - padX * 2);
    const height = Math.max(1, sprite.frame.height * sprite.scaleY - padY * 2);
    sprite.body.setSize(width, height, true);

    if (anchor === 'center')
    {
        const offsetX = (sprite.displayWidth - width) / 2;
        const offsetY = (sprite.displayHeight - height) / 2;
        sprite.body.setOffset(offsetX, offsetY);
    }
    else
    {
        sprite.body.setOffset(padX, padY);
    }
};
