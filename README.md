# 🍛 Food Photo Prompt Bot

Ultra-detailed food photography prompt generator for Zomato/Swiggy listings.

## Deploy on Vercel (3 steps)

### Option A — GitHub + Vercel (Recommended)

1. **GitHub par upload karo**
   ```
   git init
   git add .
   git commit -m "first commit"
   git remote add origin https://github.com/YOUR_USERNAME/food-prompt-bot.git
   git push -u origin main
   ```

2. **Vercel par jaao** → [vercel.com](https://vercel.com)
   - "Add New Project" → GitHub repo select karo
   - Framework: **Vite** (auto-detect hoga)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Click **Deploy**

3. **Done!** Live URL mil jaayegi jaise `food-prompt-bot.vercel.app`

---

### Option B — Vercel CLI (Direct)

```bash
# Install Vercel CLI
npm install -g vercel

# Project folder mein jaao
cd food-prompt-bot

# Dependencies install karo
npm install

# Deploy karo
vercel

# Production deploy
vercel --prod
```

---

## Local Development

```bash
npm install
npm run dev
# Opens at http://localhost:5173
```

## Project Structure

```
food-prompt-bot/
├── index.html          # Entry point
├── vite.config.js      # Vite config
├── vercel.json         # Vercel routing
├── package.json
└── src/
    ├── main.jsx        # React root
    ├── App.jsx         # Main component
    └── index.css       # Global styles
```

## Features
- ⚙ Gemini Gem-style Configure panel
- 📐 Image size auto-added in prompt (145×145, 1184×864, custom)
- 🍽 Platform & cuisine style configurable
- ✎ Custom instructions support
- ⎘ One-click copy
- 📱 Fully responsive
