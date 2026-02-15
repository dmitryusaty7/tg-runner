export const WIDTH = 540;
export const HEIGHT = 960;

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

export const GROUND_THICKNESS = 80;
export const GROUND_Y = 820;

export const VIEWPORT_WIDTH = 540;
export const VIEWPORT_HEIGHT = 960;
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

export const PLAYER_W = 64;
export const PLAYER_H = 96;
export const PLAYER_X = 120;
export const PLAYER_Y = GROUND_Y - PLAYER_H / 2;

export const ROCK_SMALL_W = 44;
export const ROCK_SMALL_H = 32;
export const ROCK_BIG_W = 78;
export const ROCK_BIG_H = 56;

export const CRATER_W = 120;
export const CRATER_DEPTH = 70;

export const METEOR_LANE_LOW_Y = 600;
export const METEOR_LANE_MID_Y = 560;
export const METEOR_LANE_HIGH_Y = 520;

export const METEOR = {
    W: 56,
    H: 28,
    yLevels: [METEOR_LANE_LOW_Y, METEOR_LANE_MID_Y, METEOR_LANE_HIGH_Y]
};
