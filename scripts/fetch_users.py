"""
Fetch user profiles from GeoPixels API and produce userdata_pixelcons.json for the stats site.

Fetches all users (IDs 1–15000), filters for PIXELCONS guild members,
and writes the compact userdata_pixelcons.json used by the site.

Usage:
    python scripts/fetch_users.py            # fetch + filter only
    python scripts/fetch_users.py --save-raw # also save raw dump to scripts/users.json

The raw dump (scripts/users.json) is gitignored. Use it with update_data.py to
reprocess PIXELCONS membership without re-fetching from the API.

Requires: requests  (pip install requests)
"""
import argparse
import re
import requests
import json
import time
import concurrent.futures
from datetime import datetime, timezone
from typing import Optional, Dict

API_URL = "https://geopixels.net/GetUserProfile"
TOTAL_USERS = 15000
BATCH_SIZE = 50  # Concurrent requests per batch
PAUSE_SECONDS = 6  # Pause between batches to be API-courteous

session = requests.Session()
session.headers.update({"Content-Type": "application/json"})


def is_pixelcons_member(user: Dict) -> bool:
    """Check if a user belongs to the PIXELCONS guild.

    Strips HTML from guildTag and looks for 'PIXELCONS' in the plain text,
    so it keeps working even if the tag styling/spans change.
    """
    tag = user.get("guildTag") or ""
    plain = re.sub(r"<[^>]+>", "", tag).strip()
    return "PIXELCONS" in plain.upper()


def fetch_user(user_id: int) -> Optional[Dict]:
    """Fetch a single user profile from the API."""
    try:
        response = session.post(API_URL, json={"targetId": user_id}, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception:
        return None


def to_compact(user: Dict) -> Dict:
    """Convert a raw user profile to compact format (i=id, n=name, l=level, c=colors)."""
    return {
        "i": user["id"],
        "n": user.get("name", ""),
        "l": user.get("level", 0),
        "c": user.get("colors", ""),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--save-raw",
        action="store_true",
        help="Save the full raw API dump to scripts/users.json before filtering",
    )
    args = parser.parse_args()

    all_users = []
    start_time = time.time()

    print(f"Fetching {TOTAL_USERS} user profiles...")
    print(f"Batch size: {BATCH_SIZE}, Pause: {PAUSE_SECONDS}s between batches")
    print("-" * 60)

    for batch_start in range(1, TOTAL_USERS + 1, BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE - 1, TOTAL_USERS)
        user_ids = list(range(batch_start, batch_end + 1))

        with concurrent.futures.ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
            results = list(executor.map(fetch_user, user_ids))

        for result in results:
            if result:
                all_users.append(result)

        elapsed = time.time() - start_time
        progress = batch_end / TOTAL_USERS * 100
        print(
            f"Progress: {batch_end:5d}/{TOTAL_USERS} ({progress:5.1f}%) | "
            f"Valid: {len(all_users):5d} | Elapsed: {elapsed:.0f}s"
        )

        if batch_end < TOTAL_USERS:
            time.sleep(PAUSE_SECONDS)

    # Optionally save the full raw dump before filtering
    if args.save_raw:
        raw_output = "scripts/users.json"
        with open(raw_output, "w", encoding="utf-8") as f:
            json.dump(all_users, f, ensure_ascii=False)
        print(f"Raw dump saved to {raw_output} ({len(all_users)} users)")

    # Filter to PIXELCONS members only
    pixelcons = [u for u in all_users if is_pixelcons_member(u)]
    compact = [to_compact(u) for u in pixelcons]

    # Write userdata_pixelcons.json at repo root (deploy workflow copies it to docs/)
    output = "userdata_pixelcons.json"
    output_data = {
        "lastUpdated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "members": compact,
    }
    with open(output, "w", encoding="utf-8") as f:
        json.dump(output_data, f, ensure_ascii=False)

    total_time = time.time() - start_time
    print("-" * 60)
    print(f"Total users fetched: {len(all_users)}")
    print(f"PIXELCONS members:   {len(pixelcons)}")
    print(f"Wrote {output} (PIXELCONS members only — {len(compact)} users)")
    print(f"Total time: {total_time:.1f}s ({total_time / 60:.1f} minutes)")


if __name__ == "__main__":
    main()
