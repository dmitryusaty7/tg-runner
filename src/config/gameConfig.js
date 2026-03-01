export const SCENE_LAYOUT = Object.freeze({
    viewport: Object.freeze({ w: 540, h: 960 }),
    runLine: Object.freeze({ offsetFromBottom: 120, y: 840 }),
    layers: Object.freeze([
        Object.freeze({ id: 'bg_space', type: 'static', file: 'layers/bg_space_540x960.png', w: 540, h: 960, x: 0, y: 0, z: 0, alpha: 1 }),
        Object.freeze({ id: 'stars', type: 'static', file: 'layers/bg_stars_overlay_540x960.png', w: 540, h: 960, x: 0, y: 0, z: 1, alpha: 1 }),
        Object.freeze({ id: 'moon_surface', type: 'tile', file: 'layers/layer_moon_surface_1080x210.png', tileW: 1080, tileH: 210, drawW: 540, drawH: 210, x: 0, y: 750, z: 3, parallax: 1 }),
        Object.freeze({ id: 'mountains', type: 'tile', file: 'layers/mountains_1080x155.png', tileW: 1080, tileH: 155, drawW: 540, drawH: 155, x: 0, y: 595, z: 4, parallax: 0.35 })
    ]),
    obstacles: Object.freeze({
        groundY: 840,
        meteor: Object.freeze({ w: 85, h: 40, bottomOffsetFromRunLine: 140 }),
        crater: Object.freeze({ w: 100, h: 30, onRunLine: true }),
        rockSmall: Object.freeze({ w: 60, h: 50, onRunLine: true }),
        rockBig: Object.freeze({ w: 75, h: 85, onRunLine: true })
    })
});

export const WIDTH = SCENE_LAYOUT.viewport.w;
export const HEIGHT = SCENE_LAYOUT.viewport.h;

export const BASE_SPEED = 500;
export const SPEED_RAMP = 10;
export const SEGMENT_WIDTH = 260;
export const METEOR_COOLDOWN_SEGMENTS = 2;

export const GRAVITY_Y = 1400;
export const JUMP_VELOCITY = -620;
export const JUMP_DURATION_MS = 900;

export const SPAWN_GROUND_MS = 1200;
export const SPAWN_FLY_MS = 2200;
export const FAIRNESS_WINDOW_MS = 1000;
export const UNFAIR_OVERLAP_PX = 220;
export const AIR_MIN_GAP_MS = 900;
export const GROUND_MIN_GAP_PX = 320;
export const DEBUG_FAIRNESS = false;
export const DEBUG = true;

export const GROUND_THICKNESS = 80;
export const GROUND_Y = SCENE_LAYOUT.obstacles.groundY;

export const VIEWPORT_WIDTH = SCENE_LAYOUT.viewport.w;
export const VIEWPORT_HEIGHT = SCENE_LAYOUT.viewport.h;
export const RUN_LINE_OFFSET_FROM_BOTTOM = SCENE_LAYOUT.runLine.offsetFromBottom;
export const RUN_LINE_Y = SCENE_LAYOUT.runLine.y;
export const GROUND_LINE_Y = GROUND_Y;

export const BG_BACKGROUND_WIDTH = VIEWPORT_WIDTH;
export const BG_BACKGROUND_HEIGHT = VIEWPORT_HEIGHT;
export const BG_BACKGROUND_Y = 0;
export const BG_STARS_WIDTH = VIEWPORT_WIDTH;
export const BG_STARS_HEIGHT = VIEWPORT_HEIGHT;
export const BG_STARS_Y = 0;
export const BG_MOUNTAINS_WIDTH = 1080;
export const BG_MOUNTAINS_HEIGHT = 45;
export const BG_MOON_SURFACE_WIDTH = 1080;
export const BG_MOON_SURFACE_HEIGHT = 210;
export const BG_MOON_FOREGROUND_WIDTH = 1080;
export const BG_MOON_FOREGROUND_HEIGHT = 100;
export const BG_MOON_FOREGROUND_Y = VIEWPORT_HEIGHT - BG_MOON_FOREGROUND_HEIGHT;
export const BG_MOON_SURFACE_Y = BG_MOON_FOREGROUND_Y - BG_MOON_SURFACE_HEIGHT;
export const BG_MOUNTAINS_Y = BG_MOON_SURFACE_Y - BG_MOUNTAINS_HEIGHT;

export const BG_MOUNTAINS_SPEED = 0.2;
export const BG_MOON_SURFACE_SPEED = 0.7;
export const BG_MOON_FOREGROUND_SPEED = 0.5;

export const DEPTHS = {
    BACKGROUND: 0,
    STARS: 1,
    MOUNTAINS: 2,
    SURFACE: 3,
    GROUND: 4,
    CRATER: 5,
    OBSTACLE: 6,
    PLAYER: 7,
    FOREGROUND: 9,
    UI: 10
};

export const PLAYER_W = 60;
export const PLAYER_H = 85;
export const PLAYER_X = 120;
export const PLAYER_Y = GROUND_Y - PLAYER_H / 2;

export const ROCK_SMALL_W = SCENE_LAYOUT.obstacles.rockSmall.w;
export const ROCK_SMALL_H = SCENE_LAYOUT.obstacles.rockSmall.h;
export const ROCK_BIG_W = SCENE_LAYOUT.obstacles.rockBig.w;
export const ROCK_BIG_H = SCENE_LAYOUT.obstacles.rockBig.h;

export const CRATER_W = SCENE_LAYOUT.obstacles.crater.w;
export const CRATER_DEPTH = SCENE_LAYOUT.obstacles.crater.h;

export const METEOR_LANE_LOW_Y = RUN_LINE_Y - SCENE_LAYOUT.obstacles.meteor.bottomOffsetFromRunLine - SCENE_LAYOUT.obstacles.meteor.h;
export const METEOR_LANE_MID_Y = METEOR_LANE_LOW_Y;
export const METEOR_LANE_HIGH_Y = METEOR_LANE_LOW_Y;

export const METEOR = {
    W: SCENE_LAYOUT.obstacles.meteor.w,
    H: SCENE_LAYOUT.obstacles.meteor.h,
    yLevels: [METEOR_LANE_LOW_Y, METEOR_LANE_MID_Y, METEOR_LANE_HIGH_Y]
};
