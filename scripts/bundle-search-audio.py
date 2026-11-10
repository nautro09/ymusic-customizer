"""Embed build-supplied audio into an already staged renderer."""

import base64
import json
import sys
from pathlib import Path


def embed(renderer: Path, source: Path) -> None:
    assets = {}
    if not source.is_dir():
        sys.exit("Audio source must be a directory.")
    for name in ("67", "katya", "kirill"):
        candidates = [source / f"{name}.{ext}" for ext in ("wav", "mp3")]
        files = [file for file in candidates if file.is_file()]
        if not files:
            continue
        if len(files) != 1 or not 0 < files[0].stat().st_size <= 5 * 1024 * 1024:
            sys.exit(f"Expected one audio file of at most 5 MiB for {name}.")
        file = files[0]
        data = file.read_bytes()
        if file.suffix == ".wav":
            if data[:4] != b"RIFF" or data[8:12] != b"WAVE":
                sys.exit(f"Invalid WAV: {file.name}")
            media_type = "audio/wav"
        else:
            if not (data.startswith(b"ID3") or len(data) > 2 and data[0] == 0xFF and data[1] & 0xE0 == 0xE0):
                sys.exit(f"Invalid MP3: {file.name}")
            media_type = "audio/mpeg"
        assets[name] = {"type": media_type, "data": base64.b64encode(data).decode("ascii")}
    if not assets:
        sys.exit("No supported audio files found.")
    marker = "/* YMC_SEARCH_AUDIO */ {}"
    original = renderer.read_text(encoding="utf-8")
    if original.count(marker) != 1:
        sys.exit("Unexpected renderer format.")
    renderer.write_text(original.replace(marker, json.dumps(assets, separators=(",", ":"))), encoding="utf-8")


if __name__ == "__main__":
    embed(Path(sys.argv[1]), Path(sys.argv[2]))
