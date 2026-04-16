# Changelog

All notable changes to NexusBank project.

## [Unreleased]

### Auth Redirects (2026-04-15)
- **Changed `authGuard`** to redirect to `/login` instead of `/welcome` when unauthenticated
- **Changed `authInterceptor`** to redirect to `/login` on session expiry (401 errors)

### Architecture Refactoring (2026-04-15)

#### Backend MVC Pattern
- **Created `controllers/authController.js`** - Extracted auth logic from 440-line route
- **`routes/auth.js` refactored to thin route** - Reduced from 440 to ~112 lines
- **Single source of truth for `withSession`** - All controllers import from `config/neo4j`
- **Created `utils/passwordValidator.js`** - Shared password validation utility
- **Fixed circular dependency** - `profileController` now imports from utils, not routes
- **Fixed `bcrypt` vs `bcryptjs`** - `otp.js` now uses `bcryptjs` to match other files

#### SOLID Principles Status
| Principle | Status | Notes |
|-----------|--------|-------|
| **S**ingle Responsibility | ✅ PASS | Controllers have one job each |
| **O**pen/Closed | ⚠️ PARTIAL | Some duplication exists |
| **L**iskov Substitution | ✅ PASS | No inheritance hierarchy issues |
| **I**nterface Segregation | ⚠️ PARTIAL | No formal interfaces |
| **D**ependency Inversion | ✅ PASS | Controllers depend on abstractions (withSession) |

#### DDD/CQRS/Hexagonal Status
| Pattern | Status | Notes |
|---------|--------|-------|
| **Hexagonal (Ports/Adapters)** | ⚠️ PARTIAL | Routes are adapters, controllers are business logic, but no formal ports |
| **Domain-Driven Design** | ⚠️ PARTIAL | Entities exist as TypeScript interfaces, but no rich domain models |
| **CQRS** | ❌ NOT IMPLEMENTED | Commands and queries are in same controllers |
| **Clean Architecture** | ⚠️ PARTIAL | 4 layers exist but domain logic leaks into controllers |

#### Dead Code Removed
- Removed duplicate `withSession` definitions from controllers (now import from `config/neo4j`)
- Removed circular import in `profileController.js`
- `bcryptjs` consistency across all files

### Added
- **Security Features**
  - Helmet.js security headers
  - CORS configuration with allowed origins
  - Body size limit (10kb) for DOS prevention
  - Token blacklisting to Neo4j (revoked tokens stored persistently)
  - Refresh token mechanism with Neo4j persistence
  - Rate limiting for OTP generation (3 req/min)

- **Backend API Endpoints**
  - `POST /api/auth/forgot-password` - Request password reset OTP
  - `POST /api/auth/reset-password` - Reset password with OTP verification
  - `POST /api/contact` - Contact form submission
  - `GET /api/beneficiaries` - List user beneficiaries
  - `POST /api/beneficiaries` - Add new beneficiary
  - `DELETE /api/beneficiaries/:id` - Remove beneficiary

- **OTP System Refactor**
  - Moved from in-memory Map to Neo4j persistence
  - OTP lockout after 3 failed attempts
  - Automatic cleanup of expired OTPs
  - Support for multiple OTP purposes (transfer, forgot_password, general)

- **Frontend Features**
  - Beneficiaries management page (`/beneficiaries`)
  - Forgot password flow (`/forgot-password`)
  - Avatar/profile picture support
  - Password confirmation on registration
  - OTP countdown timer and resend button
  - Transaction receipt download

- **Input Validation & Security**
  - XSS sanitization on transaction descriptions
  - Input sanitization middleware
  - Password validation (8+ chars, uppercase, lowercase, number, special char)

- **Logging & Monitoring**
  - Winston structured logging
  - Global exception handler middleware
  - Database indexes for performance

### Fixed
- OTP persistence to Neo4j (parameter ordering, timestamp handling)
- Forgot password email storage in OTP entry
- Reset password email verification logic
- User ID default value in OTP creation
- `checkRateLimit` function import error in transaction controller
- Registration password confirmation validation

### Testing
- OTP utilities tests (8 tests passing)
- Fixed `otp.test.js` - Added `ENABLE_TEST_OTP=true` to jest.setup.js for test mode OTP storage
- Fixed `otp.test.js` - Proper Neo4j mock returning node properties with `otp` and `plainOtp` fields
- Fixed `otp.test.js` - bcrypt.compare mock correctly compares plain OTP against stored value
- All 15 backend tests now passing (OTP: 8, authController: 3, transactionController: 4)

### Frontend Build Fix
- Fixed `tsconfig.app.json` to exclude `test.ts` from production build (was causing Angular platform-browser-dynamic/testing import error)

### Critical Bug Fixes (2026-04-16)
- **Fixed registration bug** - `routes/auth.js` was not passing `confirmPassword` to controller, causing password mismatch error even when passwords matched
- **Fixed transactions route** - Removed reference to non-existent `getTestOTP` function that was preventing server startup

