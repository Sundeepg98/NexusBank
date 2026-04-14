# Changelog

All notable changes to NexusBank project.

## [Unreleased]

## [1.0.0] - 2026-04-14

### Added
- **Frontend (Angular 21)**
  - Netbanking dashboard with account management
  - Registration and login pages
  - Fund transfer (single & batch)
  - Transaction history with detail modal
  - Angular Signals for reactive state (`signal()`, `computed()`, `effect()`)
  - Angular 19+ control flow: `@if`, `@for`, `@defer`
  - `ChangeDetectionStrategy.OnPush` for performance
  - `@Input()`/`@Output()` with signals
  - `@ViewChild` for component references
  - Content projection with `ng-content` (CardComponent)
  - Route Resolver for data preloading
  - HTTP Interceptors (auth, error handling)
  - Angular Animations (`@fadeIn`, `@slideIn`)
  - Custom Pipes (`CurrencyPipe`, `DateFormatPipe`)
  - Skeleton Loader Component
  - FormArray for dynamic batch transfers
  - Environment files for API URL configuration
  - Karma test configuration
  - Unit tests for pipes, CardComponent, AuthService

- **Backend (Node.js/Express)**
  - User registration and login with JWT
  - Neo4j Aura database integration
  - Account creation (SAVINGS, CURRENT, FIXED)
  - Fund transfer endpoints
  - Transaction history

- **Infrastructure**
  - GitHub Codespaces support (`.devcontainer/`)
  - `.gitignore` for Node.js/Angular
  - Environment configuration files

### Fixed
- Template errors in `netbanking.html` (extra closing tags)
- TypeScript error in `DateFormatPipe` (options type)
- Neo4j datetime conversion for display
- Account number generation (using `substring(randomUUID(), 0, 12)`)

### Known Issues
- Karma unit tests need configuration work for Angular 21's new test builder
