# Moon Runner (Phaser + Vite)

Этот проект — раннер на Phaser 3 + Vite. Игра не падает без картинок: если PNG не найден, автоматически подставляется плейсхолдер.

## Установка и запуск

1. Установите Node.js 18+.
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Запустите dev-сервер:
   ```bash
   npm run dev
   ```

## Asset checklist

Единый реестр ассетов находится в `src/config/assetRegistry.json`.

> Как обновлять графику: просто положите PNG с тем же именем и путём, затем перезагрузите страницу.

### Обязательные слои фона

- `background.sky` — `540x960` — `public/assets/moonrunner/background/sky.png`
- `background.stars` — `540x960` — `public/assets/moonrunner/background/stars.png`
- `background.mountains` — `1080x45` — `public/assets/moonrunner/background/mountains.png`
- `background.moonSurface` — `1080x210` — `public/assets/moonrunner/background/moon_surface.png`
- `background.moonForeground` — `1080x100` — `public/assets/moonrunner/background/moon_foreground.png`

### Обязательные препятствия

- `obstacle.crater` — `120x70` — `public/assets/moonrunner/obstacles/crater.png`
- `obstacle.rockSmall` — `44x32` — `public/assets/moonrunner/obstacles/rock_small.png`
- `obstacle.rockBig` — `78x56` — `public/assets/moonrunner/obstacles/rock_big.png`
- `obstacle.meteor` — `56x28` — `public/assets/moonrunner/obstacles/meteor.png`

### Игрок

- `player.run` — `64x96` — `public/assets/moonrunner/player/vader_run.png`
- `player.jump` — `64x96` — `public/assets/moonrunner/player/vader_jump.png`
- `player.hurt` — `64x96` — `public/assets/moonrunner/player/vader_hurt.png` (если файла нет, будет плейсхолдер)

### UI (опционально)

- `ui.logo` — `500x108` — `public/assets/moonrunner/ui/logo.png`

## Проверка ассетов во время запуска

При старте `RunnerScene`:
- все изображения грузятся из реестра;
- в консоли печатается таблица loaded/missing с `id` и `path`;
- в режиме разработки показывается overlay с отсутствующими `id` (например, `Missing: player.hurt`).
