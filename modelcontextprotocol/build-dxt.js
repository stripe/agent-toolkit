/* eslint-disable no-sync */
const esbuild = require('esbuild');
const fsSync = require('fs');

const dxt = require('@anthropic-ai/dxt');

// Ensure dist directory exists
if (!fsSync.existsSync('dxt-dist')) {
  fsSync.mkdirSync('dxt-dist');
}

// Build configuration
const buildConfig = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dxt-dist/index.js',
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: [],
  minify: false,
  sourcemap: false,
  metafile: false,
  write: true,
  logLevel: 'info',
};

async function build() {
  try {
    console.log('🔨 Building with esbuild...');

    const result = await esbuild.build(buildConfig);

    if (result.errors.length > 0) {
      console.error('❌ Build failed with errors:');
      result.errors.forEach((error) => console.error(error));
      throw new Error('Build failed with errors');
    }

    if (result.warnings.length > 0) {
      console.warn('⚠️  Build completed with warnings:');
      result.warnings.forEach((warning) => console.warn(warning));
    }

    // Make the output file executable
    fsSync.chmodSync('dxt-dist/index.js', '755');

    console.log('✅ Build completed successfully!');
    console.log('📦 Output: dxt-dist/index.js');
  } catch (error) {
    console.error('❌ Build failed:', error);
    throw error;
  }
}

// Run the build
build();

// Pack the actual DXT extension
dxt.packExtension({
  extensionPath: '.',
  outputPath: 'stripe.dxt',
  silent: true,
});

console.log('✅ DXT extension built successfully!');
console.log('📦 Output: stripe.dxt');
