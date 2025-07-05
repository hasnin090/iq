import { build } from 'esbuild';
import { glob } from 'glob';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildNetlifyFunctions() {
  console.log('🚀 Building Netlify Functions...');

  try {
    // Find all function files
    const functionFiles = await glob('netlify/functions/**/*.ts', {
      cwd: path.join(__dirname, '..'),
      absolute: true
    });

    console.log(`📁 Found ${functionFiles.length} function files`);

    // Build each function
    for (const file of functionFiles) {
      const relativePath = path.relative(path.join(__dirname, '..'), file);
      const outputPath = file.replace('.ts', '.js').replace('/netlify/functions/', '/dist/netlify/functions/');
      
      console.log(`⚡ Building ${relativePath}...`);

      await build({
        entryPoints: [file],
        bundle: true,
        platform: 'node',
        target: 'node18',
        format: 'esm',
        outfile: outputPath,
        external: ['@netlify/functions'],
        minify: true,
        sourcemap: true,
        define: {
          'process.env.NODE_ENV': '"production"'
        },
        banner: {
          js: '// Netlify Function - Built with esbuild'
        }
      });

      console.log(`✅ Built ${relativePath} -> ${path.relative(path.join(__dirname, '..'), outputPath)}`);
    }

    console.log('🎉 All Netlify Functions built successfully!');
  } catch (error) {
    console.error('❌ Error building Netlify Functions:', error);
    process.exit(1);
  }
}

// Run the build
buildNetlifyFunctions();
