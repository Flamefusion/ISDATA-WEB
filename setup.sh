#!/bin/bash

# This script sets up the Node.js project dependencies with exact versions.
# It uses 'npm ci' which is recommended for clean, reproducible installs.

echo "Starting Node.js dependency setup..."

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null
then
    echo "Error: Node.js is not installed. Please install Node.js (which includes npm) to proceed."
    echo "Recommended: https://nodejs.org/en/download/"
    exit 1
fi

if ! command -v npm &> /dev/null
then
    echo "Error: npm is not installed. Please install Node.js (which includes npm) to proceed."
    echo "Recommended: https://nodejs.org/en/download/"
    exit 1
fi

echo "Node.js and npm detected. Proceeding with installation."

# Install dependencies from package-lock.json
npm ci

if [ $? -eq 0 ]; then
    echo "Node.js dependencies installed successfully."
    echo "You can now run the development server: npm run dev"
else
    echo "Error: Node.js dependency installation failed."
    echo "Please check the output above for details."
    exit 1
fi
