# Branching Strategy

## Overview

This project uses a simple two-branch Git workflow for organized development and stable releases.

## Branch Structure

### 🔒 `main` - Production Branch
- **Purpose**: Stable, production-ready code
- **Protection**: Should be protected (no direct pushes)
- **Deployment**: Auto-deploys to Vercel production
- **Updates**: Only via Pull Requests from `dev`

**Rules:**
- ✅ Always deployable
- ✅ Thoroughly tested code only
- ✅ All PRs must be reviewed
- ❌ No direct commits (except initial setup)
- ❌ No work-in-progress code

### 🚀 `dev` - Development Branch
- **Purpose**: Active development and feature integration
- **Base**: Create all feature branches from `dev`
- **Testing**: Integration testing happens here
- **Deployment**: Can deploy to staging/preview environment

**Rules:**
- ✅ Active development
- ✅ Feature branches merge here first
- ✅ Must be stable before merging to `main`
- ⚠️ May contain incomplete features

## Workflow

### 1. Starting New Work

```bash
# Make sure you're on dev and up to date
git checkout dev
git pull origin dev

# Create a feature branch
git checkout -b feature/your-feature-name
```

### 2. Working on Features

```bash
# Make your changes
git add .
git commit -m "feat: description of changes"

# Push your feature branch
git push -u origin feature/your-feature-name
```

### 3. Merging to Dev

```bash
# Option 1: Via GitHub Pull Request (Recommended)
# 1. Push your feature branch
# 2. Open PR on GitHub: feature/your-feature -> dev
# 3. Request review (optional for solo projects)
# 4. Merge PR

# Option 2: Direct merge (for solo development)
git checkout dev
git merge feature/your-feature-name
git push origin dev
```

### 4. Releasing to Production

```bash
# When dev is stable and ready for production:
# 1. Open PR on GitHub: dev -> main
# 2. Review all changes
# 3. Merge PR
# 4. Vercel auto-deploys to production
```

## Branch Naming Conventions

### Feature Branches
```
feature/user-authentication
feature/profile-page
feature/post-crud
feature/real-time-notifications
```

### Bug Fix Branches
```
bugfix/login-redirect-loop
bugfix/image-upload-error
```

### Hotfix Branches (urgent production fixes)
```
hotfix/critical-security-patch
hotfix/payment-gateway-error
```

### Experimental Branches
```
experiment/new-ui-design
experiment/performance-optimization
```

## Common Commands

### Switch Branches
```bash
git checkout main          # Switch to main
git checkout dev           # Switch to dev
git checkout -b feature/x  # Create and switch to new branch
```

### Keep Branches Updated
```bash
# Update dev with latest from main
git checkout dev
git pull origin main
git push origin dev

# Update your feature branch with latest dev
git checkout feature/your-feature
git merge dev
# Or use rebase for cleaner history:
git rebase dev
```

### Delete Branches
```bash
# Delete local branch
git branch -d feature/your-feature

# Delete remote branch
git push origin --delete feature/your-feature
```

## Pull Request Guidelines

### Creating a PR

**Title Format:**
```
feat: Add user authentication
fix: Resolve login redirect loop
refactor: Simplify database queries
docs: Update setup instructions
```

**PR Template:**
```markdown
## What
Brief description of changes

## Why
Reason for changes

## Changes
- List of specific changes
- Another change
- One more change

## Testing
- [ ] Tested on web app
- [ ] Tested on mobile app
- [ ] Unit tests pass
- [ ] Build succeeds

## Screenshots (if UI changes)
[Attach screenshots]
```

### Reviewing PRs

**Before Merging:**
- ✅ Code review completed
- ✅ Tests pass
- ✅ Build succeeds
- ✅ No merge conflicts
- ✅ Documentation updated (if needed)

## GitHub Branch Protection (Recommended)

To set up branch protection for `main`:

1. Go to GitHub repo → Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - ✅ Require pull request before merging
   - ✅ Require status checks to pass (Vercel build)
   - ✅ Require branches to be up to date

## Vercel Deployment

### Automatic Deployments

**Production (main branch):**
- URL: `https://your-app.vercel.app`
- Deploys on every push/merge to `main`

**Preview (dev branch & feature branches):**
- URL: `https://your-app-[branch-name].vercel.app`
- Unique URL for each branch
- Great for testing before merging

### Manual Deployment Trigger

```bash
# Trigger Vercel deployment
git commit --allow-empty -m "Deploy to Vercel"
git push
```

## Best Practices

### ✅ Do

- Always create feature branches from `dev`
- Write clear, descriptive commit messages
- Keep feature branches small and focused
- Pull latest changes before starting work
- Test locally before pushing
- Delete branches after merging
- Use meaningful branch names

### ❌ Don't

- Don't commit directly to `main`
- Don't commit broken code to `dev`
- Don't leave stale branches
- Don't force push to shared branches
- Don't commit sensitive data (.env files)
- Don't merge without testing

## Typical Development Cycle

```
1. Start:        main ─┬─ dev ─┬─ feature/x
                       │       │
2. Develop:            │       └─ [commits]
                       │       │
3. Merge to dev:       │       └─→ dev
                       │           │
4. Test in dev:        │       [testing]
                       │           │
5. Release:            └───────────┴─→ main (production)
```

## Questions?

- Check commit history: `git log --oneline --graph --all`
- View branch status: `git status`
- See all branches: `git branch -a`
- Compare branches: `git diff main..dev`

## Resources

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
