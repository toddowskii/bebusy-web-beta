# Production Deployment Checklist

## 🎯 Pre-Deployment Steps

### 1. Environment Variables

**Local Development** (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn (optional)
```

**Vercel Production**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add ALL environment variables
3. Mark sensitive ones as "Sensitive" (hidden in logs)
4. Set appropriate environments: Production, Preview, Development

**CRITICAL**: Never commit `.env.local` to git!

### 2. Database Setup

Run ALL migrations in Supabase SQL Editor:
```bash
# In order:
1. CREATE_CONVERSATIONS_TABLE.sql
2. CREATE_NOTIFICATIONS_TABLE.sql
3. ADD_GROUP_ID_TO_POSTS.sql
4. ADD_GROUP_TO_FOCUS_GROUPS.sql
5. ADD_BANNED_UNTIL_COLUMN.sql
6. ADD_COVER_URL_COLUMN.sql (optional)
7. BANNER_STORAGE_SETUP.sql (optional)
```

Verify tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 3. Row Level Security (RLS)

Verify RLS is ENABLED on ALL tables:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

If any table shows `rowsecurity = false`:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

Apply security policies (see DATABASE_SETUP_CHECKLIST.md)

### 4. Storage Buckets

Create in Supabase Dashboard → Storage:
- `avatars` (public)
- `posts` (public)
- `banners` (public, optional)

Set bucket policies (see DATABASE_SETUP_CHECKLIST.md)

Test uploads work from your app.

### 5. Build Test

Test production build locally:
```bash
npm run build
npm run start
```

Check for:
- ✅ No build errors
- ✅ No TypeScript errors
- ✅ No missing environment variables
- ✅ Pages load correctly
- ✅ Images load correctly
- ✅ No console errors

### 6. Code Quality Check

Run linter:
```bash
npm run lint
```

Fix any errors before deploying.

Optional - run type check:
```bash
npx tsc --noEmit
```

### 7. Security Audit

```bash
npm audit
```

Fix high/critical vulnerabilities:
```bash
npm audit fix
```

### 8. Performance Check

Run Lighthouse audit on localhost:3000:
- Open Chrome DevTools → Lighthouse
- Run audit on key pages
- Fix any major issues (score < 50)

### 9. Test Critical Flows

Manual testing:
- [ ] Signup works
- [ ] Login works
- [ ] Create post works
- [ ] Upload image works
- [ ] Comment works
- [ ] Like works
- [ ] Follow/unfollow works
- [ ] Messages work
- [ ] Notifications work
- [ ] Admin can ban users
- [ ] Banned users see /banned page
- [ ] User can edit profile
- [ ] User can delete post

### 10. Browser Testing

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (if Mac)
- [ ] Mobile Chrome
- [ ] Mobile Safari

Check for layout issues, broken features.

## 🚀 Deployment to Vercel

### First Time Setup

1. **Install Vercel CLI** (optional):
```bash
npm i -g vercel
```

2. **Connect GitHub Repository**:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Vercel auto-detects Next.js

3. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
   - Install Command: `npm install` (default)

4. **Add Environment Variables**:
   - Add all variables from `.env.local`
   - Mark sensitive variables as "Sensitive"

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete
   - Get your production URL

### Continuous Deployment

Once connected, Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### Custom Domain Setup

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `bebusy.com`)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (5 minutes - 48 hours)

DNS Records (example):
```
A Record:
  Name: @
  Value: 76.76.21.21 (Vercel's IP)

CNAME Record:
  Name: www
  Value: cname.vercel-dns.com
```

### SSL Certificate

Vercel automatically provisions SSL certificates.
Your site will be HTTPS by default.

## ✅ Post-Deployment Verification

### 1. Smoke Tests

Visit your production site and test:
- [ ] Homepage loads
- [ ] Signup works
- [ ] Login works
- [ ] Create post works
- [ ] Upload image works
- [ ] All pages accessible

### 2. Check Error Monitoring

- [ ] Sentry is receiving events
- [ ] No critical errors in Sentry
- [ ] Vercel Analytics is tracking

### 3. Check Database

- [ ] New signups appear in Supabase
- [ ] Posts are saved correctly
- [ ] RLS is working (users can't access others' data)

### 4. Performance Check

Run Lighthouse on production URL:
- [ ] Performance > 80
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

### 5. Security Check

- [ ] HTTPS is enabled (🔒 in address bar)
- [ ] Privacy Policy page accessible
- [ ] Terms of Service page accessible
- [ ] Cookie consent appears (if implemented)

### 6. Mobile Check

Test on real mobile device:
- [ ] Layout looks good
- [ ] Touch targets are large enough
- [ ] Forms work correctly
- [ ] Images load

## 📊 Monitoring Setup

After deployment:

1. **Set up Uptime Monitoring**:
   - Add production URL to UptimeRobot
   - Set check interval to 5 minutes
   - Configure email alerts

2. **Configure Sentry Alerts**:
   - Go to Sentry → Alerts
   - Create alert for error rate > 1%
   - Send to email/Slack

3. **Enable Vercel Alerts**:
   - Go to Vercel → Project → Settings → Notifications
   - Enable deployment failure alerts
   - Enable build error alerts

4. **Check Analytics Daily** (first week):
   - Vercel Analytics for traffic
   - Sentry for errors
   - Supabase for database usage

## 🔄 Update/Rollback Process

### Deploy Update

1. Make changes in development
2. Test locally
3. Commit and push to GitHub
4. Vercel auto-deploys
5. Verify in production

### Rollback

If something breaks:

**Option 1: Vercel Dashboard**
1. Go to Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

**Option 2: Git Revert**
```bash
git revert HEAD
git push origin main
```

**Option 3: Instant Rollback**
```bash
vercel rollback
```

## 🎯 Launch Day Checklist

**Morning of Launch**:
- [ ] All environment variables set
- [ ] Database migrations complete
- [ ] RLS enabled and tested
- [ ] Storage buckets created
- [ ] Production build tested
- [ ] Critical flows tested
- [ ] Error monitoring active
- [ ] Uptime monitoring active
- [ ] Legal pages published
- [ ] Mobile tested
- [ ] Performance acceptable

**After Launch**:
- [ ] Monitor errors in Sentry (first hour)
- [ ] Check server logs (first hour)
- [ ] Test signup/login flow (production)
- [ ] Monitor user feedback
- [ ] Check performance metrics
- [ ] Verify analytics tracking

## 🚨 Emergency Contacts

Keep these handy on launch day:
- Supabase status: https://status.supabase.com/
- Vercel status: https://www.vercel-status.com/
- Your hosting provider support
- Database admin (if separate)

## 📈 Post-Launch Plan

**Week 1**:
- Monitor errors daily
- Fix critical bugs immediately
- Collect user feedback
- Watch performance metrics

**Week 2-4**:
- Address user feedback
- Optimize slow queries
- Improve performance
- Add missing features

**Month 2+**:
- Plan new features
- Scale infrastructure if needed
- Optimize costs
- Improve user experience

## 💡 Pro Tips

1. **Deploy on Tuesday/Wednesday**: Avoid Fridays (no weekend debugging)
2. **Deploy in the morning**: Give yourself time to fix issues
3. **Have a rollback plan**: Know how to revert quickly
4. **Monitor actively first 24 hours**: Catch issues early
5. **Keep changelog**: Document what you deploy
6. **Test in production**: After deploy, manually test critical flows
7. **Announce maintenance windows**: If doing database migrations
8. **Have backups**: Supabase auto-backs up, verify it's enabled

## ❌ Common Deployment Mistakes

- Forgetting environment variables → Site breaks
- Not enabling RLS → Security breach
- Deploying on Friday → Weekend debugging
- Not testing mobile → Users complain
- Missing legal pages → GDPR violations
- No error monitoring → Bugs go unnoticed
- Not testing production build → Different from dev
- Committing .env.local → Security breach

## 🎉 You're Ready!

When all checkboxes are ✅, you're ready to deploy!

Good luck with your launch! 🚀
