# Архитектура macOS-версии

`Sources/` содержит установщик AppKit и редактор индекса ASAR на Swift. Установщик копирует имеющийся клиент, добавляет скрипты в `app.asar`, обновляет SHA-256 заголовка ASAR и ставит локальную подпись на копию. Внутреннее имя пакета сохраняется для запуска процессов Electron Helper. Замена готового приложения атомарна. Предыдущая рабочая копия хранится рядом в скрытой папке установщика. [Формат ASAR](https://github.com/electron/asar#format) · [Проверка ASAR в Electron](https://www.electronjs.org/docs/latest/tutorial/asar-integrity) · [Подпись вложенного кода macOS](https://developer.apple.com/library/archive/technotes/tn2206/)

`macos/bootstrap.cjs` задаёт отдельный профиль и отключает автообновление копии. Затем загружает штатную точку входа Яндекс Музыки. `macos/preload.cjs` запускает редактор в основном контексте только верхней страницы `music-application://desktop`. Для настроек Discord preload предоставляет три ограниченных вызова IPC. Основной процесс проверяет источник запроса и значения полей. [Изоляция контекста Electron](https://www.electronjs.org/docs/latest/tutorial/context-isolation)

`mod/ymusic-customizer.js` содержит редактор, темы и логику расширенного плеера. Форматы JSON, `.ymctheme` и хранилища сохранены из Windows-версии. Ключ `ymc:theme:v2` имеет приоритет над `ymc:theme:v1`. Медиа и пакеты тем используют IndexedDB. Выбор элементов штатного плеера зависит от DOM клиента. Эквалайзер читает сигнал отдельной веткой штатного аудиографа или через `captureStream()`. При смене трека или пустом потоке анализатор переподключается.

`macos/discord.cjs` общается с настольным Discord через Unix-сокеты `discord-ipc-*`. При изменении трека или паузе отправляется `SET_ACTIVITY`. После перезапуска Discord загрузчик переподключается. `macos/discord-activity.cjs` проверяет данные трека и формирует карточку. Та же версия этого файла используется установщиком Windows. [Discord RPC](https://docs.discord.com/developers/topics/rpc#rpc-over-ipc)

## Локальные проверки

```sh
bash macos/build.sh
node --check mod/ymusic-customizer.js
node tests/theme-smoke.test.js
npm install --no-save playwright
npx playwright install chromium
node tests/browser-smoke.test.js
node tests/macos-smoke.test.cjs "$HOME/Applications/Яндекс Музыка с Customizer.app"
```

`demo.html` моделирует интерфейс клиента и содержит синтетический аудиосигнал. `YMC_CHROMIUM` позволяет запустить браузерный тест с установленным Chromium. Тест macOS запускает копию с временным профилем и имитацией Discord. `YMusicCustomizer.diagnostics()` показывает обнаружение плеера, состояние визуализатора и тип источника сигнала.
