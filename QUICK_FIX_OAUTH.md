# 🚨 URGENT: Fix Google OAuth Now (3 Steps)

## The Problem
Your app is trying to use Google OAuth but the frontend (GitHub Pages/Netlify) can't run the Node.js backend!

## The Solution (3 Steps - 10 minutes)

### Step 1: Deploy Backend to Railway (5 minutes)

1. Go to **https://railway.app**
2. Click **"Start a New Project"**
3. Click **"Deploy from GitHub repo"**
4. Select your **`podcast-generator`** repository
5. Wait for deployment (2-3 minutes)
6. Click on your project → **"Settings"** tab
7. Copy your deployment URL (looks like: `https://pod-app-production-xxxx.up.railway.app`)

### Step 2: Add Environment Variables in Railway (2 minutes)

Click **"Variables"** tab and add these:

```
MONGODB_URI = mongodb+srv://podcast-user:SecurePass123@podcast-app-cluster.lcsqxxf.mongodb.net/podcast-generator?retryWrites=true&w=majority&appName=podcast-app-cluster

GOOGLE_CLIENT_ID = 36957544811-vih1f3mci194kkidt1ksplst6fqfvfk6.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET = 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

GOOGLE_CALLBACK_URL = https://your-railway-url.up.railway.app/api/auth/google/callback
(⚠️ Replace with YOUR actual Railway URL from Step 1)

JWT_SECRET = your-secret-key-here-make-it-random

SESSION_SECRET = another-secret-key-here

NODE_ENV = production
```

### Step 3: Update Your Code (3 minutes)

1. **Edit `js/env.js`** (line 16):
   ```javascript
   const DEPLOYED_BACKEND_URL = 'https://your-railway-url.up.railway.app';
   ```
   ⚠️ Replace with YOUR Railway URL

2. **Go to Google Cloud Console**:
   - Visit: https://console.cloud.google.com/apis/credentials
   - Click your OAuth 2.0 Client ID
   - Under **"Authorized redirect URIs"**, add:
     ```
     https://your-railway-url.up.railway.app/api/auth/google/callback
     ```
   - Click **Save**

3. **Push your changes**:
   ```bash
   git add js/env.js
   git commit -m "Update backend URL"
   git push origin main
   ```

## ✅ Test It!

1. Go to your deployed site (GitHub Pages or Netlify)
2. Click **"Continue with Google"**
3. Should redirect to Google login
4. After login, should return to your dashboard

## 🐛 Still Not Working?

Check these:

- [ ] Railway backend is running (check railway.app dashboard)
- [ ] Environment variables are set in Railway
- [ ] Google OAuth callback URL matches exactly (including https://)
- [ ] `js/env.js` has the correct Railway URL
- [ ] Browser console shows no CORS errors

## 📞 Quick Debug

Open browser console (F12) and check:
```javascript
window.ENV.getApiUrl()  // Should show your Railway URL
```

If it shows the wrong URL, you need to update `js/env.js` and redeploy!

---

**Time Required:** 10 minutes
**Cost:** $0 (Railway free tier)
**Difficulty:** Easy (just copy/paste)
