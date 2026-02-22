# Ассеты игры Moon Runner

## Откуда игра берёт изображения
`AssetLoader` использует `basePath = /assets/images`.

Это означает, что файлы должны лежать в папке:
`public/assets/images`

## Обязательные файлы и размеры
Положите файлы по этим путям:

### Слои
- `public/assets/images/layers/bg_space.png` (540x960)
- `public/assets/images/layers/bg_stars_overlay.png` (540x960, прозрачный фон)
- `public/assets/images/layers/layer_mountains.png` (1080x45, tileable по X)
- `public/assets/images/layers/layer_moon_surface.png` (1080x210, tileable по X)
- `public/assets/images/layers/layer_moon_foreground.png` (1080x100, tileable по X)

### Игрок
- `public/assets/images/player/player_run.png`
- `public/assets/images/player/player_jump.png`
- `public/assets/images/player/player_land.png`
- `public/assets/images/player/player_damage.png`

### Препятствия
- `public/assets/images/obstacles/obstacle_meteor.png`
- `public/assets/images/obstacles/obstacle_crater.png`
- `public/assets/images/obstacles/obstacle_rock_small.png`
- `public/assets/images/obstacles/obstacle_rock_large.png`

## Важно про старые картинки
Старые изображения можно оставить в проекте.
Игра их **не использует**, если на них нет ссылок в `ASSET_CONFIG`.
