import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Netlify + Supabase build process...');

try {
  // 1. Ensure directories exist
  const functionsDir = path.join(__dirname, 'netlify', 'functions');
  const publicDestDir = path.join(__dirname, 'dist', 'public');
  
  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir, { recursive: true });
    console.log('📁 Created netlify/functions directory');
  }

  if (!fs.existsSync(publicDestDir)) {
    fs.mkdirSync(publicDestDir, { recursive: true });
    console.log('📁 Created dist/public directory');
  }

  // 2. Copy static files from public directory
  const publicSrcDir = path.join(__dirname, 'public');
  
  if (fs.existsSync(publicSrcDir)) {
    console.log('📄 Copying static files...');
    const files = fs.readdirSync(publicSrcDir);
    files.forEach(file => {
      const srcFile = path.join(publicSrcDir, file);
      const destFile = path.join(publicDestDir, file);
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`  ✓ Copied ${file}`);
      }
    });
  }

  // 3. Create _redirects file for SPA routing
  const redirectsContent = `# API routes to Netlify Functions
/api/*  /.netlify/functions/api/:splat  200

# SPA fallback for React Router
/*  /index.html  200`;

  fs.writeFileSync(path.join(publicDestDir, '_redirects'), redirectsContent);
  console.log('🔄 Created _redirects file for SPA routing');

  // 4. Ensure API function exists and is properly configured
  const apiFunction = path.join(functionsDir, 'api.cjs');
  const apiJsFunction = path.join(functionsDir, 'api.js');
  
  if (fs.existsSync(apiFunction)) {
    console.log('✅ API function found (api.cjs)');
  } else if (fs.existsSync(apiJsFunction)) {
    console.log('✅ API function found (api.js)');
  } else {
    console.log('⚠️ API function not found - this will cause 404 errors');
    console.log('📁 Functions directory contents:', fs.readdirSync(functionsDir));
  }

  // 5. Create build info file
  const buildInfo = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'production',
    project: 'نظام المحاسبة العربي'
  };

  fs.writeFileSync(
    path.join(publicDestDir, 'build-info.json'), 
    JSON.stringify(buildInfo, null, 2)
  );
  console.log('ℹ️ Created build info file');

  console.log('✅ Netlify build completed successfully!');
  console.log('📁 Output directory: dist/public');
  console.log('⚡ Functions directory: netlify/functions');
  console.log('🌐 Ready for deployment!');

} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
