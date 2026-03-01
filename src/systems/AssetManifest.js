export const ASSET_CONFIG = Object.freeze({
    viewport: { width: 540, height: 960 },
    layers: [
        {
            id: 'background',
            key: 'background',
            type: 'static',
            file: 'layers/bg_space_540x960.png',
            width: 540,
            height: 960,
            size: { width: 540, height: 960 },
            anchor: 'top-left',
            zIndex: 0,
            scaleMode: 'cover'
        },
        {
            id: 'stars',
            key: 'stars',
            type: 'static',
            file: 'layers/bg_stars_overlay_540x960.png',
            width: 540,
            height: 960,
            size: { width: 540, height: 960 },
            anchor: 'top-left',
            zIndex: 1,
            opacity: 1
        },
        {
            id: 'moon_surface',
            key: 'moon_surface',
            type: 'tile',
            file: 'layers/layer_moon_surface_1080x210.png',
            width: 1080,
            height: 210,
            size: { width: 1080, height: 210 },
            anchor: 'bottom',
            offsetBottom: 0,
            parallaxSpeed: 1,
            repeatX: true,
            zIndex: 3
        },
        {
            id: 'mountains',
            key: 'mountains',
            type: 'tile',
            file: 'layers/mountains_1080x155.png',
            width: 1080,
            height: 155,
            size: { width: 1080, height: 155 },
            anchor: 'bottom',
            offsetBottom: 210,
            parallaxSpeed: 0.35,
            repeatX: true,
            zIndex: 4
        }
    ],
    player: {
        type: 'entity',
        baseSize: { width: 60, height: 85 },
        dynamicSize: true,
        states: {}
    },
    obstacles: {
        meteor: {
            key: 'meteor',
            type: 'obstacle',
            file: 'obstacles/meteor_85x40.png',
            baseSize: { width: 85, height: 40 }
        },
        crater: {
            key: 'crater',
            type: 'hole',
            file: 'obstacles/crater_100x30.png',
            baseSize: { width: 100, height: 30 }
        },
        rock_big: {
            key: 'rock_big',
            type: 'obstacle',
            file: 'obstacles/rock_big_75x85.png',
            baseSize: { width: 75, height: 85 }
        },
        rock_small: {
            key: 'rock_small',
            type: 'obstacle',
            file: 'obstacles/rock_small_60x50.png',
            baseSize: { width: 60, height: 50 }
        }
    }
});
