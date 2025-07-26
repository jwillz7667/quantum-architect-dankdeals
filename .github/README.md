# GitHub CI/CD Configuration for DankDeals MN

This directory contains the complete CI/CD configuration for DankDeals MN, including GitHub Actions workflows, issue templates, and Claude AI integration.

## 📋 Overview

Our CI/CD pipeline provides:

- ✅ **Automated testing** (unit, integration, E2E)
- 🔍 **Code quality checks** (linting, type checking, formatting)
- 🤖 **AI-powered code reviews** with Claude
- 🚀 **Automated deployments** to staging and production
- 🔒 **Security scanning** and dependency monitoring
- ⚡ **Performance monitoring** with Lighthouse
- 🛡️ **Dependency management** with automated updates

## 🔄 Workflows

### Core CI/CD Workflows

#### 1. `ci.yml` - Continuous Integration

**Triggers**: Push to `main`/`develop`, Pull Requests

- ✅ Dependency validation and security audit
- 🔍 Code quality checks (lint, type-check, format)
- 🧪 Test suite across multiple Node.js versions
- 🏗️ Build verification
- 🎭 E2E testing with Playwright
- 🚀 Lighthouse performance audits

#### 2. `cd.yml` - Continuous Deployment

**Triggers**: After successful CI on `main`, Manual dispatch

- 🚀 Automated deployment to Vercel
- 🔧 Supabase Edge Functions deployment
- 💨 Post-deployment smoke tests
- 📊 Deployment status tracking
- 📱 Slack notifications

#### 3. `environment-management.yml` - Environment Management

**Triggers**: Manual workflow dispatch

- 🎯 Targeted environment deployments
- 🔄 Production rollback capabilities
- 🔧 Staging environment refresh
- ✅ Pre-deployment validation
- 📈 Post-deployment verification

### AI Integration Workflows

#### 4. `claude.yml` - Claude AI Assistant

**Triggers**: `@claude` mentions in issues/PRs

- 🤖 Interactive AI assistance
- 🔧 Automated command execution
- 💡 Context-aware suggestions
- 🎯 Project-specific guidance

#### 5. `claude-code-review.yml` - Automated Code Review

**Triggers**: Pull request creation/updates

- 🔍 Automated code quality review
- 🛡️ Security vulnerability detection
- ⚡ Performance impact analysis
- 📝 Constructive feedback generation

### Quality & Security Workflows

#### 6. `performance-security.yml` - Performance & Security Monitoring

**Triggers**: Push to `main`, PRs, Daily schedule

- 🔒 Security scanning with Semgrep and CodeQL
- 📦 Bundle size analysis
- ♿ Accessibility testing with axe
- 🛡️ Dependency vulnerability review

#### 7. `auto-dependency-update.yml` - Automated Dependency Updates

**Triggers**: Weekly schedule, Manual dispatch

- 📦 Automated dependency updates
- 🤖 Claude-powered update analysis
- 🧪 Automated testing after updates
- 🔒 Security audit of updated packages

#### 8. `security.yml` - Security Monitoring

**Triggers**: Various security events

- 🔐 CodeQL security analysis
- 🛡️ Dependency security scanning
- 📊 Security advisory monitoring

#### 9. `dependency-update.yml` - Dependency Management

**Triggers**: Dependabot events

- 📦 Dependency update validation
- 🧪 Automated testing for updates
- 🤖 AI-assisted review of changes

## 🎭 Issue Templates

### Bug Report (`bug_report.yml`)

Structured bug reporting with:

- 🌐 Environment details (browser, device)
- 🔄 Reproduction steps
- 📱 Screenshots and console errors
- 🎯 Severity classification
- 🏷️ Affected area tagging

### Feature Request (`feature_request.yml`)

Comprehensive feature planning with:

- 💡 Problem statement and solution
- 👥 User impact analysis
- 🔧 Technical considerations
- ✅ Acceptance criteria
- 🎨 Mockup attachments

## 🤖 Claude AI Integration

### Configuration Files

#### `CLAUDE_INSTRUCTIONS.md`

Comprehensive AI assistant instructions covering:

- 🏗️ Project architecture and tech stack
- ⚖️ Cannabis industry compliance requirements
- 🔒 Security best practices
- 🎨 UI/UX guidelines
- 🧪 Testing standards
- 🚀 Deployment procedures

#### `pull_request_template.md`

PR template with Claude integration:

- 📝 Structured change documentation
- ✅ Pre-submission checklists
- 🤖 Automated Claude review requests
- 🧪 Testing requirements
- 🚀 Deployment considerations

### Claude Capabilities

The Claude AI integration can:

- **Review Code**: Analyze PRs for quality, security, and performance
- **Execute Commands**: Run tests, builds, and quality checks
- **Provide Guidance**: Offer project-specific development advice
- **Debug Issues**: Help troubleshoot problems with context
- **Generate Tests**: Suggest or write test cases
- **Security Analysis**: Identify potential vulnerabilities
- **Performance Optimization**: Suggest improvements

