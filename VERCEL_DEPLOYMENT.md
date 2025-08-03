# 🚀 Vercel Deployment Guide

## ✅ Current Setup

- **Live URL**: [https://reli-beryl.vercel.app/](https://reli-beryl.vercel.app/)
- **Auto-deploy**: Every push to `main` branch
- **Build time**: ~2 minutes
- **Global CDN**: Worldwide fast access

## 🔧 Configuration

### vercel.json

```json
{
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "framework": "vite",
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

### vite.config.js

```javascript
export default defineConfig({
    base: '/', // Root path for Vercel
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
    },
})
```

## 🚀 Deployment Process

### Automatic (Recommended)

1. **Push to GitHub**: `git push origin main`
2. **Vercel detects**: Auto-build triggered
3. **Build & Deploy**: ~2 minutes
4. **Live**: https://reli-beryl.vercel.app/

### Manual (If needed)

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy
npm run deploy
```

## 📊 Vercel Benefits

- ✅ **Free tier**: 100GB bandwidth
- ✅ **Global CDN**: Fast worldwide
- ✅ **Auto HTTPS**: SSL certificate
- ✅ **Custom domains**: Free
- ✅ **Analytics**: Built-in
- ✅ **Preview deployments**: For PRs

## 🔍 Monitoring

### Vercel Dashboard

- **Deployments**: View build logs
- **Analytics**: Traffic & performance
- **Functions**: Serverless functions (if needed)
- **Domains**: Custom domain management

### Performance

- **Lighthouse Score**: 90+ expected
- **First Load**: <3 seconds
- **Global CDN**: <100ms response time

## 🎯 Custom Domain (Optional)

1. **Vercel Dashboard** → Project Settings
2. **Domains** → Add Domain
3. **DNS Setup**: Point to Vercel
4. **SSL**: Auto-generated

Example: `reli.yourdomain.com`

## 🔧 Environment Variables (If needed)

```bash
# Vercel Dashboard → Settings → Environment Variables
NODE_ENV=production
VITE_API_URL=https://api.example.com
```

## 📈 Analytics & Monitoring

### Built-in Analytics

- Page views
- Unique visitors
- Performance metrics
- Geographic distribution

### Custom Analytics (Optional)

```javascript
// Add to index.html if needed
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
```

---

**Current Status**: ✅ Live and auto-deploying at https://reli-beryl.vercel.app/
