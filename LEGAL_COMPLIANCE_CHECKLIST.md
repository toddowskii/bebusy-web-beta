# Legal & Compliance Checklist

## 🚨 Critical - Required Before Launch

### 1. Privacy Policy
Create `/privacy-policy` page with:
- What data you collect (email, posts, messages, profile info)
- How you use it (providing service, analytics)
- How you store it (Supabase, encryption)
- How users can delete their data
- Cookie usage
- Third-party services (Supabase, Vercel)
- Contact information

Template sources:
- https://www.termsfeed.com/privacy-policy-generator/
- https://www.privacypolicies.com/

### 2. Terms of Service
Create `/terms-of-service` page with:
- User responsibilities
- Prohibited content
- Account termination policy
- Intellectual property rights
- Limitation of liability
- Dispute resolution
- Governing law
- Changes to terms

Template sources:
- https://www.termsfeed.com/terms-service-generator/

### 3. Cookie Consent (GDPR)
If you have users in EU, you MUST have cookie consent:

```bash
npm install react-cookie-consent
```

```typescript
// In app/layout.tsx
import CookieConsent from "react-cookie-consent";

<CookieConsent
  location="bottom"
  buttonText="Accept"
  declineButtonText="Decline"
  enableDeclineButton
  cookieName="bebusy_consent"
  style={{ background: "#1C1C1E" }}
  buttonStyle={{ background: "#10B981", color: "#fff", borderRadius: "20px" }}
>
  This site uses cookies to enhance your experience. 
  See our <Link href="/privacy-policy">Privacy Policy</Link>.
</CookieConsent>
```

### 4. Age Requirement
Social media typically requires 13+ (COPPA) or 16+ (GDPR):

Add to signup page:
```typescript
const [agreedToTerms, setAgreedToTerms] = useState(false);
const [isOver13, setIsOver13] = useState(false);

// In signup form:
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={isOver13}
    onChange={(e) => setIsOver13(e.target.checked)}
    required
  />
  <span className="text-sm">I am 13 years or older</span>
</label>

<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={agreedToTerms}
    onChange={(e) => setAgreedToTerms(e.target.checked)}
    required
  />
  <span className="text-sm">
    I agree to the{' '}
    <Link href="/terms-of-service" className="text-[#10B981]">
      Terms of Service
    </Link>
    {' '}and{' '}
    <Link href="/privacy-policy" className="text-[#10B981]">
      Privacy Policy
    </Link>
  </span>
</label>
```

### 5. Data Export (GDPR Right to Access)
Users must be able to download their data:

Create `/settings/download-data` page:
```typescript
async function downloadUserData() {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', userId);
    
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('sender_id', userId);
    
  const userData = {
    profile,
    posts,
    messages,
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(userData, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bebusy-data-${Date.now()}.json`;
  a.click();
}
```

### 6. Account Deletion (GDPR Right to Erasure)
Users must be able to delete their account:

Add to `/settings/account`:
```typescript
async function deleteAccount() {
  if (!confirm('Are you sure? This action cannot be undone.')) return;
  
  // Delete user data
  await supabase.from('posts').delete().eq('user_id', userId);
  await supabase.from('comments').delete().eq('user_id', userId);
  await supabase.from('likes').delete().eq('user_id', userId);
  await supabase.from('messages').delete().eq('sender_id', userId);
  await supabase.from('followers').delete().or(`follower_id.eq.${userId},following_id.eq.${userId}`);
  await supabase.from('profiles').delete().eq('id', userId);
  
  // Delete auth user (requires admin SDK or service role)
  await supabase.auth.admin.deleteUser(userId);
  
  // Sign out
  await supabase.auth.signOut();
  router.push('/');
}
```

### 7. DMCA Compliance
Add `/dmca` page with:
- How to report copyright infringement
- Contact email for DMCA notices
- Designated copyright agent
- Counter-notification process

### 8. Community Guidelines
Create `/community-guidelines` page with:
- What content is allowed
- What content is prohibited (hate speech, harassment, spam, illegal content)
- Consequences for violations
- How to report violations

### 9. Report System
Implement content reporting:

```typescript
// Create reports table
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES profiles(id),
  reported_content_type TEXT NOT NULL, -- 'post', 'comment', 'user', 'message'
  reported_content_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);
```

Add report button to posts/comments:
```typescript
async function reportContent(contentType: string, contentId: string, reason: string) {
  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: currentUser.id,
      reported_content_type: contentType,
      reported_content_id: contentId,
      reason: reason
    });
    
  if (!error) {
    toast.success('Report submitted. We will review it shortly.');
  }
}
```

### 10. Contact Information
Add `/contact` page or footer with:
- Support email
- Business address (if required in your jurisdiction)
- Response time expectations

## 📋 GDPR Specific Requirements (EU Users)

### Data Processing Agreement
If using Supabase:
- Review their DPA (Data Processing Agreement)
- Ensure they are GDPR compliant
- Document your data processors

### User Rights to Implement
- [x] Right to access (data export)
- [x] Right to erasure (account deletion)
- [ ] Right to rectification (edit profile - already exists)
- [ ] Right to restrict processing
- [ ] Right to data portability (export in portable format)
- [ ] Right to object

### Legal Basis for Processing
Document in privacy policy:
- Consent: User agreed to terms
- Contract: Providing the service
- Legitimate interest: Improving service, security

### Data Retention
Define and document:
- How long you keep user data
- How long you keep logs
- When you delete inactive accounts

Add to privacy policy:
```
We retain your data as long as your account is active. 
Deleted accounts are permanently erased within 30 days.
```

## 🌍 International Considerations

### CCPA (California Users)
If you have California users:
- Add "Do Not Sell My Personal Information" link
- Provide opt-out mechanism
- Update privacy policy

### Other Jurisdictions
Research requirements for your target markets:
- Brazil: LGPD
- Canada: PIPEDA
- Australia: Privacy Act
- India: DPDP Act

## ✅ Pre-Launch Legal Checklist

- [ ] Privacy Policy page created and linked in footer
- [ ] Terms of Service page created and linked in footer
- [ ] Cookie consent banner implemented
- [ ] Age verification on signup
- [ ] Agreement to terms checkbox on signup
- [ ] Data export functionality
- [ ] Account deletion functionality
- [ ] DMCA page created
- [ ] Community Guidelines page created
- [ ] Report system implemented
- [ ] Contact page/email available
- [ ] Reviewed Supabase DPA
- [ ] Consulted with lawyer (recommended)

## ⚠️ Disclaimer
This is a general checklist. Laws vary by jurisdiction. 
Consult with a qualified attorney before launching your platform.

## 📞 When to Consult a Lawyer

You should consult a lawyer if:
- You expect significant user growth
- You're collecting sensitive data
- You're monetizing the platform
- You're targeting multiple countries
- You're unsure about any legal requirements

Cost: $500-$2000 for basic legal review
Worth it for: Peace of mind and avoiding lawsuits
