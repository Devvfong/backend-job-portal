#!/usr/bin/env python3
"""Ensure .env has DIRECT_URL derived from DATABASE_URL (Neon pooler -> direct)."""
import re
import sys
from pathlib import Path

env_path = Path(sys.argv[1] if len(sys.argv) > 1 else ".env")
text = env_path.read_text(encoding="utf-8")

if re.search(r'^DIRECT_URL=', text, re.M):
    print("DIRECT_URL already set")
    sys.exit(0)

m = re.search(r'^DATABASE_URL="([^"]+)"', text, re.M)
if not m:
    print("DATABASE_URL not found in .env", file=sys.stderr)
    sys.exit(1)

direct = m.group(1).replace("-pooler", "")
direct = re.sub(r"[?&]pgbouncer=true", "", direct)
direct = direct.replace("?&", "?")

env_path.write_text(text.rstrip() + f'\nDIRECT_URL="{direct}"\n', encoding="utf-8")
print("DIRECT_URL added to .env")