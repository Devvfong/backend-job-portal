#!/usr/bin/env python3
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
env_path = root / ".env"
ensure = Path(__file__).resolve().parent / "ensure-direct-url.py"
if ensure.exists():
    import subprocess
    subprocess.run([sys.executable, str(ensure), str(env_path)], check=False)

text = env_path.read_text(encoding="utf-8")
m = re.search(r'^DIRECT_URL="([^"]+)"', text, re.M)
if not m:
    sys.exit("DIRECT_URL not in .env")
sys.stdout.write(m.group(1))