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

### 1. Add Repository Secret

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `USER_DATA`
5. Value: Paste the entire contents of your `userdata.json` file
6. Click **Add secret**

### 2. Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The site will automatically deploy when you push to the `main` branch

### 3. Deploy

Simply push your code to the `main` branch:

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

The GitHub Actions workflow will automatically:
- Inject your secret data at build time
- Deploy the site to GitHub Pages
- Make it available at `https://<your-username>.github.io/pixelcon-stats/`

## Local Development

To test locally before deploying:

1. Make sure `userdata.json` is in the root directory (it's gitignored, so it won't be committed)
2. Serve the files with a local server:
   ```bash
   python -m http.server 8000
   # or
   npx serve .
   ```
3. Open `http://localhost:8000` in your browser

## Security

- The raw `userdata.json` file is **never** committed to the repository
- Data is stored as a GitHub secret and injected only at build time
- The deployed site will have the data, but your source code history remains clean

## Technologies Used

- **Chart.js**: For the color ownership line graph
- **Vanilla JavaScript**: No framework dependencies
- **GitHub Actions**: Automated deployment with secret injection
- **GitHub Pages**: Free static hosting

## File Structure

```
pixelcon-stats/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow
├── index.html                  # Main HTML structure
├── styles.css                  # Styling
├── app.js                      # Application logic
├── .gitignore                  # Excludes userdata.json
└── README.md                   # This file
```

## License

MIT
