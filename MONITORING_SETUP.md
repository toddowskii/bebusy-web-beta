# Monitoring & Error Tracking Setup

## 🚨 Critical - Essential for Production

### 1. Error Tracking with Sentry

Install Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Configure `sentry.client.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Don't send errors in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    return event;
  },
});
```

Configure `sentry.server.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
  environment: process.env.NODE_ENV,
});
```

Add to `.env.local`:
```env
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

Benefits:
- Real-time error alerts
- Stack traces with source maps
- User context (which user experienced error)
- Performance monitoring
- Release tracking

### 2. Analytics with Vercel Analytics

Enable in Vercel Dashboard (free for hobby plan):
- Go to your project → Analytics
- Enable Web Analytics

Or add manually:
```bash
npm install @vercel/analytics
```

In `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

Tracks:
- Page views
- User sessions
- Core Web Vitals
- Top pages
- Referrer sources

### 3. Application Monitoring

Add custom logging:
```typescript
// lib/logger.ts
export function logError(error: Error, context?: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry or logging service
    console.error('Error:', error, 'Context:', context);
  } else {
    console.error('Error:', error, 'Context:', context);
  }
}

export function logInfo(message: string, data?: any) {
  if (process.env.NODE_ENV === 'production') {
    // Send to logging service
  }
  console.log(message, data);
}
```

Use in code:
```typescript
try {
  await createPost(content);
} catch (error) {
  logError(error as Error, { userId, action: 'create_post' });
  toast.error('Failed to create post');
}
```

### 4. Database Monitoring

Supabase Dashboard → Database → Query Performance:
- Check slow queries (> 1s)
- Identify missing indexes
- Monitor connection pool usage
- Set up alerts for high CPU/memory

Create indexes for slow queries (see PERFORMANCE_CHECKLIST.md)

### 5. Uptime Monitoring

Use free services:
- **UptimeRobot** (free for 50 monitors)
- **Better Uptime** (free tier available)
- **Pingdom** (free tier)

Setup:
1. Add your production URL
2. Check every 5 minutes
3. Alert via email/SMS when down
4. Monitor critical pages: /, /login, /api/health

Create health check endpoint:
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (error) throw error;
    
    return Response.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: (error as Error).message },
      { status: 503 }
    );
  }
}
```

### 6. Real User Monitoring (RUM)

Track actual user experience:

```typescript
// app/layout.tsx
'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function WebVitals() {
  const pathname = usePathname();
  
  useEffect(() => {
    // Track page views
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: pathname,
      });
    }
  }, [pathname]);
  
  return null;
}
```

Or use Web Vitals library:
```bash
npm install web-vitals
```

```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: any) {
  // Send to your analytics endpoint
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 7. User Behavior Analytics (Optional)

For deeper insights, add:

**PostHog** (open-source, privacy-friendly):
```bash
npm install posthog-js
```

```typescript
// lib/posthog.ts
import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://app.posthog.com',
  });
}

export default posthog;
```

Track events:
```typescript
import posthog from '@/lib/posthog';

// Track user actions
posthog.capture('post_created', {
  post_id: post.id,
  content_length: post.content.length
});

posthog.capture('user_banned', {
  user_id: bannedUser.id,
  reason: reason,
  duration: duration
});
```

### 8. Custom Metrics Dashboard

Create admin dashboard for key metrics:

```typescript
// app/admin/metrics/page.tsx
export default async function MetricsPage() {
  const { data: metrics } = await supabase.rpc('get_platform_metrics');
  
  return (
    <div className="grid grid-cols-4 gap-6">
      <MetricCard title="Total Users" value={metrics.total_users} />
      <MetricCard title="Daily Active Users" value={metrics.dau} />
      <MetricCard title="Posts Today" value={metrics.posts_today} />
      <MetricCard title="Banned Users" value={metrics.banned_users} />
    </div>
  );
}
```

Create SQL function:
```sql
CREATE OR REPLACE FUNCTION get_platform_metrics()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'dau', (SELECT COUNT(DISTINCT user_id) FROM posts 
            WHERE created_at > NOW() - INTERVAL '24 hours'),
    'posts_today', (SELECT COUNT(*) FROM posts 
                    WHERE created_at > NOW() - INTERVAL '24 hours'),
    'banned_users', (SELECT COUNT(*) FROM profiles WHERE role = 'banned')
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Key Metrics to Track

### User Engagement
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Session duration
- Posts per user per day
- Comments per post
- Likes per post

### Performance
- Page load time (< 2s)
- Time to Interactive (< 3s)
- Core Web Vitals
- API response time (< 500ms)
- Database query time (< 100ms)

### Reliability
- Uptime percentage (> 99.9%)
- Error rate (< 0.1%)
- Failed requests
- Timeout errors

### Security
- Failed login attempts
- Banned users count
- Reported content count
- Malicious upload attempts

### Business
- New user signups per day
- User retention rate
- Churn rate
- Feature adoption

## 🔔 Alerts to Set Up

### Critical (Immediate Action)
- Site is down
- Database is down
- Error rate > 5%
- Response time > 5s

### High Priority (Within 1 hour)
- Error rate > 1%
- Response time > 2s
- Failed authentication spike
- Storage quota > 80%

### Medium Priority (Within 24 hours)
- Slow queries detected
- Unusual traffic patterns
- Failed backup

## 📧 Notification Channels

Configure alerts to send to:
- Email (primary)
- Slack/Discord (team channel)
- SMS (critical only)
- PagerDuty (for on-call)

## 🔍 Logging Best Practices

### What to Log
```typescript
// Successful operations
logInfo('User signed up', { userId, email });
logInfo('Post created', { postId, userId });

// Errors
logError(error, { userId, action: 'upload_image' });

// Security events
logInfo('Failed login attempt', { email, ip });
logInfo('User banned', { bannedUserId, adminId, reason });

// Performance
logInfo('Slow query detected', { query, duration });
```

### What NOT to Log
- Passwords (ever!)
- Session tokens
- API keys
- Personal data (GDPR)
- Credit card numbers

### Log Levels
- **ERROR**: Something broke
- **WARN**: Something might break soon
- **INFO**: Important business events
- **DEBUG**: Detailed troubleshooting (dev only)

## 🎯 Quick Setup Checklist

- [ ] Sentry installed and configured
- [ ] Vercel Analytics enabled
- [ ] Health check endpoint created
- [ ] Uptime monitoring set up
- [ ] Error logging implemented
- [ ] Database monitoring configured
- [ ] Alerts set up for critical issues
- [ ] Metrics dashboard created
- [ ] Logging best practices followed

## 💰 Cost Estimate

- **Sentry**: Free tier (5k events/month), then $26/month
- **Vercel Analytics**: Free with hobby plan
- **UptimeRobot**: Free (50 monitors)
- **PostHog**: Free tier (1M events/month)

**Total**: $0 to start, ~$50/month as you scale
