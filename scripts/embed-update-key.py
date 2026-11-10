from json import dumps
from pathlib import Path
from sys import argv

shared = Path(__file__).resolve().parents[1] / "shared"
source = (shared / "update.cjs").read_text(encoding="utf-8")
key = (shared / "update-public.pem").read_text(encoding="utf-8")
marker = "'__YMC_UPDATE_PUBLIC_KEY__'"
if source.count(marker) != 1:
    raise ValueError("Updater must have exactly one public key slot")
plugin = (shared.parent / "plugins" / "music-plus" / "main.cjs").read_text(encoding="utf-8")
entry = "const { createHash, verify }"
native = 'const ymcMusicPlusNative = (() => {\nconst module = { exports: {} };\n' + plugin + '\nreturn module.exports;\n})();\n\n'
if source.count(entry) != 1:
    raise ValueError("Updater must have one native module insertion point")
source = source.replace(entry, native + entry)
Path(argv[1]).write_text(source.replace(marker, dumps(key)), encoding="utf-8")
