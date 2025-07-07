#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Final Pre-Deployment Check for Netlify');
console.log('==========================================');

const publicDir = path.join(__dirname, 'dist', 'public');
const errors = [];
const warnings = [];
const success = [];

// Check 1: Basic files exist
console.log('\n📁 Checking basic files...');
const requiredFiles = ['index.html', 'app.html', '_redirects'];
for (const file of requiredFiles) {
  const filePath = path.join(publicDir, file);
  if (fs.existsSync(filePath)) {
    success.push(`✅ ${file} exists`);
  } else {
    errors.push(`❌ ${file} missing`);
  }
}

// Check 2: app.html validation
console.log('\n📱 Checking app.html...');
if (fs.existsSync(path.join(publicDir, 'app.html'))) {
  const appContent = fs.readFileSync(path.join(publicDir, 'app.html'), 'utf8');
  
  if (appContent.includes('<div id="root">')) {
    success.push('✅ app.html has root div');
  } else {
    errors.push('❌ app.html missing root div');
  }
  
  if (appContent.includes('<script type="module"')) {
    success.push('✅ app.html has script tag');
  } else {
    errors.push('❌ app.html missing script tag');
  }
  
  if (appContent.includes('crossorigin src="/assets/')) {
    success.push('✅ app.html has correct asset path');
  } else {
    warnings.push('⚠️ app.html asset path may be incorrect');
  }
}

// Check 3: Assets directory
console.log('\n📦 Checking assets...');
const assetsDir = path.join(publicDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const assets = fs.readdirSync(assetsDir);
  const jsFiles = assets.filter(f => f.endsWith('.js'));
  const cssFiles = assets.filter(f => f.endsWith('.css'));
  
  if (jsFiles.length > 0) {
    success.push(`✅ Found ${jsFiles.length} JS files`);
  } else {
    errors.push('❌ No JS files found');
  }
  
  if (cssFiles.length > 0) {
    success.push(`✅ Found ${cssFiles.length} CSS files`);
  } else {
    warnings.push('⚠️ No CSS files found');
  }
  
  const mainJs = assets.find(f => f.startsWith('index-') && f.endsWith('.js'));
  if (mainJs) {
    success.push(`✅ Main JS file: ${mainJs}`);
  } else {
    errors.push('❌ Main JS file not found');
  }
} else {
  errors.push('❌ Assets directory missing');
}

// Check 4: Redirects file
console.log('\n🔄 Checking redirects...');
if (fs.existsSync(path.join(publicDir, '_redirects'))) {
  const redirectsContent = fs.readFileSync(path.join(publicDir, '_redirects'), 'utf8');
  
  if (redirectsContent.includes('/api/*')) {
    success.push('✅ API redirects configured');
  } else {
    warnings.push('⚠️ API redirects missing');
  }
  
  if (redirectsContent.includes('/app') && redirectsContent.includes('app.html')) {
    success.push('✅ App redirects configured');
  } else {
    errors.push('❌ App redirects missing');
  }
  
  if (redirectsContent.includes('/*') && redirectsContent.includes('index.html')) {
    success.push('✅ Fallback redirect configured');
  } else {
    warnings.push('⚠️ Fallback redirect missing');
  }
}

// Check 5: Netlify configuration
console.log('\n⚙️ Checking Netlify config...');
const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
if (fs.existsSync(netlifyTomlPath)) {
  const netlifyContent = fs.readFileSync(netlifyTomlPath, 'utf8');
  
  if (netlifyContent.includes('publish = "dist/public"')) {
    success.push('✅ Publish directory correct');
  } else {
    errors.push('❌ Publish directory incorrect');
  }
  
  if (netlifyContent.includes('functions = "netlify/functions"')) {
    success.push('✅ Functions directory correct');
  } else {
    errors.push('❌ Functions directory incorrect');
  }
  
  if (netlifyContent.includes('netlify-build-simple.cjs')) {
    success.push('✅ Build command uses simple script');
  } else {
    warnings.push('⚠️ Build command may be complex');
  }
} else {
  errors.push('❌ netlify.toml missing');
}

// Check 6: Functions
console.log('\n⚡ Checking functions...');
const functionsDir = path.join(__dirname, 'netlify', 'functions');
if (fs.existsSync(functionsDir)) {
  const functions = fs.readdirSync(functionsDir);
  
  if (functions.includes('api.js')) {
    success.push('✅ API function exists');
    
    const apiContent = fs.readFileSync(path.join(functionsDir, 'api.js'), 'utf8');
    if (apiContent.includes('exports.handler')) {
      success.push('✅ API function has correct export');
    } else {
      errors.push('❌ API function missing handler export');
    }
  } else {
    errors.push('❌ API function missing');
  }
} else {
  errors.push('❌ Functions directory missing');
}

// Results
console.log('\n📊 FINAL RESULTS');
console.log('================');

if (success.length > 0) {
  console.log('\n✅ SUCCESS:');
  success.forEach(msg => console.log(msg));
}

if (warnings.length > 0) {
  console.log('\n⚠️ WARNINGS:');
  warnings.forEach(msg => console.log(msg));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(msg => console.log(msg));
}

const totalChecks = success.length + warnings.length + errors.length;
const score = Math.round((success.length / totalChecks) * 100);

console.log(`\n📈 SCORE: ${success.length}/${totalChecks} (${score}%)`);

if (errors.length === 0) {
  console.log('\n🎉 READY FOR DEPLOYMENT!');
  console.log('✅ All critical checks passed');
  console.log('🚀 You can deploy to Netlify now');
  
  console.log('\n📝 Deployment Steps:');
  console.log('1. git add . && git commit -m "Fix build issues"');
  console.log('2. git push origin main');
  console.log('3. Deploy on Netlify (will use netlify.toml automatically)');
  
} else {
  console.log('\n❌ NOT READY - Fix errors first');
  console.log('🔧 Address the errors above before deploying');
}

console.log('\n' + '='.repeat(50));
