#!/bin/bash

echo "🚀 Starting Podcast Generator Services..."

# Start Python RVC service in background
echo "📡 Starting Python HF/RVC Service on port 5000..."
python3 rvc_service_hf.py &
PYTHON_PID=$!

# Wait a moment for Python service to start
sleep 3

# Check if Python service is running
if kill -0 $PYTHON_PID 2>/dev/null; then
    echo "✅ Python service started (PID: $PYTHON_PID)"
else
    echo "⚠️  Python service may have failed to start"
fi

# Start Node.js server
echo "🌐 Starting Node.js server on port $PORT..."
node server.js
