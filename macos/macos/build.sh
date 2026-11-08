#!/bin/bash
set -euo pipefail

project=$(cd -- "$(dirname -- "$0")/.." && pwd -P)
destination=${1:-"$project/build"}
mkdir -p -- "$destination"
destination=$(cd -- "$destination" && pwd -P)
staging=$(mktemp -d "$destination/.ymc-build.XXXXXXXX")
trap 'rm -rf -- "$staging"' EXIT
app="$staging/YMusic Customizer.app"
contents="$app/Contents"
mkdir -p "$contents/MacOS" "$contents/Resources" "$staging/cache"
sdk=$(xcrun --sdk macosx --show-sdk-path)

for arch in arm64 x86_64; do
    xcrun swiftc -swift-version 5 -O -sdk "$sdk" -target "$arch-apple-macosx12.0" \
        -module-cache-path "$staging/cache" -module-name YMusicCustomizer \
        "$project"/Sources/*.swift -o "$staging/$arch"
done
xcrun lipo -create "$staging/arm64" "$staging/x86_64" -output "$contents/MacOS/YMusicCustomizer"
cp "$project/macos/Info.plist" "$contents/Info.plist"
cp "$project/macos/"{bootstrap,preload,discord,discord-activity}.cjs "$contents/Resources/"
cp "$project/mod/ymusic-customizer.js" "$project/LICENSE" "$project/licenses/Next-Music-Client-MIT.txt" "$contents/Resources/"
python3 "$project/../scripts/embed-update-key.py" "$contents/Resources/update.cjs"
if [[ -n "${YMC_MACOS_SIGN_IDENTITY:-}" ]]; then
    /usr/bin/codesign --force --sign "$YMC_MACOS_SIGN_IDENTITY" --options runtime --timestamp "$app"
    # Accept a certificate name or fingerprint, but reject other certificate types.
    signature=$(/usr/bin/codesign -dv --verbose=4 "$app" 2>&1)
    if [[ "$signature" != *$'\nAuthority=Developer ID Application:'* ]]; then
        printf '%s\n' 'Для выпуска нужен сертификат Developer ID Application.' >&2
        exit 1
    fi
else
    /usr/bin/codesign --force --sign - --timestamp=none "$app"
fi
/usr/bin/codesign --verify --strict "$app"

target="$destination/${app##*/}"
if [[ -e "$target" || -L "$target" ]]; then
    if [[ -L "$target" || $(/usr/libexec/PlistBuddy -c 'Print CFBundleIdentifier' "$target/Contents/Info.plist" 2>/dev/null) != local.ymusic.customizer.installer ]]; then
        printf 'Путь занят другим приложением: %s\n' "$target" >&2
        exit 1
    fi
    mv -- "$target" "$staging/Previous.app"
fi
if ! mv -- "$app" "$target"; then
    if [[ -d "$staging/Previous.app" ]]; then mv -- "$staging/Previous.app" "$target"; fi
    exit 1
fi
printf '%s\n' "$target"
