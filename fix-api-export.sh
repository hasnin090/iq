#!/bin/bash

# Fix API handler export issue
echo "إصلاح مشكلة تصدير دالة API..."

# 1. Create a temporary file to store the fixed content
cat netlify/functions/api.js | grep -v "module.exports = { handler: exports.handler }" > api.js.tmp

# 2. Replace the original file with the fixed content
mv api.js.tmp netlify/functions/api.js

echo "تم إصلاح مشكلة تصدير الدالة"
