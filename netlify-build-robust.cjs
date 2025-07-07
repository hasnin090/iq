#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Netlify Build - Robust Version');
console.log('================================');

try {
  // 1. Show environment info
  console.log('🔍 Environment Info:');
  console.log(`Node version: ${process.version}`);
  console.log(`Working directory: ${__dirname}`);
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  
  // 2. Verify dependencies are installed
  console.log('🔍 Checking dependencies...');
  const nodeModulesPath = path.join(__dirname, 'node_modules');
  const vitePath = path.join(nodeModulesPath, '.bin', 'vite');
  const viteModulePath = path.join(nodeModulesPath, 'vite');
  
  console.log(`node_modules exists: ${fs.existsSync(nodeModulesPath)}`);
  console.log(`vite binary exists: ${fs.existsSync(vitePath)}`);
  console.log(`vite module exists: ${fs.existsSync(viteModulePath)}`);
  
  if (!fs.existsSync(viteModulePath)) {
    console.log('⚠️ Vite not found, installing...');
    execSync('npm install vite @vitejs/plugin-react typescript', { 
      stdio: 'inherit', 
      cwd: __dirname 
    });
  }

  // 3. Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  const distDir = path.join(__dirname, 'dist');
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
    console.log('✅ Previous build cleaned');
  }

  // 4. Try multiple build approaches
  console.log('🏗️ Running Vite build...');
  
  let buildSuccess = false;
  const buildCommands = [
    'npx vite build',
    './node_modules/.bin/vite build',
    'node ./node_modules/vite/bin/vite.js build',
    'npm run build'
  ];
  
  for (const command of buildCommands) {
    try {
      console.log(`📝 Trying: ${command}`);
      execSync(command, { 
        stdio: 'inherit', 
        cwd: __dirname,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          PATH: `${path.join(__dirname, 'node_modules', '.bin')}:${process.env.PATH}`
        }
      });
      console.log('✅ Vite build completed successfully');
      buildSuccess = true;
      break;
    } catch (error) {
      console.log(`❌ Command failed: ${command}`);
      console.log(`Error: ${error.message}`);
      continue;
    }
  }
  
  if (!buildSuccess) {
    throw new Error('All build commands failed');
  }

  // 5. Verify build output
  const publicDir = path.join(__dirname, 'dist', 'public');
  if (!fs.existsSync(publicDir)) {
    throw new Error('Build output directory not found');
  }

  const indexPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not found in build output');
  }

  console.log('✅ Build verification passed');

  // 6. Continue with the rest of the original script...
  // Read built index.html
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  console.log('📄 Built index.html read successfully');

  // Find main JS file
  const assetsDir = path.join(publicDir, 'assets');
  let mainJsFile = null;
  let mainCssFile = null;

  if (fs.existsSync(assetsDir)) {
    const assetFiles = fs.readdirSync(assetsDir);
    mainJsFile = assetFiles.find(file => file.match(/^index-[a-zA-Z0-9]+\.js$/));
    mainCssFile = assetFiles.find(file => file.match(/^index-[a-zA-Z0-9]+\.css$/));
    
    console.log(`📄 Found main JS file: ${mainJsFile || 'none'}`);
    console.log(`📄 Found main CSS file: ${mainCssFile || 'none'}`);
  }

  console.log('🎉 Build completed successfully!');
  console.log('📊 Build Summary:');
  console.log(`   - Output directory: ${publicDir}`);
  console.log(`   - Main files: ${indexPath}`);
  if (mainJsFile) console.log(`   - JS bundle: ${path.join(assetsDir, mainJsFile)}`);
  if (mainCssFile) console.log(`   - CSS bundle: ${path.join(assetsDir, mainCssFile)}`);

} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
