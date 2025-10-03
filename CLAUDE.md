# Project Setup Guide

## Overview
This document provides the complete setup instructions for our cross-platform application project. You have accounts ready for all required services.

## Tech Stack

### Frontend
- **Web App**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Mobile App**: React Native with Expo, TypeScript

### Backend
- **Supabase**: PostgreSQL database, Authentication, Storage, Real-time, Edge Functions

### DevOps
- **Version Control**: GitHub
- **Web Deployment**: Vercel (auto-deploy from GitHub)
- **Development Tools**: Cursor IDE, Claude Code CLI

## Initial Setup Steps

### 1. Repository Setup (GitHub)

```bash
# Create new repository on GitHub (if not done yet)
# Then clone locally
git clone [your-repo-url]
cd [your-project-name]

# Create monorepo structure
mkdir web-app mobile-app shared
```

### 2. Web App Setup (Next.js)

```bash
cd web-app
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# Install Supabase client
npm install @supabase/supabase-js @supabase/ssr

# Install additional dependencies
npm install zod react-hook-form @hookform/resolvers

# Install shadcn/ui (after initial setup)
npx shadcn@latest init
```

**Create environment files:**

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**shadcn/ui Setup:**

When running `npx shadcn@latest init`, configure:
- Style: **Default**
- Base color: **Slate** (or your preference)
- CSS variables: **Yes**

Add components as needed:
```bash
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add form
# See https://ui.shadcn.com for all components
```

**Recommended folder structure:**
```
web-app/
├── src/
│   ├── app/              # Next.js pages (App Router)
│   ├── components/       # Reusable components
│   │   ├── ui/          # shadcn/ui components (auto-generated)
│   │   └── features/    # Feature-specific components
│   ├── lib/             # Utilities and configurations
│   │   ├── supabase/    # Supabase client setup
│   │   └── utils.ts     # Helper functions (includes cn utility)
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   └── services/        # API services and data fetching
├── public/              # Static assets
└── .env.local          # Environment variables
```

### 3. Mobile App Setup (React Native + Expo)

```bash
cd ../mobile-app
npx create-expo-app@latest . --template blank-typescript

# Install Supabase
npm install @supabase/supabase-js

# Install navigation
npm install @react-navigation/native @react-navigation/native-stack
npx expo install react-native-screens react-native-safe-area-context

# Install async storage for auth persistence
npx expo install @react-native-async-storage/async-storage

# Install additional UI libraries (optional)
npm install react-native-reanimated
```

**Create environment configuration:**

`app.config.js`:
```javascript
export default {
  expo: {
    name: "Your App Name",
    slug: "your-app-slug",
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    }
  }
}
```

`.env`:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Recommended folder structure:**
```
mobile-app/
├── src/
│   ├── screens/         # Screen components
│   ├── components/      # Reusable components
│   ├── navigation/      # Navigation configuration
│   ├── lib/            # Utilities and configurations
│   │   └── supabase.ts # Supabase client setup
│   ├── hooks/          # Custom hooks
│   ├── types/          # TypeScript types
│   └── services/       # API services
├── assets/             # Images, fonts, etc.
├── app.config.js       # Expo configuration
└── .env               # Environment variables
```

### 4. Shared Code Setup (Optional but Recommended)

```bash
cd ../shared
npm init -y
npm install typescript --save-dev

# Create shared types, utilities, validation schemas
mkdir src
mkdir src/types src/utils src/validations
```

This folder can contain:
- Shared TypeScript types
- Validation schemas (Zod)
- Business logic utilities
- Constants and configuration

### 5. Supabase Configuration

**In Supabase Dashboard:**

1. **Database Schema**
   - Create tables for your application
   - Set up Row Level Security (RLS) policies
   - Create database functions if needed

2. **Authentication**
   - Enable email/password authentication
   - Configure OAuth providers if needed
   - Set up email templates
   - Configure redirect URLs:
     - Web: `http://localhost:3000/auth/callback` (dev), `https://yourdomain.com/auth/callback` (prod)
     - Mobile: Configure deep linking

3. **Storage**
   - Create storage buckets (e.g., `avatars`, `uploads`)
   - Set up storage policies

4. **API Keys**
   - Copy project URL and anon key to your `.env` files
   - Keep service_role key secure (never expose to frontend)

### 6. Vercel Setup

**Connect GitHub Repository:**
1. Go to Vercel dashboard
2. Import your GitHub repository
3. Select the `web-app` directory as root directory
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy

