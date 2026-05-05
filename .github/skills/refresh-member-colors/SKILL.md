---
name: refresh-member-colors
description: "Use when the user says 'refresh member colors', 'update pixel ownership', 'refresh the stats data for known members', or 'Update the data for this application' when a fast refresh is needed. Re-fetches color ownership data ONLY for the known PIXELCONS members already in userdata.json — takes ~5 seconds instead of 26 minutes. Does NOT discover new members. Starts local server, validates app in browser via Playwright MCP, then provides git commands. Does NOT push automatically."
argument-hint: "No arguments needed"
---

# Refresh Member Colors

## What This Skill Does

Refreshes pixel color ownership data for the **known PIXELCONS members** already in `userdata_pixelcons.json`. Skips the full 13k user sweep entirely — done in ~5 seconds. Use this for routine updates. Use `fetch_users.py` only when discovering newly joined members.

## Endpoint

`POST https://geopixels.net/GetUserProfile` with body `{"targetId": <id>}`  
Returns `colors` (comma-separated decimal values), `level`, `name`, etc.  
The script reads known IDs from the existing `userdata.json` and re-queries only those.

## Procedure

Follow every step in order.

### Step 1 — Run the Refresh Script

```powershell
$repoRoot = git rev-parse --show-toplevel
cd $repoRoot
python scripts/refresh_members.py
```

This will:
- Read the known member IDs from `userdata_pixelcons.json`
- Batch-fetch each profile from the API (20 concurrent, 1s pause between batches)
- Preserve old data for any user whose fetch fails (no data loss)
- Overwrite `userdata_pixelcons.json` with updated colors and levels

After it finishes, confirm the output shows `Members refreshed: <number>/<number>` (or note any failures).

### Step 2 — Start Local Server

```powershell
$repoRoot = git rev-parse --show-toplevel
$job = Start-Job -ScriptBlock { param($r) Set-Location $r; python -m http.server 8000 } -ArgumentList $repoRoot
Start-Sleep -Seconds 2
(Test-NetConnection -ComputerName localhost -Port 8000 -WarningAction SilentlyContinue).TcpTestSucceeded
```

Proceed when output is `True`.

### Step 3 — Validate with Playwright MCP

1. Navigate to `http://localhost:8000` using `mcp_microsoft_pla_browser_navigate`
2. Take a screenshot — save to `.playwright-mcp/refresh-validation.png`
3. Snapshot with `mcp_microsoft_pla_browser_snapshot` and verify:
   - Title is **"Pixelcon Stats"**
   - Nav tabs Top 500 / My Top Partners / Rankings are all present
   - Color chart or user grid is rendered
   - No `div.error` element in DOM
4. Check `mcp_microsoft_pla_browser_console_messages` with `level: "error"` — only acceptable error is `favicon.ico` 404
5. Report **PASS** or **FAIL** with a one-line summary

### Step 4 — Stop Local Server

```powershell
Stop-Job $job -ErrorAction SilentlyContinue
Remove-Job $job -ErrorAction SilentlyContinue
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Step 5 — Provide Git Commands

**Do NOT run these.** Present to the user:

```bash
cd <repo-root>
git add userdata_pixelcons.json
git commit -m "chore: refresh member color ownership data"
git push origin main
```

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`) which copies `userdata_pixelcons.json` to `docs/` and redeploys GitHub Pages.
