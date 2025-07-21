# CI/CD Pipeline Documentation

## Overview

This project uses a comprehensive CI/CD pipeline built with GitHub Actions, designed for reliability, performance, and security.

## Architecture

### Continuous Integration (CI)

- **File**: `.github/workflows/ci.yml`
- **Triggers**: Push to main/develop, Pull requests
- **Purpose**: Validate code quality, run tests, and build artifacts

### Continuous Deployment (CD)

- **File**: `.github/workflows/cd.yml`
- **Triggers**: Successful CI runs on main branch, Manual dispatch
- **Purpose**: Deploy to staging/production environments

### Supporting Workflows

- **Security Scanning**: `.github/workflows/security.yml`
- **Dependency Updates**: `.github/workflows/dependency-update.yml`

## CI Pipeline Stages

### 1. Change Detection

- Uses path filters to optimize pipeline runs
- Only runs necessary jobs based on what changed
- Improves CI performance and reduces costs

### 2. Dependency Validation

- Validates `package-lock.json` integrity
- Runs security audit for production dependencies
- Ensures reproducible builds

### 3. Code Quality Checks

- TypeScript type checking
- ESLint linting
- Prettier formatting validation
- Runs in parallel for speed

### 4. Test Suite

- **Matrix Testing**: Node.js 18, 20, and 22
- **Unit Tests**: Fast, isolated component tests
- **Integration Tests**: API and database tests
- **Coverage Reports**: Uploaded for tracking

### 5. Build

- Production build with optimizations
- Bundle size analysis
- Artifact creation for deployment

### 6. E2E Tests

- **Parallel Execution**: Multiple browsers and shards
- **Browsers**: Chromium, Firefox
- **Screenshots**: Captured on failure

### 7. Performance Tests

- Lighthouse CI for performance metrics
- Core Web Vitals monitoring
- Accessibility checks

## CD Pipeline Stages

### 1. Environment Detection

- Automatic production deploys from main
- Manual staging deploys
- Version tagging

### 2. Vercel Deployment

- Preview deployments for PRs
- Production deployments for main
- Environment-specific configurations

### 3. Edge Function Deployment

- Supabase edge functions
- Only deployed to production
- Automatic JWT verification

### 4. Smoke Tests

- Post-deployment validation
- Critical path testing
- Health check verification

### 5. Notifications

- Slack notifications for deployments
- Status updates with URLs
- Failure alerts

## Required Secrets

### CI Secrets

- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `CODECOV_TOKEN`: Code coverage tracking (optional)
- `LHCI_GITHUB_APP_TOKEN`: Lighthouse CI reporting (optional)

### CD Secrets

- `VERCEL_TOKEN`: Vercel deployment token
- `SUPABASE_PROJECT_REF`: Supabase project reference
- `SUPABASE_ACCESS_TOKEN`: Supabase CLI token
- `SLACK_WEBHOOK_URL`: Slack notifications (optional)

### Security Secrets

- `SNYK_TOKEN`: Vulnerability scanning (optional)

## Local Development

### Running CI Checks Locally

```bash
# Install dependencies
npm ci

# Run all checks
npm run lint
npm run type-check
npm run format:check
npm run test:unit
npm run test:e2e

# Run Lighthouse locally
npm run lighthouse:local
```

### Docker Build

```bash
# Build Docker image
docker build -t dankdeals .

# Run container
docker run -p 3000:3000 dankdeals
```

## Performance Optimizations

1. **Caching Strategy**
   - NPM cache for dependencies
   - Build artifacts between jobs
   - Playwright browser cache

2. **Parallel Execution**
   - Matrix builds for multiple Node versions
   - Sharded E2E tests
   - Concurrent job execution

3. **Conditional Execution**
   - Path-based job filtering
   - Skip unchanged components
   - Fail-fast for critical issues

## Troubleshooting

### Common Issues

1. **Lighthouse CI Failures**
   - Check `scripts/lighthouse-server.js` exists
   - Ensure Express is installed
   - Verify build artifacts are present

2. **E2E Test Failures**
   - Check environment variables
   - Verify Playwright browsers installed
   - Review screenshots in artifacts

3. **Deployment Failures**
   - Verify Vercel token is valid
   - Check environment configurations
   - Ensure build succeeds locally

### Debug Mode

Enable debug logging by setting these secrets:

- `ACTIONS_STEP_DEBUG`: true
- `ACTIONS_RUNNER_DEBUG`: true

## Best Practices

1. **Commit Messages**
   - Use conventional commits
   - Include ticket references
   - Clear, descriptive messages

2. **Pull Requests**
   - Keep PRs focused and small
   - Include tests for new features
   - Update documentation

3. **Security**
   - Never commit secrets
   - Review dependency updates
   - Monitor security alerts

## Monitoring

### Metrics Tracked

- Build times
- Test coverage
- Bundle sizes
- Lighthouse scores
- Deployment success rate

### Alerts

- Failed deployments
- Security vulnerabilities
- Performance regressions
- Test failures

## Maintenance

### Weekly Tasks

- Review dependency updates
- Check security alerts
- Monitor performance trends

### Monthly Tasks

- Update Node.js versions
- Review and optimize workflows
- Clean up old artifacts

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Playwright Documentation](https://playwright.dev/)
