"""
Refresh color ownership data for known PIXELCONS members.

Reads the existing userdata.json to get the list of known member IDs,
re-fetches each profile from the GeoPixels API, and writes an updated
userdata.json with the latest colors and level for each member.

This is much faster than fetch_users.py (104 requests vs 13,000).
Use this for routine data refreshes. Use fetch_users.py only when you
need to discover newly joined PIXELCONS members.

Usage:
    python scripts/refresh_members.py

Requires: requests  (pip install requests)
"""
import json
import requests
import concurrent.futures
import time
from typing import Optional, Dict

API_URL = "https://geopixels.net/GetUserProfile"
BATCH_SIZE = 20
PAUSE_SECONDS = 1

session = requests.Session()
session.headers.update({"Content-Type": "application/json"})


def fetch_user(user_id: int) -> Optional[Dict]:
    try:
        response = session.post(API_URL, json={"targetId": user_id}, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"  Warning: failed to fetch user {user_id}: {e}")
        return None


def main():
    with open("userdata.json", "r", encoding="utf-8") as f:
        existing = json.load(f)

    if not existing:
        print("Error: userdata.json is empty or invalid.")
        return

    # Validate this is compact format (has 'i' key, not raw API format)
    if "id" in existing[0]:
        print("Error: userdata.json appears to be raw API format, not compact format.")
        print("This script expects the compact userdata.json produced by this repo.")
        return

    member_ids = [u["i"] for u in existing]
    # Keep a dict of existing data as fallback if a fetch fails
    existing_by_id = {u["i"]: u for u in existing}

    print(f"Refreshing {len(member_ids)} known PIXELCONS members...")
    print(f"Batch size: {BATCH_SIZE}, Pause: {PAUSE_SECONDS}s between batches")
    print("-" * 60)

    start_time = time.time()
    updated = []
    failed = []

    for batch_start in range(0, len(member_ids), BATCH_SIZE):
        batch = member_ids[batch_start : batch_start + BATCH_SIZE]

        with concurrent.futures.ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
            results = list(executor.map(fetch_user, batch))

        for user_id, result in zip(batch, results):
            if result:
                updated.append({
                    "i": result["id"],
                    "n": result.get("name", existing_by_id[user_id]["n"]),
                    "l": result.get("level", existing_by_id[user_id]["l"]),
                    "c": result.get("colors", existing_by_id[user_id]["c"]),
                })
            else:
                # Keep previous data for this user rather than losing them
                updated.append(existing_by_id[user_id])
                failed.append(user_id)

        elapsed = time.time() - start_time
        done = min(batch_start + BATCH_SIZE, len(member_ids))
        print(f"  {done:3d}/{len(member_ids)} refreshed | Elapsed: {elapsed:.1f}s")

        if batch_start + BATCH_SIZE < len(member_ids):
            time.sleep(PAUSE_SECONDS)

    with open("userdata.json", "w", encoding="utf-8") as f:
        json.dump(updated, f, ensure_ascii=False)

    total_time = time.time() - start_time
    print("-" * 60)
    print(f"Done in {total_time:.1f}s")
    print(f"Members refreshed: {len(updated) - len(failed)}/{len(member_ids)}")
    if failed:
        print(f"Failed (kept old data): {failed}")
    print(f"Wrote userdata.json")


if __name__ == "__main__":
    main()
