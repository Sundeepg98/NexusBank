#!/bin/bash
set -e

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Setup complete!"
echo "To start development:"
echo "  Backend:  cd backend && npm start"
echo "  Frontend: cd frontend && npm start"
