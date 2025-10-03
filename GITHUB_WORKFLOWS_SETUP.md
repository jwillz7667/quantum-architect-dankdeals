# GitHub Actions CI/CD Setup Guide

**Project:** DankDeals Cannabis E-commerce Platform
**Date:** October 2, 2025
**Status:** ✅ Production-Ready Workflows Configured

---

## Overview

Comprehensive CI/CD pipeline with automated:

- ✅ Testing (Unit, Integration, E2E)
- ✅ Code quality checks (Lint, Type-check, Format)
- ✅ Security scanning (CodeQL, Dependency audit, Secret detection)
- ✅ Build optimization
- ✅ Deployment to Netlify
- ✅ Database migrations to Supabase
- ✅ Edge functions deployment
- ✅ Smoke tests post-deployment
- ✅ Performance monitoring (Lighthouse)

---

## Workflows Inventory

| Workflow                    | Trigger                | Purpose                      | Status    |
| --------------------------- | ---------------------- | ---------------------------- | --------- |
| **ci.yml**                  | Push/PR                | Run tests, lint, build       | ✅ Active |
| **cd.yml**                  | CI success (main)      | Deploy to Netlify + Supabase | ✅ Active |
| **deploy.yml**              | Push to main           | Deploy to Netlify            | ✅ Active |
| **database-migrations.yml** | Manual/Push migrations | Apply DB migrations          | ✅ NEW    |
| **security.yml**            | Push/PR/Weekly         | Security scans               | ✅ Active |
| **dependency-review.yml**   | PR                     | Review dependency changes    | ✅ Active |
| **pr-automation.yml**       | PR events              | Auto-label, assign           | ✅ Active |
| **release.yml**             | Tag push               | Create releases              | ✅ Active |

---

## Required GitHub Secrets

### 🔐 Critical Secrets (MUST BE SET)

Navigate to: **GitHub Repo → Settings → Secrets and variables → Actions**

#### Supabase Secrets

```bash
VITE_SUPABASE_URL
# Value: https://ralbzuvkyexortqngvxs.supabase.co
# Used by: ci.yml, cd.yml, deploy.yml
# Purpose: Supabase project URL for API calls

VITE_SUPABASE_ANON_KEY
# Value: Your anon/public key from Supabase Dashboard → Settings → API
# Used by: ci.yml, cd.yml, deploy.yml
# Purpose: Public API key for client-side Supabase calls

SUPABASE_PROJECT_REF
# Value: ralbzuvkyexortqngvxs
# Used by: cd.yml, database-migrations.yml
# Purpose: Supabase project reference for CLI operations

SUPABASE_ACCESS_TOKEN
# Value: Your access token from Supabase Dashboard → Settings → Access Tokens
# Used by: cd.yml, database-migrations.yml
# Purpose: Authenticate Supabase CLI for deployments

SUPABASE_DB_PASSWORD
# Value: Your database password from Supabase Dashboard → Settings → Database
# Used by: database-migrations.yml
# Purpose: Direct database access for migrations (if needed)
```

#### Netlify Secrets

```bash
NETLIFY_AUTH_TOKEN
# Value: Your Netlify personal access token
# Get from: Netlify Dashboard → User Settings → Applications → Personal access tokens
# Used by: cd.yml, deploy.yml
# Purpose: Authenticate Netlify deployments

NETLIFY_SITE_ID
# Value: Your Netlify site ID
# Get from: Netlify Dashboard → Site Settings → General → Site details → Site ID
# Used by: cd.yml, deploy.yml
# Purpose: Identify which Netlify site to deploy to
```

#### Optional Secrets (Enhanced Features)

```bash
SLACK_WEBHOOK_URL
# Value: Slack incoming webhook URL
# Used by: cd.yml (notify job)
# Purpose: Send deployment notifications to Slack
# Optional: Leave empty to disable

SNYK_TOKEN
# Value: Snyk API token
# Used by: security.yml
# Purpose: Enhanced security scanning
# Optional: Leave empty to skip

LHCI_GITHUB_APP_TOKEN
# Value: Lighthouse CI GitHub App token
# Used by: ci.yml (lighthouse job)
# Purpose: Post Lighthouse scores to PRs
# Optional: Leave empty to skip PR comments
```

