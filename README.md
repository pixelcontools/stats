# Pixelcon Stats

An interactive web application to visualize and analyze Pixelcon color ownership data.

## Features

### 📊 Top 500 Colors
- **Graph View**: Line chart showing the top 500 most common colors by ownership count
- **User View**: Interactive grid displaying which users own which colors

### 🔗 Color Sharing
- Compare your colors with other users
- See who shares the most colors with you
- View who shares the least colors (most different collections)

### 🏆 Rankings
- **Most Colors Owned**: Top users by total color count
- **Most Shared Colors**: Users with the highest cumulative shared colors
- **Most Unique Colors**: Users with the most colors owned by no one else

### 👤 User Details
- Click any username to see their profile
- View level, total colors, and guild tag

## Setup Instructions

### 1. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The site will automatically deploy when you push to the `main` branch

### 2. Deploy

Simply push your code to the `main` branch:

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

The GitHub Actions workflow will automatically:
- Copy userdata.json to the docs folder
- Deploy the site to GitHub Pages
- Make it available at `https://<your-username>.github.io/stats/`

## Local Development

To test locally:

1. Serve the files with a local server:
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```
2. Open `http://localhost:8000` in your browser

## File Structure

```
stats/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── docs/                       # Deployed files
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── index.html                  # Main HTML structure
├── styles.css                  # Styling
├── app.js                      # Application logic
├── userdata.json              # User data (committed to repo)
└── README.md                   # This file
```

## License

MIT
