# Adaptive Outbound

A cross-platform application for adaptive outbound campaigns, built with Next.js, React Native, and Supabase.

## Project Structure

```
adaptive-outbound/
├── web-app/           # Next.js web application
├── mobile-app/        # React Native mobile app (Expo)
├── shared/            # Shared code, types, and utilities
├── supabase/          # Database migrations, functions, and debug scripts
└── docs/              # Project documentation
```

## Quick Start

### Web App
```bash
cd web-app
npm install
npm run dev
# Visit http://localhost:3000
```

### Mobile App
```bash
cd mobile-app
npm install
npx expo start
```

## Documentation

All project documentation is organized in the [docs](./docs) folder:

- **[Setup Guides](./docs/setup/)** - Environment setup, deployment, and configuration
- **[Features](./docs/features/)** - Feature specifications and documentation
- **[Testing](./docs/testing/)** - Test strategies, reports, and guides
- **[Bug Fixes](./docs/bug-fixes/)** - Bug fix summaries and applied patches
- **[Development](./docs/development/)** - Project history and development logs
- **[Reports](./docs/reports/)** - Analysis and audit reports

### Key Documents

- [CLAUDE.md](./CLAUDE.md) - Claude Code setup and development guidelines
- [Quick Start Guide](./docs/QUICK_START.md) - Get up and running quickly
- [Architecture Diagram](./docs/ARCHITECTURE_DIAGRAM.md) - System architecture overview
- [Deployment Strategy](./docs/DEPLOYMENT_STRATEGY.md) - Deployment guidelines

## Tech Stack

### Frontend
- **Web**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Mobile**: React Native with Expo, TypeScript

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### DevOps
- **Version Control**: GitHub
- **Web Deployment**: Vercel
- **Development**: Cursor IDE, Claude Code

## Development Workflow

### Branch Strategy
- `main` - Production-ready code (auto-deploys to Vercel)
- `dev` - Active development
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches

### Commit Conventions
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance tasks

## Environment Variables

Required environment variables for each app:

### Web App (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Mobile App (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

See `.env.example` files in each app directory for complete configuration.

## Testing

### Web App
```bash
cd web-app
npm run test        # Run unit tests
npm run test:e2e    # Run E2E tests
npm run build       # Production build test
```

### Mobile App
```bash
cd mobile-app
npx expo start      # Manual testing
```

## Contributing

1. Create a feature branch from `dev`
2. Make your changes
3. Test thoroughly
4. Create a pull request to `dev`
5. After review and approval, merge to `dev`
6. When ready for production, merge `dev` to `main`

## Support

- Check [documentation](./docs/)
- Review [troubleshooting guide](./docs/DEPLOYMENT_STRATEGY.md#troubleshooting)
- Consult [CLAUDE.md](./CLAUDE.md) for development guidelines

## License

[Add your license information here]
