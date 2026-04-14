# NexusbankApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.7.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

## API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout (invalidate token) |
| POST | `/api/auth/change-password` | Change password |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile |

### Accounts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List user accounts |
| POST | `/api/accounts` | Create new account |
| GET | `/api/accounts/:id/statement` | Get statement (CSV/JSON) |

### Transfers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions/transfer` | Direct transfer |
| POST | `/api/transfer/generate-otp` | Generate OTP |
| POST | `/api/transfer/verify-otp` | Verify OTP & transfer |

### Beneficiaries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/beneficiaries` | List beneficiaries |
| POST | `/api/beneficiaries` | Add beneficiary |
| DELETE | `/api/beneficiaries/:id` | Remove beneficiary |

---

## Security Features

- **Rate Limiting**: API endpoints are protected against abuse with configurable rate limits
- **OTP for Transfers**: Two-factor authentication via OTP for sensitive operations
- **Session Timeout**: Automatic session expiration after inactivity
- **JWT + Blacklisting**: Secure token-based authentication with token blacklisting on logout

---

## Running the App

### Frontend
```bash
cd frontend && npm start
```

### Backend
```bash
cd backend && npm start
```

### Tests
```bash
cd frontend && npm run test:run
```

---

## Environment Variables

Configure the following environment variables in your `.env` file:

| Variable | Description |
|----------|-------------|
| `API_BASE_URL` | Backend API base URL |
| `JWT_SECRET` | Secret key for JWT token signing |
| `JWT_EXPIRATION` | Token expiration time |
| `RATE_LIMIT_WINDOW` | Rate limiting window (ms) |
| `RATE_LIMIT_MAX` | Max requests per window |
| `OTP_EXPIRATION` | OTP validity duration (seconds) |
| `SESSION_TIMEOUT` | Session timeout duration (minutes) |
