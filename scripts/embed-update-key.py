from json import dumps
from pathlib import Path
from sys import argv

shared = Path(__file__).resolve().parents[1] / "shared"
source = (shared / "update.cjs").read_text(encoding="utf-8")
key = (shared / "update-public.pem").read_text(encoding="utf-8")
marker = "'__YMC_UPDATE_PUBLIC_KEY__'"
if source.count(marker) != 1:
    raise ValueError("Updater must have exactly one public key slot")
Path(argv[1]).write_text(source.replace(marker, dumps(key)), encoding="utf-8")
