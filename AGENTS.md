# Agent Instructions for NexusBank

## Project Architecture
- Angular 21 frontend with signals and OnPush change detection
- Node.js/Express REST API backend
- Neo4j Aura database (neo4j+s://)
- JWT authentication with refresh tokens
- OTP verification for sensitive operations

## Directory Structure
frontend/
├── src/app/pages/     # Angular page components
├── src/app/services/  # API services
├── src/app/guards/    # Route guards (auth, login)
backend/
├── controllers/       # Business logic (MVC pattern)
├── routes/            # Express route handlers
├── config/           # Neo4j, OTP, logger config
├── utils/            # Shared utilities

## Build Commands

### Code Standards
- Angular: Use signals (signal(), computed()), Angular 19+ control flow (@if, @for)
- OnPush: Always use ChangeDetectionStrategy.OnPush
- Testing: Unit tests for services, E2E for flows
- Commits: Small, focused commits with descriptive messages

### When Fixing Issues
1. Understand the file's code conventions first
2. Mimic existing patterns
3. Always follow security best practices
4. Never commit secrets/keys

### When Starting Work
1. Read relevant files to understand context
2. Check changelog.md for history
3. Verify current state before making changes

## Important Reminders

## Last Updated
2026-04-15
