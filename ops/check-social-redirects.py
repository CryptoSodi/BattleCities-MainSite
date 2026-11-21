"""Check the live social redirects. Pass a Cloudflare IP to test before DNS switches."""
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import subprocess
import sys

items = json.loads(Path(__file__).with_name("social-redirects.json").read_text(encoding="utf-8"))
resolve = ["--resolve", "battlecities.com:443:" + sys.argv[1]] if len(sys.argv) > 1 else []
agents = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          "Mozilla/5.0 (Linux; Android 14; Mobile)"]


def check(case):
    item, suffix, query, agent = case
    url = "https://battlecities.com" + item["path"] + suffix + query
    cmd = ["curl.exe", "-sS", "--max-time", "25", "-o", "NUL", "-w",
           "%{http_code}\n%{redirect_url}\n", "-A", agent, *resolve, url]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    lines = result.stdout.splitlines()
    code = lines[0] if lines else ""
    destination = lines[1] if len(lines) > 1 else ""
    expected = item["destination"] + query
    if code != "301" or destination != expected:
        raise AssertionError(f"{url}: got {code} {destination}; expected 301 {expected}")
    return url


cases = [(item, suffix, query, agent) for item in items for suffix in ("", "/")
         for query in ("", "?source=test&campaign=mobile") for agent in agents]
with ThreadPoolExecutor(max_workers=8) as pool:
    checked = list(pool.map(check, cases))
print(f"Passed {len(checked)} redirect checks (both slash forms, query strings and browser agents).")
