import base64
import json
import subprocess
from pathlib import Path
from sys import argv

root = Path(__file__).resolve().parents[1]
payload = (root / "plugins" / "music-plus" / "manifest.json").read_bytes()
public_key = (root / "shared" / "update-public.pem").read_bytes()
key = argv[1]
if subprocess.check_output(["openssl", "pkey", "-in", key, "-pubout"]) != public_key:
    raise SystemExit("The signing key does not match the repository public key.")
signature = subprocess.check_output(["openssl", "dgst", "-sha256", "-sign", key], input=payload)
asset = {name: base64.b64encode(data).decode("ascii") for name, data in [("payload", payload), ("signature", signature)]}
Path(argv[2]).write_text(json.dumps(asset) + "\n", encoding="utf-8")
