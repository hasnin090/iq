import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Netlify + Supabase build process...');

try {
  // 1. Ensure netlify functions directory exists
  const functionsDir = path.join(__dirname, 'netlify', 'functions');
  if (!fs.existsSync(functionsDir)) {
    fs.mkdirSync(functionsDir, { recursive: true });
    console.log('📁 Created netlify/functions directory');
  }

  // 2. Copy any additional static files
  const publicSrcDir = path.join(__dirname, 'public');
  const publicDestDir = path.join(__dirname, 'dist', 'public');
  
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
  const redirectsContent = `
# API routes to Netlify Functions
/api/*  /.netlify/functions/api/:splat  200

# SPA fallback
/*  /index.html  200
`;

  fs.writeFileSync(path.join(publicDestDir, '_redirects'), redirectsContent.trim());
  console.log('🔄 Created _redirects file for SPA routing');

  // 4. Create a simple health check function if it doesn't exist
  const healthCheckFunction = `
import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'النظام يعمل بشكل طبيعي',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }),
  };
};
`;

  const healthCheckPath = path.join(functionsDir, 'health.ts');
  if (!fs.existsSync(healthCheckPath)) {
    fs.writeFileSync(healthCheckPath, healthCheckFunction.trim());
    console.log('🏥 Created health check function');
  }

  // 5. Build info
  const buildInfo = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    environment: process.env.NODE_ENV || 'development'
  };

  fs.writeFileSync(
    path.join(publicDestDir, 'build-info.json'), 
    JSON.stringify(buildInfo, null, 2)
  );
  console.log('ℹ️ Created build info file');

  console.log('✅ Build completed successfully!');
  console.log('📁 Output directory: dist/public');
  console.log('⚡ Functions directory: netlify/functions');
  console.log('🌐 Ready for Netlify deployment!');

  console.log('');
  console.log('📋 نظام المحاسبة العربي جاهز للنشر على Netlify مع Supabase');
  console.log('');
  console.log('📁 الملفات المتوفرة:');
  console.log('  - dist/public/ (الواجهة الأمامية)');
  console.log('  - netlify/functions/api.ts (دوال الواجهة الخلفية)');
  console.log('  - netlify.toml (إعدادات Netlify)');
  console.log('');
  console.log('🔧 المتطلبات التالية:');
  console.log('  1. إنشاء مشروع Supabase جديد');
  console.log('  2. إنشاء الجداول المطلوبة في قاعدة البيانات');
  console.log('  3. تحديث معلومات الاتصال في الكود');
  console.log('  4. رفع المشروع إلى Netlify');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
