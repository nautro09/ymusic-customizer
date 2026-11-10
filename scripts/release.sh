#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")/.."
root="$PWD"
identity="${YMC_MACOS_SIGN_IDENTITY:-}"
notary_profile="${YMC_NOTARY_PROFILE:-}"
if [[ -z "$identity" || -z "$notary_profile" ]]; then
  if [[ -n "$identity" || -n "$notary_profile" || "${YMC_ALLOW_ADHOC_RELEASE:-0}" != 1 ]]; then
    printf '%s\n' 'Укажите YMC_MACOS_SIGN_IDENTITY и YMC_NOTARY_PROFILE для выпуска macOS.' \
      'Для тестовой сборки без заверения: YMC_ALLOW_ADHOC_RELEASE=1.' >&2
    exit 1
  fi
  printf '%s\n' 'Тестовая сборка: установщик macOS не заверен Apple.' >&2
fi
key="${YMC_SIGNING_KEY:-$root/.release/signing.pem}"
version=$(sed -nE "s/^const VERSION = '([0-9.]+)';$/\1/p" shared/update.cjs)
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
if [[ -e "dist/v$version" || -L "dist/v$version" ]]; then
  printf 'Пакеты v%s уже собраны. Для нового выпуска поднимите версию.\n' "$version" >&2
  exit 1
fi
grep -Fq "const version = '$version';" macos/mod/ymusic-customizer.js
grep -Fq "release = \"$version-mac.1\"" macos/Sources/Installer.swift
grep -Fq "v$version установлен" windows/scripts/install.ps1
cmp macos/mod/ymusic-customizer.js windows/mod/ymusic-customizer.js
cmp macos/macos/discord-activity.cjs windows/scripts/discord-activity.cjs
cmp shared/update-public.pem <(openssl pkey -in "$key" -pubout)
notes="${1:-Обновление YMusic Customizer $version}"
stage=$(mktemp -d "${TMPDIR:-/tmp}/ymc-release.XXXXXXXX")
trap 'rm -rf -- "$stage"' EXIT
mkdir -p "$stage/artifacts"
bash macos/macos/build.sh "$stage/build"
app="$stage/build/YMusic Customizer.app"
if [[ -n "$identity" ]]; then
  /usr/bin/ditto -c -k --keepParent "$app" "$stage/notarize.zip"
  if ! xcrun notarytool submit "$stage/notarize.zip" --keychain-profile "$notary_profile" \
      --wait --output-format json > "$stage/notary-result.json"; then
    cat "$stage/notary-result.json" >&2
    exit 1
  fi
  python3 - "$stage/notary-result.json" <<'PY'
import json
import sys
from pathlib import Path

result = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
if result.get("status") != "Accepted":
    sys.exit(f"Apple не заверила установщик: {result.get('status')} (ID: {result.get('id')})")
print(f"Установщик заверен Apple (ID: {result.get('id')}).")
PY
  xcrun stapler staple "$app"
fi
mac_archive="$stage/artifacts/YMusic-Customizer-macOS.zip"
/usr/bin/ditto -c -k --keepParent "$app" "$mac_archive"
if [[ -n "$identity" ]]; then
  /usr/bin/ditto -x -k "$mac_archive" "$stage/verify"
  packaged_app="$stage/verify/${app##*/}"
  /usr/bin/codesign --verify --strict "$packaged_app"
  xcrun stapler validate "$packaged_app"
fi
cp -R windows "$stage/windows"
python3 scripts/embed-update-key.py "$stage/windows/scripts/update.cjs"
python3 scripts/bundle-renderer.py windows/mod/ymusic-customizer.js "$stage/windows/mod/ymusic-customizer.js"
(
  cd "$stage/windows"
  python3 -m zipfile -c "$stage/artifacts/YMusic-Customizer-Windows.zip" README.md LICENSE docs licenses mod scripts УСТАНОВИТЬ.bat УДАЛИТЬ.bat
)
python3 - "$stage/artifacts" "$version" "$notes" <<'PY'
import hashlib
import json
import sys
from pathlib import Path

root, version, notes = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
files = {"darwin": "macOS", "win32": "Windows"}
manifest = {
    "version": version,
    "notes": notes,
    "sha256": {platform: hashlib.sha256((root / f"YMusic-Customizer-{name}.zip").read_bytes()).hexdigest()
               for platform, name in files.items()},
}
(root / "update.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
PY
openssl dgst -sha256 -sign "$key" -out "$stage/artifacts/update.sig" "$stage/artifacts/update.json"
openssl dgst -sha256 -verify shared/update-public.pem -signature "$stage/artifacts/update.sig" "$stage/artifacts/update.json"
for archive in "$stage/artifacts/"*.zip; do python3 -m zipfile -t "$archive"; done
mkdir -p dist
[[ ! -e "dist/v$version" && ! -L "dist/v$version" ]]
mv "$stage/artifacts" "dist/v$version"
printf '%s\n' "$root/dist/v$version"
