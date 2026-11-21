"""Install the configured Cloudflare rules without replacing existing rules."""
import json
from pathlib import Path
import subprocess

ZONE = "battlecities.com"
PROFILE = "battlecities-cherry"
RULESET = "dbb50cb06c3b4a17b13465063591c6f4"


def cf(*args):
    cmd = ["rtk", "proxy", "cf", *args, "--zone", ZONE, "--profile", PROFILE]
    result = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if result.returncode:
        raise RuntimeError(result.stderr or result.stdout)
    return json.loads(result.stdout) if result.stdout.strip() else None


def rule_for(item):
    path = item["path"]
    return {
        "ref": "battlecities_social_" + path[1:],
        "description": "Battle Cities social: " + path,
        "expression": '(http.host eq "battlecities.com" and http.request.uri.path in {"'
                      + path + '" "' + path + '/"})',
        "action": "redirect",
        "action_parameters": {"from_value": {
            "status_code": 301,
            "target_url": {"value": item["destination"]},
            "preserve_query_string": True,
        }},
        "enabled": True,
    }


def main():
    items = json.loads(Path(__file__).with_name("social-redirects.json").read_text(encoding="utf-8"))
    existing = cf("rulesets", "get", RULESET)["rules"]
    existing_by_ref = {rule["ref"]: rule for rule in existing}
    pending = []
    for item in items:
        rule = rule_for(item)
        if rule["ref"] in existing_by_ref:
            current = existing_by_ref[rule["ref"]]
            if any(current.get(key) != rule[key] for key in ("expression", "action", "action_parameters", "enabled")):
                raise RuntimeError("Existing managed rule differs: " + rule["ref"])
            print("Already installed:", item["path"], flush=True)
        else:
            pending.append(rule)
    if len(existing) + len(pending) > 10:
        raise RuntimeError("These rules would exceed the zone's free-plan rule limit.")
    for rule in pending:
        body = json.dumps(rule, separators=(",", ":"))
        cf("rulesets", "rules", "create", RULESET, "--validate-only", "true", "--body", body)
    for rule in pending:
        body = json.dumps(rule, separators=(",", ":"))
        cf("rulesets", "rules", "create", RULESET, "--body", body)
        print("Installed:", rule["ref"], flush=True)


if __name__ == "__main__":
    main()