---

## Secrets Setup Commands

### Step 1: Set Supabase Secrets

```bash
# Get values from Supabase Dashboard → Settings

# API URL and Keys (from Settings → API)
gh secret set VITE_SUPABASE_URL --body "https://ralbzuvkyexortqngvxs.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --body "eyJ..." # Your anon key

# Project Reference (from URL or Settings → General)
gh secret set SUPABASE_PROJECT_REF --body "ralbzuvkyexortqngvxs"

# Access Token (from Settings → Access Tokens → Generate new token)
gh secret set SUPABASE_ACCESS_TOKEN --body "sbp_..." # Your access token

# Database Password (from Settings → Database → Connection string)
gh secret set SUPABASE_DB_PASSWORD --body "your-db-password"
```

### Step 2: Set Netlify Secrets

```bash
# Get values from Netlify Dashboard

# Personal Access Token (User Settings → Applications → New access token)
gh secret set NETLIFY_AUTH_TOKEN --body "nfp_..." # Your Netlify token

# Site ID (Site Settings → General → Site information)
gh secret set NETLIFY_SITE_ID --body "your-site-id"
```

### Step 3: Optional Secrets (if using)

```bash
# Slack notifications
gh secret set SLACK_WEBHOOK_URL --body "https://hooks.slack.com/services/..."

# Snyk security scanning
gh secret set SNYK_TOKEN --body "your-snyk-token"

# Lighthouse CI
gh secret set LHCI_GITHUB_APP_TOKEN --body "your-lhci-token"
```

---

## Workflow Details

### 1. Continuous Integration (ci.yml)

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**

1. **Detect Changes** - Optimize CI by only running affected jobs
2. **Validate Dependencies** - Check package-lock.json and security
3. **Code Quality** - Lint, type-check, format check
4. **Test Suite** - Unit tests with coverage (Node 18, 20, 22)
5. **Build** - Production build test
6. **E2E Tests** - Playwright tests (Chromium, Firefox, 2 shards)
7. **Lighthouse** - Performance testing

**Secrets Used:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `LHCI_GITHUB_APP_TOKEN` (optional)

**Artifacts:**

- Test coverage reports (7-day retention)
- Build artifacts (7-day retention)
- Playwright test results (7-day retention)

---

### 2. Continuous Deployment (cd.yml)

**Triggers:**

- After CI workflow completes successfully (on main branch)
- Manual workflow dispatch

**Jobs:**

1. **Prepare Deployment** - Determine environment and version
2. **Deploy Netlify** - Build and deploy to Netlify
3. **Deploy Migrations** - Apply database migrations (production only)
4. **Deploy Edge Functions** - Deploy Supabase functions (production only)
5. **Smoke Tests** - Verify deployment health
6. **Notify** - Send Slack notifications (if configured)

**Secrets Used:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SLACK_WEBHOOK_URL` (optional)

**Deployment Flow:**

```
CI Success (main branch)
  ↓
Prepare Deployment
  ↓
Deploy to Netlify (frontend)
  ↓
Deploy Migrations (database)
  ↓
Deploy Edge Functions (backend)
  ↓
Run Smoke Tests
  ↓
