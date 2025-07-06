# Production Deployment Checklist

This checklist ensures DankDeals is properly configured for production deployment.

## 🔐 Security Configuration

### Environment Variables
- [ ] Remove all placeholder values from production `.env`
- [ ] Verify `VITE_SUPABASE_URL` is set to production URL
- [ ] Verify `VITE_SUPABASE_ANON_KEY` is set to production key
- [ ] Set `VITE_ENV=production`
- [ ] Configure `VITE_ADMIN_EMAIL` (default: admin@dankdealsmn.com)
- [ ] Never commit production `.env` files to version control

### Supabase Security
- [ ] Enable Row Level Security (RLS) on ALL tables
- [ ] Verify RLS policies are properly configured
- [ ] Enable email confirmation for production auth
- [ ] Configure proper CORS settings in Supabase
- [ ] Review and restrict database permissions
- [ ] Enable SSL enforcement
- [ ] Set up proper backup retention

### Application Security
- [ ] Review Content Security Policy headers
- [ ] Ensure HTTPS is enforced (HSTS header configured)
- [ ] Verify admin access is restricted to configured email
- [ ] Test rate limiting on authentication endpoints
- [ ] Ensure all user inputs are validated
- [ ] Verify CSRF protection is active

## 📊 Monitoring & Analytics

### Error Tracking (Recommended)
- [ ] Sign up for Sentry account
- [ ] Set `VITE_SENTRY_DSN` in production env
- [ ] Set `VITE_SENTRY_ENVIRONMENT=production`
- [ ] Test error reporting works
- [ ] Configure alert thresholds

### Analytics (Recommended)  
- [ ] Sign up for Plausible.io account
- [ ] Set `VITE_PLAUSIBLE_DOMAIN` to your domain
- [ ] Add Plausible script to site
- [ ] Verify analytics are tracking

### Health Monitoring
- [ ] Set up uptime monitoring for `/health` endpoint
- [ ] Configure alerts for service degradation
- [ ] Test health check endpoints:
  - `/health` - HTML view
  - `/health?format=simple` - Plain text status
  - `/health?format=json` - JSON response

## 🗄️ Database Setup

### Migrations
Run migrations in this exact order:
1. [ ] `20241201000001_create_core_tables.sql`
2. [ ] `20241201000002_create_checkout_tables.sql`
3. [ ] `20241201000003_seed_sample_data.sql` (skip for production)
4. [ ] `20241201000004_create_admin_roles.sql`
5. [ ] `20241201000005_create_user_tables.sql`

### Database Configuration
- [ ] Enable automatic backups
- [ ] Configure backup retention (recommended: 30 days)
- [ ] Test backup restoration process
- [ ] Set up connection pooling if needed
- [ ] Monitor database performance

## 🚀 Deployment Configuration

### Build Process
- [ ] Run production build: `npm run build`
- [ ] Verify no build errors
- [ ] Check bundle sizes are reasonable
- [ ] Test production build locally: `npm run preview`

### Hosting Platform (Vercel/Netlify)
- [ ] Set all environment variables in platform dashboard
- [ ] Configure custom domain with SSL
- [ ] Set up proper redirects (SPA routing)
- [ ] Configure caching headers (already in `_headers` and `vercel.json`)
- [ ] Enable compression (Brotli/Gzip)

### Performance
- [ ] Run Lighthouse audit (target: 90+ scores)
- [ ] Verify images are optimized
- [ ] Check JavaScript bundle splitting works
- [ ] Test lazy loading functionality
- [ ] Verify CDN is configured for static assets

## ✅ Pre-Launch Testing

### Functional Testing
- [ ] Test user registration/login flow
- [ ] Verify age verification works
- [ ] Test product browsing and search
- [ ] Complete full checkout process
- [ ] Verify delivery zone restrictions
- [ ] Test admin dashboard access
- [ ] Verify all admin functions work

### Cross-Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Load Testing
- [ ] Test with expected concurrent users
- [ ] Verify database connection pooling
- [ ] Check API rate limits are appropriate
- [ ] Monitor server response times

## 📋 Legal Compliance

### Minnesota Cannabis Requirements
- [ ] Age verification (21+) prominently displayed
- [ ] Delivery zone restrictions enforced
- [ ] Cash-only payment clearly stated
- [ ] Legal disclaimers visible
- [ ] Terms of service updated
- [ ] Privacy policy compliant

### Data Protection
- [ ] GDPR compliance if serving EU users
- [ ] User data deletion functionality
- [ ] Data export functionality
- [ ] Cookie consent (if using cookies)
- [ ] Privacy policy accessible

## 🔄 Post-Launch

### Monitoring
- [ ] Set up daily health check reports
- [ ] Configure error rate alerts
- [ ] Monitor database performance
- [ ] Track user analytics
- [ ] Review security logs regularly

### Maintenance Plan
- [ ] Document deployment process
- [ ] Create rollback procedures
- [ ] Schedule regular security updates
- [ ] Plan for scaling strategy
- [ ] Set up automated backups verification

## 📞 Support Readiness

### Documentation
- [ ] Admin guide is complete
- [ ] API documentation updated
- [ ] Troubleshooting guide prepared
- [ ] Contact information updated

### Team Preparation
- [ ] Admin users created and trained
- [ ] Support email configured
- [ ] Incident response plan ready
- [ ] On-call schedule established

---

## Quick Commands

```bash
# Build for production
npm run build

# Test production build locally
npm run preview

# Run all tests
npm test

# Check bundle size
npm run analyze

# Validate environment
node -e "require('./src/lib/env').validateEnv()"
```

## Emergency Contacts

- **Admin Email**: admin@dankdealsmn.com
- **Supabase Support**: https://supabase.com/support
- **Hosting Support**: [Your hosting provider support]

---

✅ **Ready for Production**: Complete all items above before going live! 