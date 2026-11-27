"""Reproduce the Windows payload for pre-publication checks on a read-only runner."""
import hashlib
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

root = Path(__file__).resolve().parents[1]


def digest(files):
    entries = {name: hashlib.sha256(data).hexdigest() for name, data in files.items()}
    return hashlib.sha256(json.dumps(entries, sort_keys=True).encode()).hexdigest()


def contents(archive):
    with zipfile.ZipFile(archive) as package:
        return {name: package.read(name) for name in package.namelist() if not name.endswith("/")}


def stage(previous, destination, expected):
    def git(*args):
        return subprocess.check_output(["git", "-C", str(root), *args])

    files = {}
    for raw in git("ls-tree", "-rz", "--name-only", "HEAD", "windows").split(b"\0"):
        if not raw:
            continue
        path = raw.decode()
        name = path.removeprefix("windows/")
        if not (name.startswith(("mod/", "docs/", "scripts/", "licenses/")) or
                name in ("README.md", "LICENSE") or name.endswith(".bat")):
            continue
        data = git("show", "HEAD:" + path)
        if name.endswith((".ps1", ".bat")):
            data = data.replace(b"\r\n", b"\n").replace(b"\n", b"\r\n")
        files[name] = data
    # Preserve the prior release's optional audio, exactly as in the release build.
    renderer = "mod/ymusic-customizer.js"
    audio = re.search(rb"const BUNDLED_SEARCH_AUDIO = (\{.*?\});", contents(previous)[renderer])
    if not audio or not isinstance(json.loads(audio[1]), dict):
        raise ValueError("Invalid bundled audio")
    files[renderer] = files[renderer].replace(b"/* YMC_SEARCH_AUDIO */ {}", audio[1])
    updater = git("show", "HEAD:shared/update.cjs")
    key = git("show", "HEAD:shared/update-public.pem").decode()
    files["scripts/update.cjs"] = updater.replace(b"'__YMC_UPDATE_PUBLIC_KEY__'", json.dumps(key).encode())
    actual = digest(files)
    if actual != expected:
        raise ValueError(f"Payload differs from the signed candidate: {actual}")
    for name, data in files.items():
        path = Path(destination) / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    print(f"Matched all {len(files)} file paths and hashes from the signed candidate.")


if len(sys.argv) == 2:
    print(digest(contents(sys.argv[1])))
else:
    stage(*sys.argv[1:])
