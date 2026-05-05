---
name: top-colors-report
description: "Use when the user asks 'who has the most colors', 'show me the top color owners', 'top 100 users by colors', or any variation. Generates a markdown table of the top N users ranked by colors owned, using the raw users.json dump produced by update-stats-data or refresh-member-colors. Output is always a temp file — the site only tracks PIXELCONS members, so this report is for informational use only and is never committed."
argument-hint: "Optional: number of users to include (default 100)"
---

# Top Colors Report

## What This Skill Does

Reads the raw `scripts/users.json` dump (produced by `fetch_users.py --save-raw`) and generates a markdown table of the top N users ranked by number of colors owned. The output is written to a temp file only — it is never saved to the repo.

## Procedure

### Step 1 — Verify Raw Dump Exists

Check that `scripts/users.json` exists:

```powershell
Test-Path 'c:\<repo-root>\scripts\users.json'
```

If `False`, tell the user they need to run the `update-stats-data` skill first to fetch a raw dump, then stop.

If `True`, also report its last-write timestamp so the user knows how fresh the data is:

```powershell
(Get-Item 'c:\<repo-root>\scripts\users.json').LastWriteTime
```

### Step 2 — Generate the Table

Determine N (default 100 unless the user specified a different number). Write and run a Python one-shot script:

```powershell
python -c @'
import json, re, tempfile, os

N = 100  # replace with user-specified N if provided

with open(r'c:\<repo-root>\scripts\users.json', 'r', encoding='utf-8') as f:
    users = json.load(f)

def color_count(u):
    c = u.get('colors', '')
    return len([x for x in c.split(',') if x.strip()]) if c else 0

def strip_html(s):
    if not s:
        return ''
    text = re.sub(r'<[^>]+>', '', s)
    return re.sub(r'\s+', ' ', text).strip()

ranked = sorted(users, key=color_count, reverse=True)[:N]

lines = [
    f'| Rank | Username | Guild | Colors Owned |',
    f'|------|----------|-------|-------------|',
]
for i, u in enumerate(ranked, 1):
    lines.append(f"| {i} | {u.get('name','')} | {strip_html(u.get('guildTag','') or '')} | {color_count(u)} |")

out = '\n'.join(lines)
tmp = os.path.join(tempfile.gettempdir(), f'top{N}_colors.md')
with open(tmp, 'w', encoding='utf-8') as f:
    f.write(out)
print('Saved to: ' + tmp)
print(out)
'@
```

**Note:** PowerShell here-strings (`@'...'@`) don't support inline variable substitution. If you need to vary N, write the script to a temp `.py` file and run it with `python <path>` instead. Example:

```powershell
$n = 100  # change as needed
$script = @"
import json, re, tempfile, os
N = $n
with open(r'c:\<repo-root>\scripts\users.json', 'r', encoding='utf-8') as f:
    users = json.load(f)
def color_count(u):
    c = u.get('colors', '')
    return len([x for x in c.split(',') if x.strip()]) if c else 0
def strip_html(s):
    if not s:
        return ''
    import re
    text = re.sub(r'<[^>]+>', '', s)
    return re.sub(r'\s+', ' ', text).strip()
ranked = sorted(users, key=color_count, reverse=True)[:N]
lines = ['| Rank | Username | Guild | Colors Owned |', '|------|----------|-------|-------------|']
for i, u in enumerate(ranked, 1):
    lines.append(f'| {i} | {u.get(\"name\",\"\")} | {strip_html(u.get(\"guildTag\",\"\") or \"\")} | {color_count(u)} |')
out = '\n'.join(lines)
import tempfile, os
tmp = os.path.join(tempfile.gettempdir(), f'top{N}_colors.md')
with open(tmp, 'w', encoding='utf-8') as f:
    f.write(out)
print('Saved to: ' + tmp)
print(out)
"@
$tmpPy = [System.IO.Path]::GetTempFileName() -replace '\.tmp$','.py'
$script | Out-File -FilePath $tmpPy -Encoding utf8
python $tmpPy
Remove-Item $tmpPy
```

### Step 3 — Report Results

After the script runs:

1. Confirm the temp file path (e.g. `%TEMP%\top100_colors.md`)
2. Print the full markdown table inline in chat
3. Note: **this file is never committed** — the repo only tracks PIXELCONS members in `userdata_pixelcons.json`

## Notes

- Guild tags in the raw data are HTML strings (the site supports custom styled guild badges). This skill strips all HTML tags and collapses whitespace to produce readable plain-text guild names.
- Users with no guild have an empty Guild column.
- Multiple users named "UnNamedUser" or "UnDeadUser" appear in the rankings — these are legitimate accounts with default display names.
- The raw dump at `scripts/users.json` is gitignored and local-only.