**Configure:**
- Framework Preset: Next.js
- Root Directory: `web-app`
- Build Command: `npm run build`
- Output Directory: `.next`

### 7. Development Tools Setup

**Cursor IDE:**
- Open project in Cursor
- Configure workspace settings
- Install recommended extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and React snippets

**Claude Code:**
```bash
# Install Claude Code (if not already installed)
# Follow instructions at https://docs.claude.com/en/docs/claude-code

# Configure for your project
# Add .claude-code config file if needed
```

### 8. Git Configuration & Best Practices

**Create `.gitignore` in root:**
```
# Dependencies
node_modules/
.pnp
.pnp.js

# Environment variables
.env
.env.local
.env*.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
.next/
out/
build/
dist/

# Expo
.expo/
.expo-shared/

# IDE
.vscode/
.idea/
*.swp
*.swo
.cursor/

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# Testing
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
.cache/
```

**Initial commit:**
```bash
git add .
git commit -m "Initial project setup"
git push origin main
```

## Local vs Git Repository Best Practices

### What Belongs in Git ✅

**Configuration Files:**
- `package.json` and `package-lock.json` / `yarn.lock`
- TypeScript config: `tsconfig.json`
- Build configs: `next.config.js`, `app.config.js`
- Linting: `.eslintrc.json`, `.prettierrc`
- Git: `.gitignore`, `.gitattributes`

**Source Code:**
- All `.ts`, `.tsx`, `.js`, `.jsx` files
- Component files
- Screens and pages
- Services and utilities
- Type definitions

**Assets (with considerations):**
- Small icons and logos (< 100KB)
- SVG files
- Design system assets
- Commit large images cautiously - consider external storage

**Documentation:**
- `README.md`
- `PROJECT_SETUP.md`
- `CONTRIBUTING.md`
- Code comments and JSDoc

**Tests:**
- All test files (`*.test.ts`, `*.spec.ts`)
- Test utilities and mocks
- E2E test configurations

**CI/CD:**
- GitHub Actions workflows (`.github/workflows/`)
- Vercel configuration
- Build scripts

**Database:**
- Schema definitions
- Migration files (Supabase migrations)
- Seed data scripts (not actual data)

### What NEVER Goes in Git ❌

**Environment Variables:**
- `.env` files with secrets
- API keys (Supabase, third-party services)
- Database passwords
- OAuth client secrets
- **Instead:** Use `.env.example` template files

**Build Artifacts:**
- `node_modules/` (always regenerate)
- `.next/`, `out/`, `build/`, `dist/`
- `.expo/`, `.expo-shared/`
- Compiled files

**User-Specific Settings:**
- `.vscode/settings.json` (personal preferences)
- `.idea/` (IntelliJ settings)
- OS files (`.DS_Store`, `Thumbs.db`)

**Large Binary Files:**
- User-uploaded images/videos
- Large datasets
- Database dumps
- **Instead:** Use Git LFS or cloud storage (Supabase Storage)

**Sensitive Data:**
- User data or PII
- Authentication tokens
- API response caches
- Session data

**Temporary Files:**
- Logs (`*.log`)
- Cache folders
- Temp folders
- Debug output

### Environment Variables Strategy

**Create `.env.example` files (commit these):**

```bash
# web-app/.env.example
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
# Add other variables your app needs
```

```bash
# mobile-app/.env.example
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_anon_key_here
```

**Actual `.env` files (DO NOT commit):**
- Keep these local only
- Add to `.gitignore`
- Share securely with team (1Password, encrypted channels)
- Document in README how to get credentials

### Git Workflow Best Practices

**Branch Strategy:**
```bash
main              # Production-ready code (protected)
├── develop       # Development branch (optional)
├── feature/auth  # Feature branches
├── feature/posts
├── bugfix/login-error
└── hotfix/critical-bug
```

**Commit Messages:**
```bash
# Good commits ✅
git commit -m "feat: add user authentication with Supabase"
git commit -m "fix: resolve login redirect loop"
git commit -m "refactor: extract auth logic to service layer"
git commit -m "docs: update setup instructions"
git commit -m "test: add unit tests for auth service"

# Bad commits ❌
git commit -m "updates"
git commit -m "fix stuff"
git commit -m "wip"
```

