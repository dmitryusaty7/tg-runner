# Отладка ошибки Vite import-analysis на Windows

Если Vite падает с ошибкой `Failed to parse source for import analysis`, выполните:

1. Очистите кэш Vite:

```bash
npm run clean:vite-cache
```

Если скрипта нет, удалите вручную папку `node_modules/.vite`.

2. Запустите dev-сервер заново:

```bash
npm run dev
```

## Быстрая проверка RunnerScene

Если нужна диагностика, убедитесь, что файл `src/game/scenes/RunnerScene.js`:
- начинается сразу с `import`;
- сохранён в UTF-8 без BOM;
- не содержит не-JS текста (markdown, блоки ``` и т.д.).
