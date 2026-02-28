"""
Transform an existing users.json (raw API dump) into the compact
userdata.json consumed by the stats site.

Useful when you already have a users.json from the geopixels-scratch repo
and just want to refresh the stats site data without re-fetching from the API.

Usage:
    python scripts/update_data.py <path-to-users.json>

Example:
    python scripts/update_data.py ../geopixels-scratch/data/userdata/users.json
"""
import json
import re
import sys
import os


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


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/update_data.py <path-to-users.json>")
        sys.exit(1)

    input_path = sys.argv[1]
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        users = json.load(f)

    pixelcons = [u for u in users if is_pixelcons_member(u)]
    compact = [to_compact(u) for u in pixelcons]

    output = "userdata.json"
    with open(output, "w", encoding="utf-8") as f:
        json.dump(compact, f, ensure_ascii=False)

    print(f"Total users in source: {len(users)}")
    print(f"PIXELCONS members:     {len(pixelcons)}")
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
