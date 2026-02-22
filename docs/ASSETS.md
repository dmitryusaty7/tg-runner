# Ассеты игры Moon Runner

## Откуда игра берёт изображения
`AssetLoader` использует `basePath = /assets/moonrunner`.

Это означает, что файлы должны лежать в папке:
`public/assets/moonrunner`

## Обязательные файлы и размеры
Положите файлы по этим путям:

### Слои
- `public/assets/moonrunner/background/sky.png` (540x960)
- `public/assets/moonrunner/layers/bg_stars_overlay.png` (540x960, прозрачный фон)
- `public/assets/moonrunner/layers/layer_mountains.png` (1080x155, tileable по X)
- `public/assets/moonrunner/background/moon_surface.png` (1080x210, tileable по X)

> `moon_foreground` больше не используется.

### Игрок
- `public/assets/moonrunner/player/vader_run.png`
- `public/assets/moonrunner/player/vader_jump.png`
- `public/assets/moonrunner/player/player_land.png`
- `public/assets/moonrunner/player/player_damage.png`

### Препятствия
- `public/assets/moonrunner/obstacles/meteor.png`
- `public/assets/moonrunner/obstacles/crater.png`
- `public/assets/moonrunner/obstacles/rock_small.png`
- `public/assets/moonrunner/obstacles/rock_big.png`

## Важно про старые картинки
Старые изображения можно оставить в проекте.
Игра их **не использует**, если на них нет ссылок в `ASSET_CONFIG`.