**Commit Conventions (Optional but Recommended):**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**When to Commit:**
```bash
# Commit frequently ✅
- After completing a small feature
- After fixing a bug
- Before switching tasks
- At logical stopping points
- Before trying risky changes

# Don't commit ❌
- Broken/non-working code to main
- Commented-out code blocks
- console.log debugging statements
- Temporary test files
```

**Pull Request Best Practices:**
```bash
# Before creating PR
1. Pull latest from main: git pull origin main
2. Resolve conflicts locally
3. Test thoroughly
4. Review your own changes
5. Write clear PR description

# PR Description Template:
## What
Brief description of changes

## Why
Reason for changes

## How to Test
1. Step one
2. Step two

## Screenshots (if UI changes)
[Attach screenshots]
```

### Working with Team Members

**Pulling Changes:**
```bash
# Stay up to date
git pull origin main        # Pull main branch
git fetch --all            # Fetch all branches

# Before starting work
git checkout main
git pull origin main
git checkout -b feature/new-feature

# Regularly sync during development
git checkout main
git pull origin main
git checkout feature/new-feature
git merge main  # or git rebase main
```

**Handling Merge Conflicts:**
```bash
# When conflict occurs
1. Don't panic
2. Open conflicted files
3. Look for <<<<<<< HEAD markers
4. Decide which code to keep
5. Remove conflict markers
6. Test the merged code
7. git add [resolved-files]
8. git commit
```

**Code Review Guidelines:**
- Review within 24 hours
- Be constructive, not critical
- Ask questions, don't just comment
- Test the changes locally
- Approve only when confident

### Local Development Workflow

**Daily Workflow:**
```bash
# Morning routine
1. git checkout main
2. git pull origin main
3. git checkout -b feature/your-feature
4. npm install  # Update dependencies if needed

# During development
5. Make changes
6. Test locally (npm run dev)
7. Commit frequently to your branch
8. git push origin feature/your-feature

# End of day
9. Push your branch (even if incomplete)
10. Open draft PR for feedback (optional)
```

**Testing Before Push:**
```bash
# Web app
cd web-app
npm run build      # Ensure it builds
npm run lint       # Check for errors
npm run test       # Run tests (if configured)

# Mobile app  
cd mobile-app
npx expo start     # Ensure it runs
# Test on device/simulator
```

**When Things Go Wrong:**
```bash
# Discard local changes
git checkout -- [file]           # Single file
git reset --hard HEAD            # All files (careful!)

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Stash changes temporarily
git stash                        # Save changes
git stash pop                    # Restore changes
git stash list                   # View stashed changes

# Recover deleted branch
git reflog                       # Find commit
git checkout -b branch-name [commit-hash]
```

### Recommended Git Tools

**Mac Tools:**
- **Tower** or **GitKraken** - Visual Git clients
- **GitHub Desktop** - Simple, beginner-friendly
- **VS Code / Cursor** - Built-in Git integration
- **tig** - Terminal Git browser (`brew install tig`)

**Command Line Aliases:**
```bash
# Add to ~/.zshrc or ~/.bashrc
alias gs='git status'
alias ga='git add'
alias gc='git commit -m'
alias gp='git push'
alias gl='git pull'
alias gco='git checkout'
alias gb='git branch'
alias glog='git log --oneline --graph --all'
```

### Repository Structure Best Practices

**Recommended Monorepo Structure:**
```
your-project/
├── .github/
│   └── workflows/          # CI/CD pipelines
├── web-app/               # Next.js app
├── mobile-app/            # React Native app
├── shared/                # Shared code
├── docs/                  # Documentation
├── .gitignore            # Global gitignore
├── README.md             # Project overview
└── PROJECT_SETUP.md      # This file
```

**Each app should have:**
```
app-folder/
├── src/                  # Source code
├── public/ or assets/    # Static files
├── __tests__/           # Tests
├── .env.example         # Template for env vars
├── package.json         # Dependencies
├── README.md            # App-specific docs
└── tsconfig.json        # TypeScript config
```

### Security Checklist

Before pushing to Git:
- [ ] No API keys or secrets in code
- [ ] `.env` files are in `.gitignore`
- [ ] No hardcoded passwords
- [ ] No PII or user data
- [ ] No AWS/cloud credentials
- [ ] Review `git diff` before committing
- [ ] Check for accidentally added files

**Quick Security Scan:**
```bash
# Search for potential secrets
git diff | grep -i "password\|secret\|key\|token"

# Check what's being committed
git diff --cached
```

## Development Workflow

### Running Locally