### Rate Limiter Improvements (2026-04-16)
- **authLimiter**: Now uses IP+email composite key, increased limit to 10 (test: 1000), disabled in test mode
- **otpLimiter**: Added IP+email composite key, increased limit to 1000 in test mode
- **otpVerifyLimiter**: Added IP+email composite key, increased limit to 1000 in test mode
- **All limiters**: Disabled in test environment (NODE_ENV=test) to prevent test interference

### Frontend Bug Fix (2026-04-16)
- **Fixed login token storage** - `login.ts` was not calling `authService.login()` to store token after successful API response. Added `AuthService` injection and token storage call. Login now redirects to dashboard correctly.
- **Fixed BrowserModule duplicate import** - `welcome-banner.component.ts` imported `BrowserAnimationsModule` which internally uses BrowserModule, causing NG05100 error. Changed to `CommonModule` + inline animations.
- **Fixed missing animation trigger** - Added `@fadeIn` animation definition to `welcome-banner.component.ts`.

### Critical Backend Bug Fix (2026-04-16)
- **Fixed batchTransfer response bug** - `res.json()` was called inside the transaction callback, which could cause race conditions. Moved response outside the transaction to ensure proper commit order.

### Security Fixes (2026-04-16)
- **Fixed admin endpoint authorization** - Added admin role check to `/admin/revoke-sessions` endpoint. Previously any authenticated user could revoke any user's sessions.
- **Fixed NaN amount bypass** - Batch transfer now validates that amounts are valid positive numbers using `isNaN()` check.
- **Fixed email enumeration** - Forgot password now returns same message whether email exists or not to prevent user enumeration attacks.

### Cleanup Fixes (2026-04-16)
- **Fixed broken import** - Removed `getTestOTP` from `routes/transactions.js` import (was causing server crash on startup).
- **Removed non-existent API** - Removed `getTestOTP` from frontend `api.ts` service (endpoint doesn't exist on backend).

### Security Improvements (2026-04-16)
- **Added forgot-password rate limiting** - Added 5 requests per 15 minutes limit to prevent email enumeration attacks.
- **Fixed Infinity bypass** - Changed `isNaN()` to `Number.isFinite()` for amount validation to catch Infinity values.

### Critical Bug Fixes (2026-04-16)
- **Fixed deleteUser transaction safety** - Wrapped all delete operations in single `executeWrite` transaction to prevent inconsistent state if any step fails.
- **Fixed batchTransfer result handling** - Simplified to use `const result = await` pattern to prevent undefined result crashes.
- **Fixed OTP not displayed in toast** - `createOTP` controller was discarding the `otp` value returned from `createOtpEntry()` in test mode. Controller now forwards `otp` in response when `ENABLE_TEST_OTP=true`. Toast now shows "OTP is: 933016" correctly.

### Additional Security & Quality Fixes (2026-04-16)
- **Fixed Money.js Infinity bypass** - Changed `isNaN()` to `Number.isFinite()` in value object validation.
- **Added contact form rate limiting** - Added 10 requests per 15 minutes limit to prevent spam.
- **Fixed login test assertion** - Corrected email validation test to expect error for invalid email format.
- **Fixed profileController passwordValidation bug** - Changed `passwordValidation.error` to `passwordValidation.message` in changePasswordWithOTP handler.

### UX Improvements (2026-04-16)
- **Added aria-live to toast** - Toast component now has `role="alert"` and `aria-live="polite"` for screen reader accessibility.
- **Fixed forgot password flow** - Combined OTP and password steps into single form for proper UX. OTP is now validated together with password reset in one API call.
- **Added mobile navigation** - Navbar now has responsive hamburger menu for mobile devices with smooth slide-in animation.

### E2E Test Results (2026-04-16)
- **All E2E flows working** - Login, dashboard, logout all functional
- **No console errors** - Clean browser console
- **Token storage working** - Auth token properly stored and retrieved
- **Dashboard loads correctly** - Account info, quick actions all displayed

## [1.0.2] - 2026-04-14

### Added
- **Security Features**
  - Rate limiting (100 req/15min general, 5 req/15min for auth)
  - Transfer OTP confirmation (6-digit OTP before transfer completes)
  - Session timeout (30 min idle timeout with automatic logout)

- **Backend API Endpoints**
  - `POST /api/transfer/generate-otp` - Generate OTP for transfer
  - `POST /api/transfer/verify-otp` - Verify OTP and complete transfer
  - `GET /api/accounts/:id/statement` - Account statement (CSV/JSON)
  - Transaction pagination support

- **Frontend Features**
  - Session timeout with activity tracking
  - Download statement button
  - OTP input UI for transfer confirmation

### Fixed
- `resetTransferState` accessibility (was private, now public)
- OTP input type error

### Testing
- Vitest test runner configured (replaces Karma)
- 36 unit tests passing

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
- Karma unit tests need configuration work for Angular 21's new test builder (vitest recommended)