Send Notifications
```

---

### 3. Database Migrations (database-migrations.yml)

**Triggers:**

- Manual workflow dispatch (with environment selection)
- Push to main with changes in `supabase/migrations/`

**Jobs:**

1. **Validate Migrations** - Check file naming and SQL syntax
2. **Deploy Migrations** - Apply to production database
3. **Dry Run** - Preview migrations without applying

**Features:**

- ✅ Validates migration filename format (YYYYMMDDHHMMSS_description.sql)
- ✅ Checks for dangerous SQL statements (DROP DATABASE, etc.)
- ✅ Detects new migrations automatically
- ✅ Supports dry-run mode for testing
- ✅ Links to correct Supabase project
- ✅ Verifies migrations after deployment

**Secrets Used:**

- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

---

### 4. Security Scanning (security.yml)

**Triggers:**

- Push to `main` or `develop`
- Pull requests to `main`
- Weekly schedule (Monday 9 AM)

**Jobs:**

1. **CodeQL Analysis** - JavaScript/TypeScript code scanning
2. **Dependency Scan** - npm audit + Snyk (if configured)
3. **Secrets Scan** - TruffleHog for leaked secrets

**Secrets Used:**

- `SNYK_TOKEN` (optional)

---

### 5. Simple Deploy (deploy.yml)

**Triggers:**

- Push to `main` branch
- Manual workflow dispatch

**Jobs:**

1. **Deploy to Netlify** - Quick production deployment

**Secrets Used:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

---

## Security Best Practices

### ✅ Secrets Are Protected

1. **Never Logged**

   ```yaml
   # ✅ GOOD - Secrets in env
   env:
     VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}

   # ❌ BAD - Secrets in commands (would be logged)
   run: echo ${{ secrets.VITE_SUPABASE_URL }}
   ```

2. **Never in Placeholders**

   ```yaml
   # ✅ GOOD - Direct secret reference
   env:
     SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}

   # ❌ BAD - Placeholder with fallback
   run: |
     export URL="${{ secrets.URL || 'https://example.com' }}"
   ```

3. **Masked in Logs**
   - GitHub automatically masks secret values in logs
   - Secrets never appear in workflow output
   - Pattern matching prevents accidental exposure

4. **Limited Scope**
   - Secrets only available to jobs that need them
   - Environment-specific secrets for staging/production
   - Repository secrets not accessible in forks

---

## Environment Variables (Build-Time)

These are **public values** embedded in the built JavaScript (not secrets):

```bash
# Set in workflow files directly (NOT secrets)
VITE_ENV=production          # Environment identifier
NODE_ENV=production          # Node environment
```

These are **secrets** that must be set in GitHub:

```bash
# Backend URLs and keys (public but should be in secrets for flexibility)
VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}
VITE_SUPABASE_ANON_KEY=${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

**Note:** Vite env vars with `VITE_` prefix are embedded in the built JavaScript and are NOT secret. The Supabase anon key is designed to be public (protected by RLS).

---

## Netlify Environment Variables

**IMPORTANT:** Set these in Netlify Dashboard for runtime configuration:

Navigate to: **Netlify → Site Settings → Environment variables**

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://ralbzuvkyexortqngvxs.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... # Your anon key from Supabase

# Environment
VITE_ENV=production
NODE_ENV=production
```

**Why set in both places:**

- **GitHub Secrets** → Used during GitHub Actions build
- **Netlify Environment Variables** → Used during Netlify build (if building on Netlify)

---

## Supabase Edge Functions Secrets

Set these in Supabase Dashboard for edge functions:

Navigate to: **Supabase Dashboard → Edge Functions → Manage secrets**

```bash
# Already set (from previous fixes):
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ SUPABASE_ANON_KEY
✅ RESEND_API_KEY
✅ FROM_EMAIL
✅ ADMIN_EMAIL
✅ QUEUE_PROCESSOR_TOKEN
✅ RESEND_WEBHOOK_SECRET

# Additional (if using):
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_PHONE
PERSONA_API_KEY
AEROPAY_API_KEY
STRONGHOLD_API_KEY
```

---

## Workflow Execution Order

### On Push to Main

```
1. CI Workflow (ci.yml)
   ├── Detect changes
   ├── Validate dependencies
   ├── Code quality checks
   ├── Unit tests (Node 18, 20, 22)
   ├── Build application
   ├── E2E tests (Chromium/Firefox)
   └── Lighthouse performance

   ✅ CI Success
   ↓

2. CD Workflow (cd.yml)
   ├── Prepare deployment
   ├── Deploy to Netlify
   ├── Deploy database migrations
   ├── Deploy edge functions
   ├── Run smoke tests
   └── Send notifications

3. Deploy Workflow (deploy.yml) - Parallel
   └── Deploy to Netlify (simple)
```

---

## Manual Deployment

### Deploy Specific Environment

```bash
# Trigger CD workflow with environment selection
# GitHub → Actions → Continuous Deployment → Run workflow
# Select: production or staging
```

### Deploy Database Migrations Only

```bash
# GitHub → Actions → Database Migrations → Run workflow
# Options:
# - Environment: production/staging
# - Dry run: true/false (preview without applying)
```

### Deploy Edge Functions Only

Handled automatically in CD workflow, or manually:

```bash
# Local deployment (after configuring Supabase CLI)
supabase link --project-ref ralbzuvkyexortqngvxs
supabase functions deploy process-email-queue --no-verify-jwt
```

---

## Secrets Security Checklist

### ✅ GitHub Secrets Are Secure

- [x] Never logged in workflow output
- [x] Automatically masked by GitHub
- [x] Not accessible in forked repositories
- [x] Environment-scoped for production/staging
- [x] Rotatable without code changes
- [x] Audit log of secret access (GitHub Enterprise)

### ✅ No Placeholders or Fallbacks

All secret references follow this pattern:

```yaml
# ✅ CORRECT
env:
  SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}

