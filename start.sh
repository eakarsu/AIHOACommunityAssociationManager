#!/bin/bash

echo "=========================================="
echo "  AI HOA Community Association Manager"
echo "  Sunset Ridge Community"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

SERVER_PORT=${SERVER_PORT:-3001}
CLIENT_PORT=${CLIENT_PORT:-3000}

# Kill processes on used ports
echo -e "${YELLOW}Cleaning up ports ${SERVER_PORT} and ${CLIENT_PORT}...${NC}"
lsof -ti:${SERVER_PORT} | xargs kill -9 2>/dev/null
lsof -ti:${CLIENT_PORT} | xargs kill -9 2>/dev/null
echo -e "${GREEN}✓ Ports cleaned${NC}"

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo -e "${YELLOW}Starting PostgreSQL...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 2
fi

# Create database if it doesn't exist
echo -e "${BLUE}Setting up database...${NC}"
createdb hoa_manager 2>/dev/null || true
echo -e "${GREEN}✓ Database ready${NC}"

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
npm install --silent 2>/dev/null
cd server && npm install --silent 2>/dev/null && cd ..
cd client && npm install --silent 2>/dev/null && cd ..
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Seed database
echo -e "${BLUE}Seeding database...${NC}"
cd server && node seed.js && cd ..
echo -e "${GREEN}✓ Database seeded${NC}"

echo ""
echo -e "${GREEN}=========================================="
echo -e "  Starting Application with Hot Reload"
echo -e "==========================================${NC}"
echo -e "${BLUE}  Backend:  http://localhost:${SERVER_PORT}${NC}"
echo -e "${BLUE}  Frontend: http://localhost:${CLIENT_PORT}${NC}"
echo -e "${YELLOW}  Login: admin@hoamanager.com / password123${NC}"
echo ""

# Start both servers with hot reload using concurrently
npx concurrently \
  --names "SERVER,CLIENT" \
  --prefix-colors "blue,green" \
  "cd server && npx nodemon --watch . --ext js,json index.js" \
  "cd client && npx vite --port ${CLIENT_PORT} --host"
