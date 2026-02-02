# Deployment Guide - Podcast Generator

## Critical: Backend vs Frontend Deployment

**Your application has TWO parts:**
1. **Backend (Node.js + Express)** - Handles authentication, database, API endpoints
2. **Frontend (HTML/CSS/JS)** - The user interface

**⚠️ IMPORTANT:** GitHub Pages and Netlify (standard) **CANNOT** run Node.js backends!

---

## ✅ RECOMMENDED DEPLOYMENT SETUP

### Backend Deployment (Choose ONE):

#### Option 1: Railway (Easiest, Free Tier Available)
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `podcast-generator` repository
5. Railway will auto-detect `railway.json` and deploy
6. Add environment variables in Railway dashboard:
   ```
   MONGODB_URI=your_mongodb_connection_string
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   ```
7. Get your Railway URL (e.g., `https://pod-app-zai-production.up.railway.app`)
8. **IMPORTANT:** Add this URL to Google OAuth Console as an authorized redirect URI:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to APIs & Services → Credentials
   - Edit your OAuth 2.0 Client
   - Add to "Authorized redirect URIs":
     ```
     https://your-railway-app.up.railway.app/api/auth/google/callback
     ```

#### Option 2: Render (Free Tier, No Credit Card)
1. Go to [render.com](https://render.com)
2. Sign up and connect GitHub
3. Click "New +" → "Web Service"
4. Select your repository
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
6. Add environment variables (same as Railway above)
7. Get your Render URL and update Google OAuth

#### Option 3: Heroku (Classic, Paid)
1. Install Heroku CLI
2. `heroku create your-app-name`
3. `heroku config:set MONGODB_URI=...` (add all env vars)
4. `git push heroku main`
5. Update Google OAuth with Heroku URL

---

### Frontend Deployment:

#### Option 1: Deploy with Backend (Recommended)
- Keep frontend files in the same repo
- Your backend serves the static files automatically
- Access at: `https://your-backend-url.com`

#### Option 2: Separate Frontend Deployment
If you want to host the frontend separately:

1. **Update `js/env.js`** with your backend URL:
   ```javascript
   const DEPLOYED_BACKEND_URL = 'https://your-railway-app.up.railway.app';
   ```

2. Deploy frontend to:
   - **GitHub Pages:** Settings → Pages → Deploy from main branch
   - **Netlify:** Connect repo → Deploy
   - **Vercel:** Import project → Deploy

---

## 🔧 Configuration Steps

### Step 1: Update Google OAuth Callback URL

In your `.env` file (or Railway/Render environment variables):
```env
# For Railway deployment:
GOOGLE_CALLBACK_URL=https://your-app.up.railway.app/api/auth/google/callback

# For Render deployment:
GOOGLE_CALLBACK_URL=https://your-app.onrender.com/api/auth/google/callback
```

### Step 2: Update Frontend Configuration

Edit `js/env.js` (line 16):
```javascript
const DEPLOYED_BACKEND_URL = 'https://your-actual-backend-url.com';
```

### Step 3: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://your-frontend-url.com
   https://your-backend-url.com
   ```
5. Add to **Authorized redirect URIs**:
   ```
   https://your-backend-url.com/api/auth/google/callback
   ```

---

## 🚀 Quick Deployment (Railway - Recommended)

```bash
# 1. Make sure all changes are committed
git add .
git commit -m "Configure for deployment"
git push origin main

# 2. Deploy to Railway (automated)
# - Go to railway.app
# - Connect GitHub repo
# - Railway auto-deploys on push

# 3. Set environment variables in Railway dashboard

# 4. Update js/env.js with Railway URL

# 5. Push again
git add js/env.js
git commit -m "Update backend URL"
git push origin main
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend is running (check Railway/Render logs)
- [ ] MongoDB connection successful
- [ ] Environment variables set correctly
- [ ] Google OAuth callback URL updated in Google Console
- [ ] Frontend loads correctly
- [ ] Can click "Continue with Google" button
- [ ] Redirects to Google login page
- [ ] After Google auth, redirects back to dashboard
- [ ] Dashboard loads with user data

---

## 🐛 Troubleshooting

### Error: "404 Not Found" on `/api/auth/google`

**Problem:** Backend not deployed or frontend pointing to wrong URL

**Solution:**
1. Deploy backend to Railway/Render
2. Update `js/env.js` with correct backend URL
3. Push changes

### Error: "redirect_uri_mismatch"

**Problem:** Google OAuth callback URL not configured

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Add your deployment URL to authorized redirect URIs
3. Format: `https://your-backend-url.com/api/auth/google/callback`

### Error: "CORS policy"

**Problem:** Frontend and backend on different domains without CORS configured

**Solution:** Backend already has CORS enabled in `server.js`, but verify:
```javascript
app.use(cors({
  origin: ['https://your-frontend-url.com'],
  credentials: true
}));
```

---

## 📝 Current Configuration

**Your current setup (as of code):**
- ✅ Backend URL detection: Automatic via `js/env.js`
- ✅ Environment-based API calls: Uses ENV.getApiUrl()
- ✅ OAuth redirect: Dynamic based on backend URL
- ⚠️ **ACTION REQUIRED:** Update `js/env.js` line 16 with your deployed backend URL

---

## 💡 Tips

1. **Always deploy backend first**, then configure frontend
2. **Test locally** before deploying (backend on localhost:3000)
3. **Check logs** in Railway/Render for errors
4. **Update Google OAuth** every time you change deployment URL
5. **Use environment variables** - never commit secrets to Git

---

## 📞 Support

If you encounter issues:
1. Check Railway/Render logs for backend errors
2. Check browser console for frontend errors
3. Verify Google OAuth configuration
4. Ensure environment variables are set correctly
