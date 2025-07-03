const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building production system for Netlify...');

try {
  // 1. بناء Frontend بـ Vite
  console.log('Building frontend with Vite...');
  execSync('npm run build', { stdio: 'inherit' });

  // 2. نسخ الملفات المبنية إلى public
  console.log('Copying built files to public...');
  if (!fs.existsSync('./public')) {
    fs.mkdirSync('./public', { recursive: true });
  }

  // نسخ محتويات dist/public إلى public
  if (fs.existsSync('./dist/public')) {
    const copyRecursiveSync = (src, dest) => {
      const exists = fs.existsSync(src);
      const stats = exists && fs.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      
      if (isDirectory) {
        if (!fs.existsSync(dest)) {
          fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(childItemName => {
          copyRecursiveSync(
            path.join(src, childItemName),
            path.join(dest, childItemName)
          );
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    copyRecursiveSync('./dist/public', './public');
  }

  // 3. إنشاء _redirects للـ API
  fs.writeFileSync('./public/_redirects', '/api/* /.netlify/functions/server/:splat 200\n/* /index.html 200');

  // 4. إنشاء Netlify Function للـ backend
  console.log('Creating Netlify function...');
  if (!fs.existsSync('./netlify/functions')) {
    fs.mkdirSync('./netlify/functions', { recursive: true });
  }

  // نسخ ملف server الموجود
  const serverFunc = `const serverless = require('serverless-http');
const express = require('express');
const { db } = require('../../server/db');
const routes = require('../../server/routes');

const app = express();

app.use(express.json());
app.use('/api', routes.router);

exports.handler = serverless(app);`;

  fs.writeFileSync('./netlify/functions/server.js', serverFunc);

  // 5. إنشاء package.json للـ functions
  const functionsPackage = {
    "name": "netlify-functions",
    "version": "1.0.0",
    "dependencies": {
      "serverless-http": "^3.2.0",
      "express": "^4.19.2",
      "drizzle-orm": "^0.36.0",
      "postgres": "^3.4.5"
    }
  };

  fs.writeFileSync('./netlify/functions/package.json', JSON.stringify(functionsPackage, null, 2));

  console.log('Production build completed successfully!');
  console.log('Files are ready for Netlify deployment.');

} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}