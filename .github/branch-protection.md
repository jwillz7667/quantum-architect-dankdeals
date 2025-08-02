# Branch Protection Rules

This document outlines the recommended branch protection rules for the DankDeals repository.

## Main Branch Protection

Navigate to **Settings → Branches** and add a rule for the `main` branch with these settings:

### Required Status Checks

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Required checks:
    - `CI Status`
    - `CodeQL Analysis (javascript)`
    - `CodeQL Analysis (typescript)`
    - `Semantic PR`

### Pull Request Requirements

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from CODEOWNERS
  - [x] Require approval of the most recent reviewable push

### Additional Protections

- [x] **Require conversation resolution before merging**
- [x] **Require signed commits** (optional but recommended)
- [x] **Include administrators** (recommended for consistency)
- [x] **Restrict who can push to matching branches**
  - Add specific users or teams who can push directly

### Force Push Protection

- [x] **Do not allow force pushes**
- [x] **Do not allow deletions**

## Develop Branch Protection (if used)

For a `develop` branch, use similar but slightly relaxed rules:

### Required Status Checks

- [x] **Require status checks to pass before merging**
  - Required checks:
    - `quality-checks`
    - `test-suite (20)`

### Pull Request Requirements

- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**
  - [ ] Dismiss stale pull request approvals (optional)

### Additional Protections

- [x] **Do not allow force pushes**
- [x] **Do not allow deletions**

## Automated Merge Rules

### Dependabot Auto-merge Criteria

- **Patch updates**: Auto-merge after CI passes
- **Minor updates**: Require manual approval
- **Major updates**: Require manual approval and testing

## GitHub Settings

### General Repository Settings

1. **Features**:
   - [x] Issues
   - [x] Projects
   - [x] Wiki (optional)
   - [ ] Sponsorships
   - [x] Preserve this repository
   - [x] Discussions (optional)

2. **Pull Requests**:
   - [x] Allow squash merging
   - [x] Allow merge commits
   - [ ] Allow rebase merging (to maintain linear history)
   - [x] Always suggest updating pull request branches
   - [x] Allow auto-merge
   - [x] Automatically delete head branches

3. **General**:
   - Default branch: `main`
   - [x] Require contributors to sign off on web-based commits

## CODEOWNERS File

Create a `.github/CODEOWNERS` file:

```
# Global owners
* @jwillz7667

# Frontend
/src/ @jwillz7667
/public/ @jwillz7667

# Backend/Database
/supabase/ @jwillz7667

# CI/CD
/.github/ @jwillz7667

# Documentation
*.md @jwillz7667
/docs/ @jwillz7667
```

## Security Policies

1. **Security Policy**: Create a `SECURITY.md` file
2. **Private vulnerability reporting**: Enable in Settings → Security
3. **Dependabot security updates**: Enable automatic security updates
4. **Code scanning**: Already configured via CodeQL

## Recommended Webhooks

Consider adding webhooks for:

- Deployment notifications
- Slack/Discord integration for PR/Issue notifications
- External CI/CD services

## Environment Protection Rules

For production deployments:

1. Go to **Settings → Environments → production**
2. Configure:
   - [x] Required reviewers
   - [x] Wait timer (optional, e.g., 5 minutes)
   - [x] Restrict deployment branches to `main` only
   - Add deployment protection rules

## Implementation Checklist

- [ ] Configure main branch protection
- [ ] Set up CODEOWNERS file
- [ ] Enable Dependabot security updates
- [ ] Configure environment protection
- [ ] Set up required webhooks
- [ ] Document any custom rules in team wiki
