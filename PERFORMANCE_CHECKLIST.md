# Performance Optimization Checklist

## 🎯 Critical (Do Before Launch)

### 1. Database Indexing
Add indexes to frequently queried columns:

```sql
-- Posts table
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_group_id ON posts(group_id);

-- Comments table
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Likes table
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_composite ON likes(post_id, user_id);

-- Followers table
CREATE INDEX idx_followers_follower ON followers(follower_id);
CREATE INDEX idx_followers_following ON followers(following_id);

-- Messages table
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Notifications table
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Profiles table
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_banned_until ON profiles(banned_until);
```

### 2. Image Optimization

Install Next.js Image Optimization:
```bash
npm install sharp
```

Update `next.config.ts`:
```typescript
const nextConfig = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },
};
```

Replace `<img>` tags with Next.js `<Image>`:
```typescript
import Image from 'next/image';

<Image
  src={avatarUrl}
  alt="Avatar"
  width={40}
  height={40}
  className="rounded-full"
  priority={false}
  loading="lazy"
/>
```

### 3. Lazy Loading & Code Splitting

Lazy load heavy components:
```typescript
import dynamic from 'next/dynamic';

const CreatePost = dynamic(() => import('@/components/CreatePost'), {
  loading: () => <p>Loading...</p>,
  ssr: false
});
```

### 4. Pagination

Add pagination to all list views:

```typescript
// In posts.ts
export async function fetchPosts(page = 1, limit = 20) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error, count } = await supabase
    .from('posts')
    .select('*, profiles(*), likes(count)', { count: 'exact' })
    .is('group_id', null)
    .order('created_at', { ascending: false })
    .range(from, to);
    
  return { data, error, totalPages: Math.ceil((count || 0) / limit) };
}
```

Implement infinite scroll or pagination UI:
```typescript
'use client';
import { useState, useEffect } from 'react';

export default function Feed() {
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  
  const loadMore = async () => {
    const { data, totalPages } = await fetchPosts(page);
    setPosts([...posts, ...data]);
    setHasMore(page < totalPages);
    setPage(page + 1);
  };
  
  return (
    <>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
      {hasMore && <button onClick={loadMore}>Load More</button>}
    </>
  );
}
```

### 5. Caching Strategy

Add React Query for data caching:
```bash
npm install @tanstack/react-query
```

Or use Next.js built-in caching:
```typescript
// In Server Components
export const revalidate = 60; // Revalidate every 60 seconds

// In fetch calls
fetch(url, { next: { revalidate: 60 } });
```

### 6. Bundle Size Optimization

Check bundle size:
```bash
npm run build
```

Analyze bundles:
```bash
npm install @next/bundle-analyzer
```

In `next.config.ts`:
```typescript
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

Run: `ANALYZE=true npm run build`

### 7. Database Connection Pooling

Supabase handles this, but verify:
- Connection pooling is enabled
- Pool size is appropriate (default: 15)
- Check for connection leaks

### 8. Optimize Supabase Queries

Reduce over-fetching:
```typescript
// Bad - fetches all columns
.select('*')

// Good - only fetch what you need
.select('id, content, created_at, user_id, profiles(id, username, avatar_url)')
```

Use query performance insights in Supabase Dashboard.

## ⚡ Nice to Have (Post-Launch)

### 1. CDN Setup
Use Vercel's Edge Network (automatic) or Cloudflare.

### 2. Compression
Enable in `next.config.ts`:
```typescript
compress: true, // Gzip compression
```

### 3. Prefetching
Prefetch critical pages:
```typescript
import Link from 'next/link';

<Link href="/profile" prefetch={true}>Profile</Link>
```

### 4. Service Worker (PWA)
Make it a Progressive Web App:
```bash
npm install next-pwa
```

### 5. Database Read Replicas
For high traffic, use Supabase read replicas.

### 6. Redis Caching
Cache frequently accessed data:
```bash
npm install @upstash/redis
```

### 7. Lighthouse Audit
Run regular Lighthouse audits:
- Performance score > 90
- Accessibility score > 95
- Best Practices score > 90
- SEO score > 90

### 8. Real User Monitoring
Add monitoring:
- Vercel Analytics (built-in)
- Google Analytics
- Sentry for error tracking

## 📊 Performance Metrics to Track

1. **Time to First Byte (TTFB)**: < 600ms
2. **First Contentful Paint (FCP)**: < 1.8s
3. **Largest Contentful Paint (LCP)**: < 2.5s
4. **Cumulative Layout Shift (CLS)**: < 0.1
5. **First Input Delay (FID)**: < 100ms
6. **Total Blocking Time (TBT)**: < 200ms

## 🔍 Testing Performance

1. Use Chrome DevTools Lighthouse
2. Test on slow 3G network
3. Test on mobile devices
4. Use WebPageTest.org
5. Monitor Vercel Analytics
6. Check Supabase query performance

## ⚙️ Production Build Settings

```typescript
// next.config.ts
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react'],
  },
};
```
