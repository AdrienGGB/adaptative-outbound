# Claude Code Sub-Agents

This project uses specialized Claude Code sub-agents for different development tasks.

## 🎯 Essential Agents

### 1. **fullstack-engineer**
**Purpose**: End-to-end feature development across web, mobile, and backend
**Use for**: Coordinating features across Next.js, React Native, and Supabase
**Example**: `@fullstack-engineer Create user profile feature across web and mobile`

### 2. **nextjs-pro**
**Purpose**: Next.js 14+ expertise with App Router
**Use for**: App Router, Server Components, Server Actions, routing, optimization
**Example**: `@nextjs-pro Set up authentication with Next.js and Supabase`

### 3. **mobile-developer**
**Purpose**: React Native with Expo expertise
**Use for**: Native features, navigation, performance, platform-specific code
**Example**: `@mobile-developer Implement image upload with camera access`

### 4. **typescript-pro**
**Purpose**: Advanced TypeScript patterns and type safety
**Use for**: Complex types, generics, type guards, shared type definitions
**Example**: `@typescript-pro Create type-safe API client for Supabase`

### 5. **backend-architect**
**Purpose**: Backend design and database architecture
**Use for**: Supabase schema design, RLS policies, Edge Functions, API design
**Example**: `@backend-architect Design database schema for social media features`

## 💡 Very Useful Agents

### 6. **frontend-specialist**
**Purpose**: Frontend best practices and optimization
**Use for**: React patterns, state management, performance, accessibility
**Example**: `@frontend-specialist Optimize form handling with react-hook-form`

### 7. **react-pro**
**Purpose**: Advanced React patterns and optimization
**Use for**: Custom hooks, context patterns, performance optimization, composition
**Example**: `@react-pro Create custom hooks for Supabase auth state`

### 8. **code-reviewer**
**Purpose**: Code quality and best practices review
**Use for**: PR reviews, refactoring suggestions, code quality checks
**Example**: `@code-reviewer Review my authentication implementation`

### 9. **security-auditor**
**Purpose**: Security vulnerability detection
**Use for**: Finding security issues, checking RLS policies, auth flows
**Example**: `@security-auditor Audit my Supabase Row Level Security policies`

### 10. **test-engineer**
**Purpose**: Testing strategy and implementation
**Use for**: Test setup, writing tests, test automation, CI/CD testing
**Example**: `@test-engineer Set up testing for my Next.js app`

## 📖 How to Use

### Basic Usage
```bash
@agent-name Your request here
```

### Examples

**Full-Stack Feature:**
```bash
@fullstack-engineer Create a posts feature with:
- Next.js page with infinite scroll
- Mobile screen with pull-to-refresh
- Supabase table with RLS policies
- Shared TypeScript types
```

**Next.js Specific:**
```bash
@nextjs-pro Implement Server Actions for form submission with validation
```

**Mobile Specific:**
```bash
@mobile-developer Add push notifications using Expo Notifications
```

**Type Safety:**
```bash
@typescript-pro Create type-safe wrappers for our Supabase queries
```

**Backend:**
```bash
@backend-architect Design a schema for a multi-tenant SaaS application
```

**Code Review:**
```bash
@code-reviewer Review the authentication flow in web-app/src/app/auth/
```

**Security:**
```bash
@security-auditor Check all RLS policies for potential data leaks
```

**Testing:**
```bash
@test-engineer Create integration tests for the user registration flow
```

## 🎨 Best Practices

### 1. **Be Specific**
❌ Bad: `@nextjs-pro help with forms`
✅ Good: `@nextjs-pro Create a multi-step form with validation using Server Actions`

### 2. **Provide Context**
Include relevant file paths, error messages, or requirements

### 3. **Chain Agents**
Use multiple agents for complex tasks:
```bash
@backend-architect Design the schema
# Then after review:
@security-auditor Check the RLS policies
# Then:
@fullstack-engineer Implement the feature
# Finally:
@code-reviewer Review the implementation
```

### 4. **Use for Complex Tasks**
Agents excel at:
- Multi-file implementations
- Architectural decisions
- Best practice guidance
- Code reviews and audits

### 5. **Regular Code Reviews**
Before merging features:
```bash
@code-reviewer Review changes in src/features/new-feature/
@security-auditor Check for security issues in the same area
```

## 🔄 Agent Workflow Examples

### Creating a New Feature
```bash
1. @backend-architect Design schema for [feature]
2. @typescript-pro Create types for the schema
3. @fullstack-engineer Implement [feature] across web and mobile
4. @code-reviewer Review the implementation
5. @security-auditor Check for security issues
6. @test-engineer Add tests for [feature]
```

### Optimizing Performance
```bash
1. @react-pro Review components for performance issues
2. @frontend-specialist Suggest optimization strategies
3. @mobile-developer Optimize mobile-specific performance
```

### Fixing a Bug
```bash
1. @code-reviewer Analyze bug in [file]
2. @fullstack-engineer Fix the issue
3. @test-engineer Add regression tests
```

## 📚 Documentation

For more details on each agent, see their individual markdown files in this directory.

Source: https://github.com/stretchcloud/claude-code-unified-agents
