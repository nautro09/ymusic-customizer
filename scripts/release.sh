#!/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")/.."
root="$PWD"
key="${YMC_SIGNING_KEY:-$root/.release/signing.pem}"
version=$(sed -nE "s/^const VERSION = '([0-9.]+)';$/\1/p" shared/update.cjs)
[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
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
/usr/bin/ditto -c -k --norsrc --keepParent "$stage/build/YMusic Customizer.app" "$stage/artifacts/YMusic-Customizer-macOS.zip"
cp -R windows "$stage/windows"
python3 scripts/embed-update-key.py "$stage/windows/scripts/update.cjs"
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
test ! -e "dist/v$version"
mv "$stage/artifacts" "dist/v$version"
printf '%s\n' "$root/dist/v$version"
