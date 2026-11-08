# Сборка и выпуск

## Собрать установщик macOS из исходников

На Mac с Python 3 и Xcode Command Line Tools выполните из корня репозитория:

```bash
bash macos/macos/build.sh
```

Готовое приложение для Apple Silicon и Intel появится в `macos/build/`. У него локальная подпись. Приватные ключи для такой сборки не нужны.

## Подготовить публичный релиз

Для выпуска нужны:

- **Developer ID Application** с закрытым ключом в связке ключей Mac. [Сертификаты Developer ID](https://developer.apple.com/help/account/certificates/create-developer-id-certificates)
- Профиль для `notarytool` в связке ключей. Создайте его через `xcrun notarytool store-credentials`, следуя подсказкам инструмента. [Нотариальное заверение Apple](https://developer.apple.com/documentation/security/notarizing-macos-software-before-distribution)
- Тот же закрытый ключ проекта, которым подписывались списки обновлений для установленных копий: `.release/signing.pem` или файл из `YMC_SIGNING_KEY`. Этот ключ не связан с сертификатом Apple и не должен попадать в Git.

1. Поднимите версию в обоих редакторах, установщиках, `macos/macos/Info.plist` и `shared/update.cjs`.
2. Выполните из корня:

   ```bash
   YMC_MACOS_SIGN_IDENTITY='Developer ID Application: Имя (TEAMID)' \
   YMC_NOTARY_PROFILE='ymc-notary' \
   bash scripts/release.sh 'Краткий список изменений'
   ```

   Скрипт подпишет универсальный установщик, отправит его на проверку Apple, прикрепит билет и проверит его после распаковки итогового ZIP. Затем создаст и подпишет список обновлений по контрольным суммам готовых архивов. При отказе Apple используйте ID отправки для просмотра причины через `xcrun notarytool log <ID> --keychain-profile ymc-notary`.

3. На Mac проверьте открытие скачанного архива и создание отдельной копии клиента. На Windows проверьте установку и запуск Customizer.
4. Опубликуйте GitHub Release с тегом `v<версия>` и всеми четырьмя файлами из `dist/v<версия>`:

   - `YMusic-Customizer-macOS.zip`
   - `YMusic-Customizer-Windows.zip`
   - `update.json`
   - `update.sig`

Для тестовой сборки без заверения доступен явный режим `YMC_ALLOW_ADHOC_RELEASE=1`. У такой сборки macOS будет локальная подпись. Заверение относится к скачиваемому **установщику**: копия Яндекс Музыки создаётся на Mac пользователя и подписывается локально.
