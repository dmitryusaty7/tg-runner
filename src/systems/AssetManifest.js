export const ASSET_CONFIG = Object.freeze({
    viewport: { width: 540, height: 960 },
    layers: [
        {
            id: 'layer:background',
            key: 'background',
            type: 'static',
            file: 'layers/bg_space.png',
            width: 540,
            height: 960,
            size: { width: 540, height: 960 },
            anchor: 'top-left',
            zIndex: 0,
            scaleMode: 'cover'
        },
        {
            id: 'layer:stars',
            key: 'stars',
            type: 'static',
            file: 'layers/bg_stars_overlay.png',
            width: 540,
            height: 960,
            size: { width: 540, height: 960 },
            anchor: 'top-left',
            zIndex: 1,
            opacity: 0.6
        },
        {
            id: 'layer:mountains',
            key: 'mountains',
            type: 'tile',
            file: 'layers/layer_mountains.png',
            width: 1080,
            height: 45,
            size: { width: 1080, height: 45 },
            anchor: 'bottom',
            offsetBottom: 210,
            parallaxSpeed: 0.3,
            repeatX: true,
            zIndex: 2
        },
        {
            id: 'layer:moon_surface',
            key: 'moon_surface',
            type: 'tile',
            file: 'layers/layer_moon_surface.png',
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
            id: 'layer:moon_foreground',
            key: 'moon_foreground',
            type: 'tile',
            file: 'layers/layer_moon_foreground.png',
            width: 1080,
            height: 100,
            size: { width: 1080, height: 100 },
            anchor: 'bottom',
            offsetBottom: 0,
            repeatX: true,
            zIndex: 4
        }
    ],
    player: {
        type: 'entity',
        baseSize: { width: 60, height: 85 },
        dynamicSize: true,
        groundReference: 'moon_surface',
        // Подготовка под будущую анимационную структуру (дальше можно добавить frames).
        states: {
            run: {
                file: 'player/player_run.png'
            },
            jump: {
                file: 'player/player_jump.png'
            },
            land: {
                file: 'player/player_land.png'
            },
            damage: {
                file: 'player/player_damage.png'
            }
        }
    },
    obstacles: {
        meteor: {
            type: 'obstacle',
            file: 'obstacles/obstacle_meteor.png',
            baseSize: { width: 80, height: 30 },
            groundReference: 'moon_surface'
        },
        crater: {
            type: 'obstacle',
            file: 'obstacles/obstacle_crater.png',
            baseSize: { width: 90, height: 30 },
            groundReference: 'moon_surface'
        },
        rock_small: {
            type: 'obstacle',
            file: 'obstacles/obstacle_rock_small.png',
            baseSize: { width: 45, height: 40 },
            groundReference: 'moon_surface'
        },
        rock_large: {
            type: 'obstacle',
            file: 'obstacles/obstacle_rock_large.png',
            baseSize: { width: 70, height: 90 },
            groundReference: 'moon_surface'
        }
    }
});
