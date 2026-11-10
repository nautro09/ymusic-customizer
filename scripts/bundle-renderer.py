from pathlib import Path
from sys import argv

root = Path(__file__).resolve().parents[1]
plugin = root / "plugins" / "music-plus" / "renderer.js"
source = Path(argv[1]).read_text(encoding="utf-8-sig")
Path(argv[2]).write_text(plugin.read_text(encoding="utf-8") + "\n" + source, encoding="utf-8")
