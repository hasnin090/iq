#!/bin/bash

echo "🧪 Testing Netlify Build Process"
echo "================================"

# Test 1: Check if package.json has required dependencies
echo "✅ Checking package.json dependencies..."
if grep -q "\"vite\"" package.json; then
    echo "   ✅ Vite found in package.json"
else
    echo "   ❌ Vite NOT found in package.json"
fi

# Test 2: Check if node_modules exists and has vite
echo "✅ Checking node_modules..."
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules directory exists"
    if [ -f "node_modules/.bin/vite" ]; then
        echo "   ✅ Vite binary found in node_modules/.bin/"
    else
        echo "   ❌ Vite binary NOT found in node_modules/.bin/"
    fi
else
    echo "   ❌ node_modules directory does NOT exist"
    echo "   🔧 Running npm install..."
    npm install
fi

# Test 3: Try running the build script
echo "✅ Testing build script..."
if [ -f "netlify-build-robust.cjs" ]; then
    echo "   🏗️ Running netlify-build-robust.cjs..."
    node netlify-build-robust.cjs
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Build script completed successfully"
        
        # Check if dist directory was created
        if [ -d "dist/public" ]; then
            echo "   ✅ dist/public directory created"
            if [ -f "dist/public/index.html" ]; then
                echo "   ✅ index.html found in output"
            else
                echo "   ❌ index.html NOT found in output"
            fi
        else
            echo "   ❌ dist/public directory NOT created"
        fi
    else
        echo "   ❌ Build script FAILED"
    fi
else
    echo "   ❌ netlify-build-robust.cjs NOT found"
fi

echo ""
echo "🎯 Test Summary Complete"
echo "========================"