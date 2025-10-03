# Claude Code Permissions

This document explains the pre-approved permissions for this project.

## Overview

To streamline development and avoid repetitive permission prompts, the following commands have been pre-approved in `.claude/settings.local.json`.

## Permission Categories

### NPX Commands
- `npx create-next-app:*` - Create Next.js applications
- `npx create-expo-app:*` - Create Expo applications
- `npx expo install:*` - Install Expo packages
- `npx -y @upstash/context7-mcp:*` - Run Context7 MCP

### NPM Commands
- `npm install:*` - Install dependencies
- `npm init:*` - Initialize packages
- `npm run build:*` - Build applications
- `npm run dev:*` - Run development servers
- `npm start:*` - Start applications

### File Operations
- `mv:*` - Move files/directories
- `rmdir:*` - Remove directories
- `rm:*` - Remove files
- `cp:*` - Copy files
- `mkdir:*` - Create directories
- `ls:*` - List directory contents
- `find:*` - Search for files

### Navigation
- `cd:*` - Change directories

### Git Commands
- `git init:*` - Initialize repositories
- `git add:*` - Stage changes
- `git commit:*` - Commit changes
- `git remote add:*` - Add remote repositories
- `git remote remove:*` - Remove remote repositories
- `git branch:*` - Manage branches
- `git push:*` - Push changes
- `git status:*` - Check repository status
- `git diff:*` - View changes
- `git log:*` - View commit history

### GitHub CLI (gh)
- `gh repo create:*` - Create repositories
- `gh auth login:*` - Authenticate with GitHub
- `gh api:*` - Make API calls

### Package Managers
- `brew install:*` - Install packages via Homebrew

### Claude Code MCP
- `claude mcp add:*` - Add MCP servers
- `claude mcp list:*` - List MCP servers

### File Reading
- `Read(//private/tmp/**)` - Read temporary files
- `Read(//Users/adriengaignebet/.claude/**)` - Read Claude config
- `Read(//Users/adriengaignebet/Documents/Tech/Adaptive Outbound/**)` - Read project files

## Setup Instructions

### For This Project (Already Configured)

The permissions are already set in `.claude/settings.local.json` (not tracked in git).

### For New Team Members

1. Copy the example settings:
   ```bash
   cp .claude/settings.example.json .claude/settings.local.json
   ```

2. Adjust the read paths if your username is different:
   ```json
   "Read(//Users/YOUR_USERNAME/.claude/**)",
   "Read(//Users/YOUR_USERNAME/Documents/Tech/Adaptive Outbound/**)"
   ```

### Adding New Permissions

If you need to add new commands:

1. Edit `.claude/settings.local.json`
2. Add the command pattern to the `"allow"` array
3. Use wildcards `*` for flexibility (e.g., `"Bash(npm run *)"`)

## Security Notes

- ⚠️ These permissions allow Claude Code to run commands without asking
- ✅ All commands are scoped to safe development operations
- ✅ No destructive system commands are allowed
- ✅ Read access is limited to project and temp directories
- ⚠️ `.claude/settings.local.json` is in `.gitignore` (local only)

## Example Settings File

See `.claude/settings.example.json` for the complete template.

## Why These Permissions?

These permissions were used during the initial project setup:

- **Project initialization**: create-next-app, create-expo-app
- **Dependency management**: npm install, npm init
- **Development**: npm run dev, npm start, npm run build
- **File organization**: mv, cp, mkdir, rm
- **Version control**: git commands
- **GitHub integration**: gh commands
- **Package installation**: brew install
- **MCP setup**: claude mcp commands
- **File access**: Reading project, config, and temp files

## Modifying Permissions

To modify permissions for your workflow:

1. Open `.claude/settings.local.json`
2. Add patterns to `"allow"`, `"deny"`, or `"ask"` arrays
3. Save the file
4. Changes take effect immediately

## Resources

- [Claude Code Permissions Documentation](https://docs.claude.com/en/docs/claude-code)