## 🔐 Required Secrets

Configure these secrets in GitHub repository settings:

### Vercel Deployment

```
VERCEL_TOKEN=your_vercel_token
```

### Supabase Integration

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_EMAIL=admin@dankdealsmn.com
SUPABASE_ACCESS_TOKEN=your_supabase_access_token
SUPABASE_PROJECT_REF=your_project_ref
```

### Claude AI Integration

```
CLAUDE_CODE_OAUTH_TOKEN=your_claude_oauth_token
```

### Optional Integrations

```
SLACK_WEBHOOK_URL=your_slack_webhook
LHCI_GITHUB_APP_TOKEN=lighthouse_ci_token
SEMGREP_APP_TOKEN=semgrep_token
```

## 🚀 Usage Guide

### Automated Workflows

Most workflows run automatically:

- ✅ **CI runs** on every push/PR
- 🚀 **CD runs** after successful CI on main
- 🔒 **Security scans** run daily
- 📦 **Dependency updates** run weekly

### Manual Deployments

Use environment management workflow:

```bash
# Deploy to staging
gh workflow run environment-management.yml -f action=deploy-staging

# Deploy to production
gh workflow run environment-management.yml -f action=deploy-production

# Rollback production
gh workflow run environment-management.yml -f action=rollback-production
```

### Claude AI Assistance

#### In Pull Requests

Add to PR description or comments:

```markdown
@claude Please review this PR focusing on:

- Security implications
- Performance impact
- Cannabis compliance requirements
```

#### In Issues

Mention Claude for assistance:

```markdown
@claude Can you help debug this checkout flow issue?
```

### Emergency Procedures

#### Production Issues

1. **Immediate Rollback**:

   ```bash
   gh workflow run environment-management.yml -f action=rollback-production
   ```

2. **Check Status**:
   - Vercel deployment status
   - Supabase service status
   - GitHub Actions logs

#### Security Incidents

1. Review security workflow results
2. Check CodeQL alerts
3. Run manual security audit:
   ```bash
   npm audit --audit-level=high
   ```

## 📊 Monitoring & Observability

### Performance Monitoring

- 🚀 **Lighthouse CI**: Automated performance audits
- 📦 **Bundle Analysis**: Size monitoring and optimization
- ⚡ **Core Web Vitals**: LCP, FID, CLS tracking

### Security Monitoring

- 🔒 **CodeQL**: Static security analysis
- 🛡️ **Semgrep**: OWASP and security pattern detection
- 📦 **Dependency Audit**: Vulnerability scanning
- 🔍 **License Compliance**: Open source license checking

### Quality Metrics

- 🧪 **Test Coverage**: Unit and integration test coverage
- 📏 **Code Quality**: ESLint and TypeScript compliance
- ♿ **Accessibility**: WCAG compliance checking
- 📱 **Cross-browser**: Multi-browser E2E testing

## 🛠️ Troubleshooting

### Common Issues

#### CI Failures

1. **Linting Errors**: Run `npm run lint:fix`
2. **Type Errors**: Run `npm run type-check`
3. **Test Failures**: Run `npm run test:unit` locally
4. **Build Failures**: Check environment variables

#### Deployment Issues

1. **Vercel Deploy Fails**: Check Vercel token and project settings
2. **Supabase Issues**: Verify project reference and access token
3. **Environment Variables**: Ensure all required secrets are set

#### Claude AI Issues

1. **No Response**: Check CLAUDE_CODE_OAUTH_TOKEN secret
2. **Limited Functionality**: Verify allowed_tools configuration
3. **Context Issues**: Review CLAUDE_INSTRUCTIONS.md

### Getting Help

1. **Check Workflow Logs**: GitHub Actions tab
2. **Review Documentation**: This README and CLAUDE_INSTRUCTIONS.md
3. **Ask Claude**: Mention @claude in issues for AI assistance
4. **Manual Review**: Request human code review

---

## 🎯 Quick Commands

```bash
# Local development
npm run dev                 # Start development server
npm run build              # Build for production
npm run test:unit          # Run unit tests
npm run test:e2e           # Run E2E tests
npm run lint               # Check code quality
npm run type-check         # TypeScript validation

# CI/CD operations
gh workflow run ci.yml                    # Trigger CI manually
gh workflow run environment-management.yml # Deploy environments
gh pr create --template                   # Create PR with template

# Debugging
npm run lighthouse:local    # Local performance audit
npm audit                  # Security vulnerability check
npm run analyze           # Bundle size analysis
```

This CI/CD setup ensures **high code quality**, **automated testing**, **secure deployments**, and **AI-powered assistance** for the DankDeals MN cannabis delivery platform. 🌿
