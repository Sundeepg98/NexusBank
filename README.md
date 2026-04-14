# NexusBank - Digital Banking Platform

A full-stack netbanking application built with Angular 19 and Node.js, featuring a Neo4j graph database.

![NexusBank Dashboard](nexusbank-dashboard.png)

## Features

- **Authentication** - Secure JWT-based login and registration
- **Dashboard** - Real-time account overview with balances
- **Fund Transfers** - Send money to any account
- **Transaction History** - View and search past transactions
- **Account Management** - Create multiple account types (Savings, Current, Fixed)
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Angular 19, Signals, Reactive Forms |
| Backend | Node.js, Express |
| Database | Neo4j Aura |
| Testing | Playwright |
| Hosting | GitHub Codespaces |

## Getting Started

### Prerequisites

- Node.js 18+
- Neo4j Aura database (or local Neo4j)
- Git

### Environment Setup

1. **Backend Environment**

Create `backend/.env`:

```env
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=your-username
NEO4J_PASSWORD=your-password
JWT_SECRET=your-secret-key
PORT=3000
```

2. **Frontend Environment**

Create `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};
```

### Running Locally

```bash
# Clone the repository
git clone https://github.com/Sundeepg98/NexusBank.git
cd NexusBank

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start backend (Terminal 1)
cd backend && npm start

# Start frontend (Terminal 2)
cd frontend && npm start
```

Open [http://localhost:4200](http://localhost:4200)

### Using GitHub Codespaces

1. Go to [GitHub Codespaces](https://github.com/codespaces)
2. Create a new codespace for `Sundeepg98/NexusBank`
3. In the terminal:

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start both servers
npm start  # backend on port 3000
cd ../frontend && npm start  # frontend on port 4200
```

## Project Structure

```
NexusBank/
├── backend/              # Express API server
│   ├── config/          # Database configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth middleware
│   ├── routes/         # API routes
│   └── server.js       # Entry point
├── frontend/           # Angular 19 application
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/   # Reusable components
│   │   │   ├── guards/       # Route guards
│   │   │   ├── models/       # TypeScript interfaces
│   │   │   ├── pages/         # Page components
│   │   │   └── services/      # API services
│   │   └── styles.scss        # Global styles
│   └── tests/           # Playwright tests
├── .devcontainer/      # Codespaces config
└── scripts/            # Setup scripts
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get user profile

### Accounts
- `GET /api/accounts` - List user accounts
- `POST /api/accounts` - Create new account

### Transactions
- `GET /api/transactions?accountId=` - Get transactions
- `POST /api/transactions/transfer` - Transfer funds

## Testing

```bash
cd frontend

# Run all tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test file
npx playwright test tests/auth.spec.ts
```

## Demo Accounts

Register a new account or use the test user:
- Email: `john@example.com`
- Password: `password123`

## License

MIT
