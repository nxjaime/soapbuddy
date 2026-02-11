#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting SoapManager Web Platform ===${NC}"

# Get the project root directory
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
WEB_ROOT="$PROJECT_ROOT/web"

# 1. Start the Backend
echo -e "${GREEN}Starting Backend Server...${NC}"
cd "$WEB_ROOT/backend"

# Check if venv exists, if not create and install
if [ ! -d "venv" ]; then
    echo "Creating python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Run FastAPI in the background
# We use nohup to keep it running, but we store the PID to kill it later if needed
# Actually for a dev script, running it in a background process in this shell is better
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend running on http://localhost:8000 (PID: $BACKEND_PID)"

# 2. Start the Frontend
echo -e "${GREEN}Starting Frontend...${NC}"
cd "$WEB_ROOT/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Function to handle script exit
cleanup() {
    echo -e "${BLUE}Shutting down...${NC}"
    kill $BACKEND_PID
    exit
}

# Trap SIGINT (Ctrl+C) to run cleanup
trap cleanup SIGINT

# Start Vite dev server
echo "Frontend running on http://localhost:5173"
npm run dev

# Wait for user to stop
wait $BACKEND_PID
