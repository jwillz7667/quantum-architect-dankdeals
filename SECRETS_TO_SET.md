# ⚠️ REMAINING SECRETS TO SET

## ✅ Already Set (from .env.local)

The following secrets have been configured in GitHub:

- ✅ VITE_SUPABASE_URL
- ✅ VITE_SUPABASE_ANON_KEY
- ✅ VITE_SUPABASE_SERVICE_ROLE_KEY
- ✅ SUPABASE_PROJECT_REF
- ✅ VITE_RESEND_API_KEY
- ✅ VITE_GTM_ID
- ✅ VITE_GA_MEASUREMENT_ID
- ✅ VITE_SENTRY_DSN

---

## 🔴 CRITICAL: Set These Manually

### 1. Netlify Secrets (Required for Deployment)

```bash
# Get from: https://app.netlify.com/user/applications
gh secret set NETLIFY_AUTH_TOKEN --body "YOUR_NETLIFY_TOKEN"

# Get from: Netlify → Site Settings → General → Site information
gh secret set NETLIFY_SITE_ID --body "YOUR_SITE_ID"
```

**How to get NETLIFY_AUTH_TOKEN:**

1. Go to https://app.netlify.com/user/applications
2. Click "New access token"
3. Name it "GitHub Actions CI/CD"
4. Copy the token
5. Run: `gh secret set NETLIFY_AUTH_TOKEN --body "PASTE_TOKEN_HERE"`

**How to get NETLIFY_SITE_ID:**

1. Go to your Netlify site dashboard
2. Navigate to Site Settings → General → Site information
3. Copy the "Site ID"
4. Run: `gh secret set NETLIFY_SITE_ID --body "PASTE_SITE_ID_HERE"`

---

### 2. Supabase CLI Secrets (Required for Migrations & Edge Functions)

```bash
# Get from: https://supabase.com/dashboard/account/tokens
gh secret set SUPABASE_ACCESS_TOKEN --body "YOUR_ACCESS_TOKEN"

# Get from: Supabase Dashboard → Settings → Database → Connection string
gh secret set SUPABASE_DB_PASSWORD --body "YOUR_DB_PASSWORD"
```

**How to get SUPABASE_ACCESS_TOKEN:**

1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Name it "GitHub Actions"
4. Copy the token (starts with sbp\_)
5. Run: `gh secret set SUPABASE_ACCESS_TOKEN --body "PASTE_TOKEN_HERE"`

**How to get SUPABASE_DB_PASSWORD:**

1. Go to https://supabase.com/dashboard/project/ralbzuvkyexortqngvxs/settings/database
2. Find "Database password" (you may need to reset it if you don't know it)
3. Copy the password
4. Run: `gh secret set SUPABASE_DB_PASSWORD --body "PASTE_PASSWORD_HERE"`

---

## 🔐 SECURITY WARNING

**⚠️ IMPORTANT:** The credentials you shared in this conversation are now exposed and should be rotated:

### Credentials to Rotate (High Priority)

1. **Resend API Key** - Rotate at https://resend.com/api-keys
   - Delete: `re_hj9uKYys_G2cEExGjRdiFnUZV6HEN6qFP`
   - Create new key
   - Update in GitHub: `gh secret set VITE_RESEND_API_KEY --body "NEW_KEY"`

2. **Google Client Secret** - Rotate at https://console.cloud.google.com/
   - The value `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` is now exposed
   - Generate new OAuth client secret
   - Update in Supabase and GitHub secrets

3. **Sentry DSN** - Less critical (DSN is meant to be somewhat public)
   - But consider rotating at https://sentry.io/settings/

### Credentials That Are Safe

These are designed to be public (protected by RLS):

- ✅ VITE_SUPABASE_ANON_KEY (public key, protected by RLS)
- ✅ VITE_SUPABASE_URL (public URL)

These should NEVER be exposed (but you shared them):

- 🔴 VITE_SUPABASE_SERVICE_ROLE_KEY (has full admin access!)
- 🔴 VITE_RESEND_API_KEY
- 🔴 VITE_GOOGLE_CLIENT_SECRET

---

## ✅ Verification

After setting all secrets, verify:

```bash
gh secret list

# Should show:
NETLIFY_AUTH_TOKEN              ✅
NETLIFY_SITE_ID                 ✅
SUPABASE_ACCESS_TOKEN           ✅
SUPABASE_DB_PASSWORD            ✅
SUPABASE_PROJECT_REF            ✅
VITE_GA_MEASUREMENT_ID          ✅
VITE_GTM_ID                     ✅
VITE_RESEND_API_KEY             ✅
VITE_SENTRY_DSN                 ✅
VITE_SUPABASE_ANON_KEY          ✅
VITE_SUPABASE_SERVICE_ROLE_KEY  ✅
VITE_SUPABASE_URL               ✅
```

---

## 🚀 Next Steps

1. **Set remaining secrets** (Netlify and Supabase tokens above)
2. **Rotate exposed secrets** (Resend, Google Client Secret, Service Role Key)
3. **Test deployment:**
   ```bash
   git commit --allow-empty -m "test: trigger CI/CD"
   git push origin main
   gh run watch
   ```

---

**DO NOT SHARE THESE CREDENTIALS AGAIN IN PLAIN TEXT!**
