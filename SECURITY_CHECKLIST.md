# Security Checklist for Production Launch

## ✅ Completed
- [x] Banned user middleware protection
- [x] RLS enabled on database
- [x] Admin role verification
- [x] Group message filtering
- [x] Temporary ban system with auto-unban

## ⚠️ Critical - Must Do Before Launch

### 1. Email Verification
Currently users can sign up without verifying email. Enable in Supabase:
- Go to Authentication → Settings → Email Auth
- Enable "Confirm email" 
- Set up email templates

### 2. Password Reset Flow
Users need ability to reset forgotten passwords:
- Create `/reset-password` page
- Use `supabase.auth.resetPasswordForEmail()`
- Set up email template in Supabase

### 3. Rate Limiting
Prevent spam and abuse:
```typescript
// Add to middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Set up rate limiting (requires Upstash Redis)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

Or use simpler approach with Supabase Edge Functions.

### 4. Input Sanitization
Prevent XSS attacks:
```bash
npm install dompurify
npm install @types/dompurify --save-dev
```

Sanitize user input in posts/comments:
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizedContent = DOMPurify.sanitize(userInput);
```

### 5. CSRF Protection
Next.js has built-in CSRF protection, but verify:
- All mutations use POST/PUT/DELETE (not GET)
- Server Actions are properly secured
- API routes verify origin headers

### 6. Content Moderation
Add automated content filtering:
```bash
npm install bad-words
```

```typescript
import Filter from 'bad-words';
const filter = new Filter();

// Before saving posts/comments
if (filter.isProfane(content)) {
  return { error: 'Content contains inappropriate language' };
}
```

Or integrate AI moderation:
- OpenAI Moderation API
- Perspective API (Google)
- Azure Content Safety

### 7. Image Upload Security
Current uploads need validation:

```typescript
// Add to upload functions
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

if (file.size > MAX_FILE_SIZE) {
  throw new Error('File too large');
}
if (!ALLOWED_TYPES.includes(file.type)) {
  throw new Error('Invalid file type');
}
```

### 8. Environment Variables Security
**NEVER** commit `.env.local` to git:
```bash
# Add to .gitignore (should already be there)
.env*.local
```

Verify no secrets in public code:
```bash
git log -p | grep -i "supabase"
```

### 9. Session Security
Configure in Supabase Dashboard:
- Session timeout: 7 days maximum
- Enable "Automatic Reuse Detection"
- Set secure cookie flags (httpOnly, secure, sameSite)

### 10. API Abuse Prevention
Add to critical endpoints:
- User authentication checks
- Request size limits
- Payload validation
- Timeout configurations

## 📊 Nice to Have (Post-Launch)

### 1. Two-Factor Authentication (2FA)
Enable in Supabase:
- Phone Auth
- Authenticator Apps

### 2. IP Blocking
For persistent abusers:
- Log IP addresses (GDPR compliant)
- Implement IP-based bans
- Use Cloudflare for DDoS protection

### 3. Security Headers
Add to `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
      ],
    },
  ];
},
```

### 4. Audit Logging
Track admin actions:
- Who banned whom and when
- Post deletions
- Role changes
- Database schema changes

### 5. Backup Strategy
- Enable Supabase point-in-time recovery
- Regular database backups
- Test restore procedures

## 🔍 Security Testing

Before launch, test:
1. Try to access admin pages without admin role
2. Try to post/comment while banned
3. Try SQL injection in forms
4. Try XSS in post content
5. Try uploading malicious files
6. Try to access other users' data
7. Try to bypass rate limits

## 📱 Mobile/Browser Security
- Test on different browsers
- Verify HTTPS in production
- Check CSP (Content Security Policy)
- Test on mobile devices
