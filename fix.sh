#!/bin/bash
set -e

echo "🔧 Comprehensive Test Fix Script"
echo "================================="

# 1. Set up environment
echo "📦 Setting up environment..."
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
export TESTING=true

# 2. Create __init__.py if missing
if [ ! -f "__init__.py" ]; then
    echo "# This file makes the root directory a Python package for testing" > __init__.py
    echo "✅ Created __init__.py"
fi

# 3. Install dependencies
echo "📦 Installing dependencies..."
pip install -e . 2>/dev/null || echo "ℹ️  Package installation skipped (probably already installed)"

# 4. Run simple test to verify basic functionality
echo "🧪 Running basic functionality test..."
if python test_simple.py; then
    echo "✅ Basic functionality test passed"
else
    echo "❌ Basic functionality test failed"
    echo "Fix the issues shown above before running the full test suite"
    exit 1
fi

echo ""
echo "🚀 Basic tests are working! Now you can run:"
echo "   make test                    # Run fast tests"
echo "   make test-unit              # Run only unit tests"
echo "   pytest tests/unit/ -v       # Run unit tests with verbose output"
echo ""
echo "If you still get 500 errors, the issue is likely in the database connection pool."
echo "Make sure your app/__init__.py doesn't initialize the database pool during testing."