export const ASSET_CONFIG = Object.freeze({
    viewport: { width: 540, height: 960 },
    layers: [
        {
            id: 'background',
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
            id: 'stars',
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
            id: 'moon_surface',
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
            id: 'mountains',
            key: 'mountains',
            type: 'tile',
            file: 'layers/layer_mountains.png',
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
        groundReference: 'moon_surface',
        states: {
            run: {
                key: 'player_run',
                file: 'player/player_run.png'
            },
            jump: {
                key: 'player_jump',
                file: 'player/player_jump.png'
            },
            land: {
                key: 'player_land',
                file: 'player/player_land.png'
            },
            damage: {
                key: 'player_damage',
                file: 'player/player_damage.png'
            }
        }
    },
    obstacles: {
        meteor: {
            key: 'meteor',
            type: 'obstacle',
            file: 'obstacles/meteor.png',
            baseSize: { width: 100, height: 40 },
            groundReference: 'moon_surface'
        },
        crater: {
            key: 'crater',
            type: 'obstacle',
            file: 'obstacles/crater.png',
            baseSize: { width: 120, height: 40 },
            groundReference: 'moon_surface'
        },
        rock_small: {
            key: 'rock_small',
            type: 'obstacle',
            file: 'obstacles/rock_small.png',
            baseSize: { width: 59, height: 48 },
            groundReference: 'moon_surface'
        },
        rock_big: {
            key: 'rock_big',
            type: 'obstacle',
            file: 'obstacles/rock_big.png',
            baseSize: { width: 75, height: 85 },
            groundReference: 'moon_surface'
        }
    }
});
