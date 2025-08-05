#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const DIST_DIR = join(process.cwd(), 'dist');
const CACHE_DIRS = ['.cache', '.turbo', '.parcel-cache'];

function log(message, type = 'info') {
  const prefix = {
    info: '📦',
    success: '✅',
    error: '❌',
    warning: '⚠️',
  };
  console.log(`${prefix[type]} ${message}`);
}

function exec(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    return false;
  }
}

async function buildProduction() {
  console.log('🚀 Starting production build process...\n');

  // Step 1: Clean previous builds
  log('Cleaning previous builds...');
  if (existsSync(DIST_DIR)) {
    rmSync(DIST_DIR, { recursive: true, force: true });
  }

  CACHE_DIRS.forEach((dir) => {
    const cachePath = join(process.cwd(), dir);
    if (existsSync(cachePath)) {
      rmSync(cachePath, { recursive: true, force: true });
    }
  });

  // Step 2: Validate environment
  log('Validating environment variables...');
  if (!exec('node scripts/validate-env.js')) {
    log('Environment validation failed!', 'error');
    process.exit(1);
  }

  // Step 3: Type checking
  log('Running TypeScript type checking...');
  if (!exec('npm run type-check')) {
    log('Type checking failed!', 'error');
    process.exit(1);
  }

  // Step 4: Linting
  log('Running linters...');
  if (!exec('npm run lint')) {
    log('Linting failed!', 'error');
    process.exit(1);
  }

  // Step 5: Run tests
  log('Running unit tests...');
  if (!exec('npm run test:unit')) {
    log('Unit tests failed!', 'error');
    process.exit(1);
  }

  // Step 6: Build the application
  log('Building application...');
  const startTime = Date.now();

  if (!exec('cross-env NODE_ENV=production vite build')) {
    log('Build failed!', 'error');
    process.exit(1);
  }

  const buildTime = ((Date.now() - startTime) / 1000).toFixed(2);
  log(`Build completed in ${buildTime}s`, 'success');

  // Step 7: Generate sitemap (after build)
  log('Generating sitemap...');
  if (!exec('npm run sitemap:prod')) {
    log('Sitemap generation failed!', 'warning');
    // Continue build process even if sitemap fails
  }

  // Step 8: Analyze bundle size
  log('Analyzing bundle size...');
  if (!exec('npm run build:size')) {
    log('Bundle size analysis failed!', 'warning');
    // Continue build process even if size analysis fails
  }

  // Step 9: Run Lighthouse CI (if configured)
  if (process.env.LIGHTHOUSE_CI === 'true') {
    log('Running Lighthouse CI...');
    exec('npm run lighthouse:ci');
  }

  // Step 10: Final validation
  if (!existsSync(join(DIST_DIR, 'index.html'))) {
    log('Build verification failed - index.html not found!', 'error');
    process.exit(1);
  }

  console.log('\n🎉 Production build completed successfully!\n');
  console.log('📁 Output directory: ./dist');
  console.log('🚀 Ready for deployment\n');

  // Show build stats
  if (!exec('du -sh dist/', { stdio: 'inherit' })) {
    log('Failed to get directory size', 'warning');
  }
}

// Run the build
buildProduction().catch((error) => {
  log(`Build failed: ${error.message}`, 'error');
  process.exit(1);
});
