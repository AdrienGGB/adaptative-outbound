# Context7 MCP Integration

Context7 is an MCP (Model Context Protocol) server that provides up-to-date documentation and code examples for libraries and frameworks.

## What is Context7?

Context7 solves the problem of AI assistants hallucinating outdated or non-existent APIs by fetching **real-time, version-specific documentation** directly from source repositories.

## Benefits

- ✅ **Accurate Documentation**: Get current documentation for libraries like React, Next.js, Supabase, etc.
- ✅ **Version-Specific**: Ensures examples match the versions you're using
- ✅ **No Hallucinations**: Real documentation instead of AI-generated guesses
- ✅ **Up-to-Date Examples**: Fresh code examples from official docs

## Installation

Context7 has been installed for this project using:
```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp
```

**Status**: ✓ Connected

## How to Use

Simply add "use context7" to your prompts when you need documentation:

### Examples

**Get Next.js Documentation:**
```
use context7 to explain how to implement Server Actions in Next.js 15
```

**Get Supabase Examples:**
```
use context7 to show how to implement Row Level Security policies in Supabase
```

**Get React Native/Expo Documentation:**
```
use context7 to explain how to use Expo Camera API with permissions
```

**Get TypeScript Help:**
```
use context7 to show TypeScript utility types for form handling
```

**Multiple Libraries:**
```
use context7 to show how to integrate Next.js App Router with Supabase authentication
```

## Best Practices

### 1. Be Specific About Versions
```
use context7 for Next.js 15 Server Components patterns
```

### 2. Request Examples
```
use context7 to provide a complete example of Supabase real-time subscriptions
```

### 3. Ask for Best Practices
```
use context7 to explain best practices for Expo app configuration
```

### 4. Combine with Agents
```
@nextjs-pro use context7 to implement authentication with Next.js 15 and Supabase
```

## Relevant to This Project

Context7 is especially useful for our tech stack:

### Next.js 15
```
use context7 for Next.js 15 App Router
use context7 for Next.js Server Actions
use context7 for Next.js middleware patterns
```

### Supabase
```
use context7 for Supabase authentication
use context7 for Supabase Row Level Security
use context7 for Supabase real-time subscriptions
use context7 for Supabase Storage
```

### React Native/Expo
```
use context7 for Expo Navigation
use context7 for Expo Camera
use context7 for Expo Notifications
use context7 for React Native performance optimization
```

### TypeScript
```
use context7 for TypeScript generics
use context7 for TypeScript utility types
use context7 for TypeScript with React
```

### React
```
use context7 for React hooks patterns
use context7 for React Context API
use context7 for React performance optimization
```

## Rate Limits

**Current Setup**: Using free tier (no API key)
- Lower rate limits
- Sufficient for development

**To Upgrade**: Get an API key from https://context7.com for higher rate limits:
```bash
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: YOUR_API_KEY"
```

## Verification

Check Context7 status:
```bash
claude mcp list
```

Should show:
```
context7: https://mcp.context7.com/mcp (HTTP) - ✓ Connected
```

## Resources

- **GitHub**: https://github.com/upstash/context7
- **Website**: https://context7.com
- **MCP Protocol**: https://modelcontextprotocol.io

## Notes

- Context7 is configured globally for this project
- No API key required for basic usage
- Works with all Claude Code features and agents
- Can be combined with agent prompts for enhanced results
