# Changelog

All notable changes to NexusBank project.

## [Unreleased]

## [1.0.1] - 2026-04-14

### Added
- **Profile Page** (`/profile`)
  - View user profile information
  - Edit first name, last name, phone
  - Change password with validation (8+ chars, uppercase, lowercase, number, special char)

- **Backend API Endpoints**
  - `POST /api/auth/logout` - Token invalidation (blacklist)
  - `POST /api/auth/change-password` - Password change with validation
  - `GET /api/profile` - Get user profile
  - `PUT /api/profile` - Update profile
  - `GET /api/beneficiaries` - List beneficiaries
  - `POST /api/beneficiaries` - Add beneficiary
  - `DELETE /api/beneficiaries/:id` - Remove beneficiary

- **Unit Tests** (29 new tests)
  - `ApiService` - 11 tests
  - `AuthInterceptor` - 4 tests
  - `ErrorInterceptor` - 5 tests
  - `AuthGuard` - 5 tests
  - `AuthService` - additional 4 tests

- **E2E Tests** (10 new tests)
  - Login flow tests
  - Registration flow tests
  - Netbanking dashboard tests

### Fixed
- **CRITICAL**: Password hash bug in registration (was storing plain text, now stores hashed)

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
