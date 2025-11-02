# Free Deployment Guide

This guide will help you deploy the Healthcare Docs PoC for **free** using:
- **Render** (Backend - Flask API) - Free tier available
- **Netlify** or **Vercel** (Frontend - React) - Both offer free tiers

## Prerequisites

1. GitHub account (free)
2. Render account (free at https://render.com)
3. Netlify account (free at https://netlify.com) OR Vercel account (free at https://vercel.com)

## Step 1: Push Code to GitHub

If you haven't already:

```bash
git init
git add .
git commit -m "Initial commit: healthcare-docs-poc ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your actual GitHub details.

## Step 2: Deploy Backend to Render (Free)

### Option A: Using render.yaml (Recommended)

1. Go to https://render.com and sign up/login
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml` in the root
5. Review the configuration and click **"Apply"**
6. Render will automatically:
   - Build your backend
   - Generate a `SECRET_KEY` environment variable
   - Deploy your service

### Option B: Manual Setup

1. Go to https://render.com → **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `healthcare-docs-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn --bind 0.0.0.0:$PORT wsgi:app`
4. Click **"Advanced"** and add Environment Variables:
   - `SECRET_KEY`: Click **"Generate"** or use a strong random string
   - `PYTHON_VERSION`: `3.11.0`
5. Click **"Create Web Service"**
6. Wait for deployment (5-10 minutes)
7. Copy your backend URL (e.g., `https://healthcare-docs-backend.onrender.com`)

**Note**: If deployment fails with import errors, check the Render logs. The `wsgi.py` file automatically handles Python path configuration. If issues persist, you can manually set the service with:
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && gunicorn --bind 0.0.0.0:$PORT wsgi:app`

### Important Notes for Render

- **Free tier limitations**: 
  - Services spin down after 15 minutes of inactivity
  - First request after spin-down takes ~30 seconds
  - 750 hours/month free (enough for 24/7 for one service)
- **Storage**: Files uploaded are stored on Render's disk. For production, consider S3-compatible storage.
- **Database**: SQLite works for small-scale. For production, use Render's PostgreSQL (has a free tier).

## Step 3: Deploy Frontend to Netlify (Free)

### Method 1: Netlify (Recommended for Rewrite Rules)

1. Go to https://app.netlify.com and sign up/login
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. Add Environment Variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your Render backend URL (e.g., `https://healthcare-docs-backend.onrender.com`)
6. Update `frontend/netlify.toml`:
   - Replace `your-backend-url.onrender.com` with your actual Render backend URL
7. Click **"Deploy site"**
8. Wait for build and deployment
9. Your site will be live at `https://your-site-name.netlify.app`

### Method 2: Vercel (Alternative)

1. Go to https://vercel.com and sign up/login
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `frontend` (click **"Edit"**)
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (should auto-detect)
   - **Output Directory**: `dist`
5. Add Environment Variable:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your Render backend URL
6. Click **"Deploy"**
7. Your site will be live at `https://your-project.vercel.app`

### Important: CORS and API Configuration

- The backend already has CORS enabled for all origins (configured for free tier)
- Frontend uses `VITE_API_BASE_URL` environment variable to point to your backend
- If using Netlify with rewrite rules, you can proxy `/api/*` requests (see `netlify.toml`)

## Step 4: Verify Deployment

1. **Test Backend Health**:
   ```
   curl https://your-backend-url.onrender.com/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Test Frontend**:
   - Visit your Netlify/Vercel URL
   - Sign up with a test account
   - Try uploading a PDF document
   - Verify it appears in the list

## Step 5: Environment Variables Summary

### Backend (Render)
- `SECRET_KEY` - Auto-generated or set manually (for JWT signing)
- `PYTHON_VERSION` - `3.11.0` (or your preferred version)

### Frontend (Netlify/Vercel)
- `VITE_API_BASE_URL` - Your Render backend URL (e.g., `https://healthcare-docs-backend.onrender.com`)

## Troubleshooting

### Backend Issues

**Problem**: 502 Bad Gateway or timeouts
- **Solution**: Render free tier spins down after inactivity. First request takes ~30 seconds.

**Problem**: Database errors
- **Solution**: Ensure SQLite has write permissions. For production, migrate to PostgreSQL.

**Problem**: File uploads not persisting
- **Solution**: On Render, files are stored on ephemeral disk. Use external storage (S3) for production.

### Frontend Issues

**Problem**: API calls fail with CORS errors
- **Solution**: Ensure `VITE_API_BASE_URL` is set correctly and backend CORS is enabled.

**Problem**: Build fails
- **Solution**: Check Node version (use 18+). Ensure `npm install` runs successfully locally first.

**Problem**: Can't connect to backend
- **Solution**: Verify backend URL is correct and backend is deployed. Check browser console for errors.

## Alternative Free Hosting Options

### Backend Alternatives:
- **Railway** (https://railway.app) - $5/month free credit
- **Fly.io** (https://fly.io) - Generous free tier
- **PythonAnywhere** (https://pythonanywhere.com) - Free tier with limitations

### Frontend Alternatives:
- **GitHub Pages** - Free but requires separate backend hosting
- **Cloudflare Pages** - Free with excellent performance

## Cost Summary

✅ **Total Cost: $0/month**
- Render backend: Free (750 hours/month)
- Netlify/Vercel frontend: Free (100GB bandwidth/month)
- GitHub: Free (public repos)

## Next Steps for Production

1. **Database**: Migrate from SQLite to PostgreSQL (Render offers free tier)
2. **Storage**: Use S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2)
3. **CDN**: Enable Netlify/Vercel CDN for faster static assets
4. **Monitoring**: Add health checks and error tracking (Sentry, Rollbar)
5. **Domain**: Connect custom domain (available on both platforms)
6. **HTTPS**: Automatically provided by both platforms

## Support

If you encounter issues:
1. Check Render logs: Dashboard → Your Service → Logs
2. Check Netlify/Vercel logs: Dashboard → Your Site → Deploys → Build Logs
3. Verify environment variables are set correctly
4. Test backend API endpoints directly using curl or Postman