**Web App:**
```bash
cd web-app
npm run dev
# Visit http://localhost:3000
```

**Mobile App:**
```bash
cd mobile-app
npx expo start
# Scan QR code with Expo Go app
# Or press 'i' for iOS simulator, 'a' for Android emulator
```

### Using Claude Code (Parallel Thinking Approach)

Claude Code is best for:
- Building complete features across web and mobile simultaneously
- Generating consistent component systems
- Creating API routes and server actions
- Setting up database schemas and migrations
- Writing tests
- Implementing features with shared code

**Parallel Thinking Philosophy:**
Instead of building web and mobile separately, think of them as **two views of the same system**. Build complete feature modules that include web screens, mobile screens, shared services, types, and validation all at once.

**Example Commands (Parallel Approach):**

```bash
# Complete Authentication Feature
claude "Create complete user authentication system:

WEB APP (Next.js):
- /app/login/page.tsx - login form with email/password
- /app/signup/page.tsx - signup form with validation
- /app/reset-password/page.tsx - password reset flow
- /app/auth/callback/route.ts - Supabase auth callback handler

MOBILE APP (React Native):
- src/screens/LoginScreen.tsx - login UI with keyboard handling
- src/screens/SignupScreen.tsx - signup UI with validation
- src/screens/ResetPasswordScreen.tsx - password reset flow
- src/navigation/AuthNavigator.tsx - auth stack navigator

SHARED CODE:
- shared/src/services/auth.ts - Supabase auth functions (login, signup, logout, resetPassword, getSession)
- shared/src/types/user.ts - User, Session, AuthError TypeScript types
- shared/src/validation/auth.ts - Zod schemas for login, signup, reset forms

REQUIREMENTS:
- Use Tailwind CSS for web styling
- Use React Native components for mobile
- Handle loading, error, and success states
- Password must be 8+ characters with one uppercase and one number
- Email validation with proper error messages
- Consistent UX and error handling across platforms
- Remember me functionality
- Auto-focus first input field"
```

```bash
# Complete Profile Feature
claude "Create user profile management:

WEB APP:
- /app/profile/page.tsx - view profile with edit button
- /app/profile/edit/page.tsx - edit profile form
- /components/features/AvatarUpload.tsx - avatar upload component

MOBILE APP:
- src/screens/ProfileScreen.tsx - view profile
- src/screens/EditProfileScreen.tsx - edit form
- src/components/AvatarUpload.tsx - image picker component

SHARED:
- shared/src/services/profile.ts - getProfile, updateProfile, uploadAvatar
- shared/src/types/profile.ts - Profile, ProfileUpdate types
- shared/src/validation/profile.ts - Zod schema for profile updates

REQUIREMENTS:
- Display: name, email, bio, avatar
- Editable: name, bio, avatar (not email)
- Avatar: image upload to Supabase Storage with size limit 2MB
- Form validation with helpful error messages
- Optimistic updates for better UX
- Pull-to-refresh on mobile"
```

```bash
# Complete CRUD for Posts
claude "Create full posts system:

WEB APP:
- /app/feed/page.tsx - posts feed with infinite scroll
- /app/posts/[id]/page.tsx - single post detail
- /app/posts/create/page.tsx - create post form
- /components/features/PostCard.tsx - reusable post card

MOBILE APP:
- src/screens/FeedScreen.tsx - posts feed with pull-to-refresh
- src/screens/PostDetailScreen.tsx - single post
- src/screens/CreatePostScreen.tsx - create post
- src/components/PostCard.tsx - reusable post card

SHARED:
- shared/src/services/posts.ts - getPosts, getPost, createPost, updatePost, deletePost
- shared/src/types/post.ts - Post, CreatePost, UpdatePost types
- shared/src/validation/post.ts - Zod schemas for post operations

REQUIREMENTS:
- Posts have: title, content, author, createdAt, image (optional)
- Feed: paginated, 10 per page, newest first
- Image upload to Supabase Storage
- Like/unlike functionality
- Delete only own posts
- Real-time updates using Supabase Realtime
- Loading skeletons"
```

