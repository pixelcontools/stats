"""
Transform a raw API dump (users.json) into the compact userdata.json
consumed by the stats site.

Useful when you already have a raw dump and want to reprocess PIXELCONS
membership without re-fetching from the API.

Generate the raw dump first with:
    python scripts/fetch_users.py --save-raw

Then run this script (defaults to scripts/users.json):
    python scripts/update_data.py
    python scripts/update_data.py <path-to-users.json>   # custom path
"""
import json
import re
import sys
import os
from datetime import datetime, timezone


def is_pixelcons_member(user: dict) -> bool:
    """Check if a user belongs to the PIXELCONS guild.

    Strips HTML from guildTag and looks for 'PIXELCONS' in the plain text,
    so it keeps working even if the tag styling/spans change.
    """
    tag = user.get("guildTag") or ""
    plain = re.sub(r"<[^>]+>", "", tag).strip()
    return "PIXELCONS" in plain.upper()


def to_compact(user: dict) -> dict:
    """Convert a raw user profile to compact format (i=id, n=name, l=level, c=colors)."""
    return {
        "i": user["id"],
        "n": user.get("name", ""),
        "l": user.get("level", 0),
        "c": user.get("colors", ""),
    }


DEFAULT_RAW = "scripts/users.json"


def main():
    input_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_RAW

    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        if input_path == DEFAULT_RAW:
            print("Run 'python scripts/fetch_users.py --save-raw' to generate it.")
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        users = json.load(f)

    pixelcons = [u for u in users if is_pixelcons_member(u)]
    compact = [to_compact(u) for u in pixelcons]

    output = "userdata.json"
    output_data = {
        "lastUpdated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "members": compact,
    }
    with open(output, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False)

    print(f"Total users in source: {len(users)}")
    print(f"PIXELCONS members:     {len(pixelcons)}")
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