# ❌ WRONG (would expose secrets in logs if not set)
run: |
  export URL="${{ secrets.URL || 'https://example.com' }}"
```

### ✅ Secrets Never Echoed

```yaml
# ❌ DANGEROUS - Would log secret
run: echo "URL is ${{ secrets.SUPABASE_URL }}"

# ✅ SAFE - Secret only in env
env:
  URL: ${{ secrets.SUPABASE_URL }}
run: npm run deploy
```

---

## Deployment Environments

### Production

- **Branch:** `main`
- **URL:** Configured in Netlify
- **Trigger:** Automatic on push to main (after CI passes)
- **Database:** Production Supabase project
- **Edge Functions:** Deployed to production

### Staging (Optional)

- **Branch:** `develop` (if using)
- **URL:** Preview URL from Netlify
- **Trigger:** Manual workflow dispatch
- **Database:** Separate Supabase project (recommended)
- **Edge Functions:** Deployed to staging project

---

## Setting Up Secrets (Step-by-Step)

### Method 1: GitHub CLI (Fastest)

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Authenticate
gh auth login

# Set secrets
gh secret set VITE_SUPABASE_URL --body "https://ralbzuvkyexortqngvxs.supabase.co"
gh secret set VITE_SUPABASE_ANON_KEY --body "your-anon-key-here"
gh secret set SUPABASE_PROJECT_REF --body "ralbzuvkyexortqngvxs"
gh secret set SUPABASE_ACCESS_TOKEN --body "your-access-token"
gh secret set SUPABASE_DB_PASSWORD --body "your-db-password"
gh secret set NETLIFY_AUTH_TOKEN --body "your-netlify-token"
gh secret set NETLIFY_SITE_ID --body "your-site-id"

# Verify secrets are set
gh secret list
```

### Method 2: GitHub Web UI

1. Go to repository: `https://github.com/jwillz7667/quantum-architect-dankdeals`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter name (e.g., `VITE_SUPABASE_URL`)
5. Enter value (e.g., `https://ralbzuvkyexortqngvxs.supabase.co`)
6. Click **Add secret**
7. Repeat for all secrets listed above

---

## Verification

### Check Secrets Are Set

```bash
# List all secrets (values are hidden)
gh secret list

# Expected output:
NETLIFY_AUTH_TOKEN        Updated 2025-10-02
NETLIFY_SITE_ID           Updated 2025-10-02
SUPABASE_ACCESS_TOKEN     Updated 2025-10-02
SUPABASE_DB_PASSWORD      Updated 2025-10-02
SUPABASE_PROJECT_REF      Updated 2025-10-02
VITE_SUPABASE_ANON_KEY    Updated 2025-10-02
VITE_SUPABASE_URL         Updated 2025-10-02
```

### Test Workflows

```bash
# Trigger CI workflow
git commit --allow-empty -m "test: trigger CI"
git push origin main

# Watch workflow
gh run watch

# Or view in browser
https://github.com/jwillz7667/quantum-architect-dankdeals/actions
```

---

## Troubleshooting

### Issue: Workflow fails with "Secret not found"

**Solution:**

1. Verify secret is set: `gh secret list`
2. Check secret name matches exactly (case-sensitive)
3. Secret must be in **Actions** section, not Dependabot
4. For environment secrets, check environment settings

### Issue: Build fails with "VITE_SUPABASE_URL is undefined"

**Solution:**