```bash
# Design System Components
claude "Create reusable component library:

WEB APP (src/components/ui/):
- Button.tsx - variants: primary, secondary, ghost, danger; sizes: sm, md, lg
- Input.tsx - types: text, email, password, textarea
- Card.tsx - with optional header, body, footer slots
- Modal.tsx - accessible dialog with backdrop
- Alert.tsx - variants: success, error, warning, info

MOBILE APP (src/components/ui/):
- Button.tsx - same variants, adapted for touch
- Input.tsx - with proper keyboard types
- Card.tsx - with TouchableOpacity for interactions
- Modal.tsx - using React Native Modal
- Alert.tsx - same variants

SHARED:
- shared/src/types/ui.ts - shared prop types and variants

REQUIREMENTS:
- Full TypeScript with strict prop types
- Consistent design tokens (colors, spacing, typography)
- Accessibility: proper labels, focus states, ARIA attributes
- Loading and disabled states for interactive elements
- Web: Tailwind CSS classes
- Mobile: StyleSheet with design tokens
- All components should feel native to their platform"
```

**When to Use Sequential (One-at-a-time) vs Parallel:**

**Use Sequential for:**
- Prototyping/experimenting with new ideas
- Learning new concepts or technologies
- Fixing specific bugs
- Making small isolated changes
- When requirements are unclear

**Use Parallel for:**
- Complete features (auth, profiles, posts, etc.)
- CRUD operations for an entity
- Design system components
- New screens/pages that need consistency
- When you have clear requirements

### Using Cursor

Cursor is best for:
- Interactive development and rapid iteration
- Debugging and refactoring
- UI/UX development
- Exploring and understanding existing code
- Real-time pair programming with AI

**Tips:**
- Use Cmd+K for inline code generation
- Use Chat to ask questions about your codebase
- Let AI help with imports and boilerplate
- Use for quick fixes and small iterations

## Code Organization Best Practices

### Supabase Client Setup

**Web App (`src/lib/supabase/client.ts`):**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Mobile App (`src/lib/supabase.ts`):**
```typescript
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

### Component Patterns

**Use consistent patterns across web and mobile:**
- Shared business logic in custom hooks
- Separate presentational and container components
- Use TypeScript for type safety
- Keep components small and focused

**Web App (with shadcn/ui):**
- Use shadcn/ui components for consistent design
- Customize components in `src/components/ui/`
- Build feature components in `src/components/features/`
- Leverage the `cn()` utility from `src/lib/utils.ts` for className merging

Example shadcn/ui component usage:
```typescript
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function LoginForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
      </CardHeader>
      <CardContent>
        <Input placeholder="Email" type="email" />
        <Input placeholder="Password" type="password" />
        <Button>Sign In</Button>
      </CardContent>
    </Card>
  )
}
```

### State Management

**Start simple:**
- React Context for global state (auth, theme)
- Local state for component-specific data
- Supabase Realtime for live data
- Add Zustand or Redux only if needed

## Next Steps

1. ✅ Set up repositories and folder structure
2. ✅ Configure environment variables
3. ✅ Initialize web and mobile apps
4. ✅ Set up Supabase client in both apps
5. ✅ Connect Vercel to GitHub
6. 🔄 Design database schema in Supabase
7. 🔄 Implement authentication flow
8. 🔄 Create initial screens/pages
9. 🔄 Set up navigation
10. 🔄 Deploy and test

## Useful Commands Reference

```bash
# Web App
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Mobile App
npx expo start       # Start Expo dev server
npx expo start --ios # Start with iOS simulator
npx expo start --android # Start with Android emulator
npx expo build       # Build for production

# Git
git status           # Check status
git add .            # Stage all changes
git commit -m "msg"  # Commit changes
git push             # Push to remote
git pull             # Pull latest changes

# Supabase (if using CLI)
npx supabase init    # Initialize Supabase
npx supabase start   # Start local Supabase
npx supabase db diff # Generate migration
```

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com (UI component library)
- **Expo Docs**: https://docs.expo.dev
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Claude Code Docs**: https://docs.claude.com/en/docs/claude-code
- **Cursor Docs**: https://cursor.sh/docs

## Troubleshooting

**Common issues:**

1. **Environment variables not loading**
   - Restart dev server after changing .env files
   - Ensure variable names start with `NEXT_PUBLIC_` for Next.js client-side
   - Clear Expo cache: `npx expo start -c`

2. **Supabase connection issues**
   - Verify URL and API keys are correct
   - Check network connectivity
   - Ensure RLS policies allow access

3. **Vercel build failures**
   - Check build logs in Vercel dashboard
   - Ensure environment variables are set
   - Verify root directory is correctly set

## Support

For questions or issues:
- Check official documentation
- Search GitHub issues
- Ask in project Slack/Discord
- Use Claude Code or Cursor AI for debugging help