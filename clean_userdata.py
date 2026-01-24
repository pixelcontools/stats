import json

# Load the original userdata.json
with open('userdata.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Keep only the fields used in the app
cleaned_data = []
for user in data:
    cleaned_user = {
        'id': user['id'],
        'name': user['name'],
        'level': user['level'],
        'guildTag': user['guildTag'],
        'colors': user['colors']
    }
    cleaned_data.append(cleaned_user)

# Save the cleaned data
with open('userdata.json', 'w', encoding='utf-8') as f:
    json.dump(cleaned_data, f, ensure_ascii=False, separators=(',', ':'))

print(f"Cleaned userdata.json successfully!")
print(f"Reduced from {len(data)} users to {len(cleaned_data)} users")
print(f"Removed unused fields: experience, discordUser, xUser, redditUser, moderator, isGuildOwner, punishmentState, profileLevel, bannersLevel")
