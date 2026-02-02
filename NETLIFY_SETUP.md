# 🚀 Deploy to Netlify with Google OAuth (5 Minutes)

## What This Does

Your app will run 100% on Netlify using **Netlify Functions** (serverless) - no separate backend needed!

---

## Step 1: Deploy to Netlify (2 minutes)

### Option A: Netlify UI
1. Go to **https://app.netlify.com**
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect to GitHub and select **`podcast-generator`** repository
4. Build settings (should auto-detect):
   - **Build command:** (leave empty)
   - **Publish directory:** `.` (current directory)
   - **Functions directory:** `netlify/functions`
5. Click **"Deploy site"**
6. Wait 2-3 minutes for deployment
7. Copy your Netlify URL (e.g., `https://your-app-name.netlify.app`)

### Option B: Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod
```

---

## Step 2: Set Environment Variables in Netlify (2 minutes)

1. In Netlify dashboard, go to **Site settings** → **Environment variables**
2. Click **"Add a variable"** and add these:

```
GOOGLE_CLIENT_ID
Value: 36957544811-vih1f3mci194kkidt1ksplst6fqfvfk6.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET
Value: 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

JWT_SECRET
Value: your-random-secret-key-make-it-long-and-random

MONGODB_URI (Optional - if you want database)
Value: mongodb+srv://podcast-user:SecurePass123@podcast-app-cluster.lcsqxxf.mongodb.net/podcast-generator?retryWrites=true&w=majority&appName=podcast-app-cluster
```

3. Click **"Save"**
4. Click **"Trigger deploy"** → **"Deploy site"** to rebuild with new variables

---

## Step 3: Update Google OAuth Console (1 minute)

1. Go to **https://console.cloud.google.com/apis/credentials**
2. Click your **OAuth 2.0 Client ID**
3. Under **"Authorized JavaScript origins"**, add:
   ```
   https://your-app-name.netlify.app
   ```

4. Under **"Authorized redirect URIs"**, add:
   ```
   https://your-app-name.netlify.app/.netlify/functions/auth-callback
   ```

5. Click **"Save"**

---

## ✅ Test It!

1. Go to **https://your-app-name.netlify.app/login.html**
2. Click **"Continue with Google"**
3. Should redirect to Google login
4. After login, should redirect back to your dashboard
5. You're logged in! 🎉

---

## 🐛 Troubleshooting

### Error: "Function invocation failed"

**Solution:** Check Netlify function logs
1. Netlify dashboard → **Functions** tab
2. Click on **auth-google** or **auth-callback**
3. Check logs for errors

### Error: "redirect_uri_mismatch"

**Solution:** Update Google OAuth Console
- Make sure the redirect URI matches EXACTLY:
  ```
  https://your-app-name.netlify.app/.netlify/functions/auth-callback
  ```

### Error: "Environment variables not set"

**Solution:** Add environment variables in Netlify
1. Site settings → Environment variables
2. Add all required variables
3. Redeploy site

---

## 📁 What Was Created

### New Files:
- `netlify/functions/auth-google.js` - Initiates Google OAuth
- `netlify/functions/auth-callback.js` - Handles OAuth callback
- `netlify/functions/package.json` - Dependencies for functions
- `netlify.toml` - Netlify configuration

### Updated Files:
- `js/env.js` - Auto-detects Netlify environment
- All API calls now work with Netlify Functions

---

## 🔧 How It Works

1. User clicks "Continue with Google"
2. Redirects to: `https://your-app.netlify.app/api/auth/google`
3. Netlify redirects to: `/.netlify/functions/auth-google`
4. Function redirects to Google OAuth
5. Google redirects back to: `/.netlify/functions/auth-callback`
6. Function creates JWT token and redirects to dashboard
7. User is logged in!

---

## 💰 Cost

- **Netlify Free Tier:**
  - 125,000 function invocations/month
  - 100 GB bandwidth/month
  - **FREE forever!**

---

## 🎯 Advantages of This Setup

✅ No separate backend deployment needed
✅ Automatic HTTPS
✅ Global CDN
✅ Automatic deployments on git push
✅ Free tier is generous
✅ Easy to set up (5 minutes)

---

## 📝 Next Steps

After deploying:
1. ✅ Test Google login
2. ✅ Test creating documents
3. ✅ Test generating podcasts
4. ✅ Share your app URL!

---

## 🔄 Continuous Deployment

Every time you push to GitHub, Netlify will:
1. Automatically detect changes
2. Rebuild and deploy
3. Your site is always up-to-date!

```bash
git add .
git commit -m "Update feature"
git push origin main
# Netlify deploys automatically!
```

---

## 📞 Support

If you need help:
1. Check Netlify function logs
2. Check browser console (F12)
3. Verify environment variables are set
4. Verify Google OAuth URLs match

**Time to deploy:** 5 minutes
**Cost:** FREE
**Difficulty:** Easy
