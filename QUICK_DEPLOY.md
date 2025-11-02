# Quick Deploy Checklist

Follow these steps to deploy your app for free in ~15 minutes:

## ✅ Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push
```

## ✅ Step 2: Deploy Backend (Render)

1. Go to https://render.com → Sign up/Login
2. Click **"New"** → **"Blueprint"** (or **"Web Service"** for manual)
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` - just click **"Apply"**
5. Wait ~5-10 minutes for deployment
6. **Copy your backend URL** (e.g., `https://healthcare-docs-backend.onrender.com`)

## ✅ Step 3: Deploy Frontend (Netlify)

1. Go to https://app.netlify.com → Sign up/Login
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your GitHub repo
4. Settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
5. **Environment Variables** → Add:
   - Key: `VITE_API_BASE_URL`
   - Value: Your Render backend URL (from Step 2)
6. Update `frontend/netlify.toml`:
   - Replace `your-backend-url.onrender.com` with your actual backend URL
7. Click **"Deploy site"**
8. Wait for deployment (~2-3 minutes)

## ✅ Step 4: Test

1. Visit your Netlify URL
2. Test login with: `admin@gmail.com` / `admin`
3. Upload a test PDF
4. Verify it works! 🎉

## 🔧 If Something Breaks

- **Backend not responding?** Render free tier spins down after 15 min idle. First request takes ~30 seconds.
- **CORS errors?** Check `VITE_API_BASE_URL` is set correctly.
- **Build fails?** Check logs in Netlify/Render dashboard.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting.

