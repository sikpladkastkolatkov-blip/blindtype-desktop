# Swift Nimble Exact Input System

Тренажёр слепой печати на русском языке для Windows и macOS.

## Скачать
Готовые установщики лежат в разделе **Releases** репозитория (создаются автоматически при каждом изменении кода):
- **Windows**: `Swift-Nimble-Exact-Input-System-Setup-<версия>.exe`
- **macOS (Apple Silicon M1–M4)**: `...-mac-arm64.dmg`
- **macOS (Intel)**: `...-mac-x64.dmg`

### Первый запуск на Mac
Приложение не подписано сертификатом Apple, поэтому macOS предупредит об этом:
1. Откройте `.dmg` и перетащите приложение в «Программы».
2. Откройте его правой кнопкой → «Открыть» → «Открыть». На macOS 15 и новее: «Системные настройки» → «Конфиденциальность и безопасность» → «Всё равно открыть».
3. Если пишет, что файл «повреждён», выполните в Терминале: `xattr -cr "/Applications/Swift Nimble Exact Input System.app"`

## Разработка
```bash
npm install
npm start
```

## Сборка вручную
```bash
npm run build       # Windows (.exe), на Windows
npm run build:mac   # macOS (.dmg), на Mac
```
