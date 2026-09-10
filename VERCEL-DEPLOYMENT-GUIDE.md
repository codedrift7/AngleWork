# Vercel Deployment Guide

## 🚀 Quick Deployment Checklist

### ✅ Pre-Deployment
- [x] All code committed to GitHub
- [x] Environment variables configured in Vercel
- [x] `vercel.json` configuration added
- [x] Server Actions properly exported with `'use server'`

### 🔐 Required Environment Variables

Add these in **Vercel Dashboard** → **Settings** → **Environment Variables**:

```env
# Database (Required)
DATABASE_URL=postgresql://your_connection_string_here
DATABASE_URL_UNPOOLED=postgresql://your_unpooled_connection_string_here

# LLM Provider (Required)
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# Fallback Provider (Optional)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
```

**Important:** Select **all three environments** (Production, Preview, Development) when adding each variable.

---

## 🐛 Common Deployment Issues

### Issue 1: "UnrecognizedActionError: Server Action was not found"

**Error:**
```
Error submitting form: UnrecognizedActionError: Server Action "4015249708a0195f329447f3a59c561f0fb20c9567" was not found on the server.
```

**Cause:** 
- Stale build cache in Vercel
- Client/server bundle mismatch
- Server Actions not properly registered

**Fix:**
1. **Force clean rebuild:**
   ```bash
   # Vercel Dashboard
   Settings → General → Build & Development Settings
   Override Build Command: rm -rf .next && npm run build
   ```

2. **Or trigger new deployment:**
   ```bash
   git commit --allow-empty -m "Force rebuild"
   git push origin main
   ```

3. **Clear Vercel cache:**
   - Deployments tab → Click "..." → Redeploy → ✅ Check "Clear cache"

---

### Issue 2: Database Connection Errors

**Error:**
```
PrismaClientInitializationError: Can't reach database server
```

**Fix:**
1. Verify `DATABASE_URL` is the **pooled** connection string
2. Verify `DATABASE_URL_UNPOOLED` is the **direct** connection string
3. Check Neon database is active (not paused)
4. Test connection: https://console.neon.tech

---

### Issue 3: LLM Provider Errors

**Error:**
```
Error: GROQ_API_KEY environment variable is not set
```

**Fix:**
1. Add `GROQ_API_KEY` in Vercel environment variables
2. Ensure it's set for **Production** environment
3. Redeploy after adding variables

**Alternative:** Switch to OpenRouter temporarily:
```env
LLM_PROVIDER=openrouter
```

---

### Issue 4: Build Timeouts

**Error:**
```
Error: Command "npm run build" timed out after 600 seconds
```

**Fix:**
1. Prisma generation takes time. Ensure `prebuild` script runs:
   ```json
   "scripts": {
     "prebuild": "prisma generate",
     "build": "next build"
   }
   ```

2. Check Vercel build logs for specific errors

3. If Prisma generation is slow, pre-generate locally:
   ```bash
   npm run prebuild
   git add src/generated/
   git commit -m "Add pre-generated Prisma client"
   git push
   ```

---

## 🔍 Debugging Production Issues

### Check Build Logs
1. Go to **Vercel Dashboard** → **Deployments**
2. Click on the latest deployment
3. Click **"Building"** or **"Function Logs"**
4. Look for errors in:
   - Build output
   - Runtime logs
   - Edge function errors

### Check Function Logs
1. Go to **Monitoring** tab in Vercel
2. Check **Function Logs** for runtime errors
3. Look for:
   ```
   [LLM] Using groq with model llama-3.3-70b-versatile
   [Server Action] createCampaignFromBrief - Starting
   ```

### Test Server Actions Locally
```bash
npm run build
npm run start

# Test production build locally before deploying
```

---

## 📋 Deployment Workflow

### Standard Deployment (No Issues)
```bash
git add .
git commit -m "Your changes"
git push origin main
# Vercel auto-deploys
```

### Force Clean Deployment (After Issues)
```bash
# Option 1: Empty commit
git commit --allow-empty -m "Force clean rebuild"
git push origin main

# Option 2: Vercel Dashboard
# Settings → Clear cache → Redeploy

# Option 3: Vercel CLI
vercel --force
```

---

## ⚙️ Vercel Configuration Files

### `vercel.json` (Already configured)
```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "installCommand": "npm ci",
  "regions": ["sin1"],
  "cleanUrls": true,
  "trailingSlash": false,
  "env": {
    "NEXT_TELEMETRY_DISABLED": "1"
  }
}
```

### `next.config.ts` (Already configured)
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
```

---

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit `.env.local` to Git
- ✅ Use separate API keys for production/development
- ✅ Rotate keys regularly
- ✅ Use Vercel's encrypted environment variables

### Database
- ✅ Use connection pooling (`DATABASE_URL` with `-pooler`)
- ✅ Keep direct connection for Prisma CLI only
- ✅ Enable SSL mode (`sslmode=require`)
- ✅ Monitor connection limits in Neon dashboard

### Server Actions
- ✅ Always use `'use server'` directive
- ✅ Validate inputs with Zod schemas
- ✅ Use `revalidatePath()` after mutations
- ✅ Return typed `ActionResult` objects

---

## 📊 Performance Monitoring

### Check Vercel Analytics
1. Go to **Analytics** tab
2. Monitor:
   - Function execution time
   - Error rates
   - Regional latency

### Expected Performance (with Groq)
- **Product Analyst**: ~5 seconds
- **Positioning Strategist**: ~7 seconds
- **Full Pipeline**: ~45-50 seconds
- **Page Load**: <2 seconds

### If Pipeline is Slow
1. Check Groq API status: https://status.groq.com
2. Verify `LLM_PROVIDER=groq` is set
3. Check function logs for timeout errors
4. Consider switching to OpenRouter temporarily

---

## 🆘 Emergency Rollback

If deployment breaks production:

### Quick Rollback
1. Go to **Deployments** tab
2. Find last working deployment
3. Click **"..."** → **Promote to Production**
4. Done! (rolls back instantly)

### Fix and Redeploy
1. Fix the issue locally
2. Test with `npm run build && npm run start`
3. Commit and push fix
4. Vercel auto-deploys fixed version

---

## ✅ Post-Deployment Verification

After successful deployment:

1. **Test Homepage**
   - Visit: https://your-app.vercel.app
   - Should load without errors

2. **Test Campaign Creation**
   - Fill out the form
   - Submit and wait for pipeline
   - Check function logs: `[LLM] Using groq...`

3. **Verify Database**
   - Check campaign was created in Neon
   - Verify all 6 pipeline stages completed

4. **Monitor Performance**
   - Check function execution times
   - Verify Groq is being used (fast responses)
   - No timeout errors in logs

---

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Neon Docs**: https://neon.tech/docs
- **Groq Docs**: https://console.groq.com/docs

---

## 🎯 Current Status

✅ Server Actions properly configured  
✅ Vercel configuration files added  
✅ Environment variables documented  
✅ Build optimizations applied  
✅ Clean rebuild triggered  

**Latest deployment should be working now!**

Check: https://vercel.com/code-drift/angle-work/deployments