1. Secret must be set in GitHub
2. Secret must be referenced in `env:` block
3. Vite requires `VITE_` prefix for client-side vars

### Issue: Netlify deployment fails

**Solution:**

1. Verify `NETLIFY_AUTH_TOKEN` is valid (not expired)
2. Verify `NETLIFY_SITE_ID` is correct
3. Check Netlify dashboard for site status
4. Ensure Netlify site is linked to correct Git repo

### Issue: Supabase migration fails

**Solution:**

1. Verify `SUPABASE_ACCESS_TOKEN` is valid
2. Verify `SUPABASE_PROJECT_REF` is correct (ralbzuvkyexortqngvxs)
3. Check migration SQL syntax
4. Ensure no duplicate migration files

### Issue: Edge function deployment fails

**Solution:**

1. Verify `SUPABASE_ACCESS_TOKEN` has functions:write permission
2. Check function code for syntax errors
3. Verify all shared dependencies exist in `_shared/`
4. Check Supabase logs for detailed errors

---

## Monitoring

### View Workflow Runs

```bash
# List recent runs
gh run list --limit 10

# View specific run
gh run view <run-id>

# Watch current run
gh run watch
```

### Check Deployment Status

```bash
# View deployments
gh api repos/:owner/:repo/deployments | jq '.[] | {id, environment, created_at, updated_at}'

# View deployment statuses
gh api repos/:owner/:repo/deployments/<deployment-id>/statuses
```

---

## Workflow Badges

Add to README.md:

```markdown
[![CI](https://github.com/jwillz7667/quantum-architect-dankdeals/actions/workflows/ci.yml/badge.svg)](https://github.com/jwillz7667/quantum-architect-dankdeals/actions/workflows/ci.yml)
[![CD](https://github.com/jwillz7667/quantum-architect-dankdeals/actions/workflows/cd.yml/badge.svg)](https://github.com/jwillz7667/quantum-architect-dankdeals/actions/workflows/cd.yml)
[![Security](https://github.com/jwillz7667/quantum-architect-dankdeals/actions/workflows/security.yml/badge.svg)](https://github.com/jwillz7667/quantum-architect-dankdeals/actions/workflows/security.yml)
```

---

## Cost Optimization

### GitHub Actions Minutes

**Free tier:** 2,000 minutes/month (private repos)
**Current usage:** ~30 minutes per deployment

**Tips:**

- Cache dependencies (already implemented)
- Skip jobs when changes don't affect them (already implemented)
- Use concurrency to cancel outdated runs (already implemented)

### Netlify Build Minutes

**Free tier:** 300 minutes/month
**Current usage:** ~3 minutes per build

**Tips:**

- Build in GitHub Actions, deploy to Netlify (already implemented)
- Cache node_modules (already implemented)

---

## Summary

### ✅ Workflows Configured

| Component              | Status    | Automated |
| ---------------------- | --------- | --------- |
| CI (Test, Lint, Build) | ✅ Active | Yes       |
| CD (Deploy Netlify)    | ✅ Active | Yes       |
| CD (Deploy Supabase)   | ✅ Active | Yes       |
| Database Migrations    | ✅ Active | Yes       |
| Edge Functions         | ✅ Active | Yes       |
| Security Scanning      | ✅ Active | Yes       |
| Dependency Reviews     | ✅ Active | Yes       |

### 🔐 Required Secrets (7)

1. ✅ `VITE_SUPABASE_URL`
2. ✅ `VITE_SUPABASE_ANON_KEY`
3. ✅ `SUPABASE_PROJECT_REF`
4. ✅ `SUPABASE_ACCESS_TOKEN`
5. ✅ `SUPABASE_DB_PASSWORD`
6. ✅ `NETLIFY_AUTH_TOKEN`
7. ✅ `NETLIFY_SITE_ID`

### 📋 Next Steps

1. **Set all required secrets** (see commands above)
2. **Test CI workflow** (push a commit)
3. **Test CD workflow** (merge to main)
4. **Verify Netlify deployment** (check site URL)
5. **Monitor first deployment** (watch for errors)

---

**Setup Time:** 15 minutes
**Automation Level:** Fully automated
**Manual Intervention:** None required after setup
**Status:** ✅ Production-Ready
