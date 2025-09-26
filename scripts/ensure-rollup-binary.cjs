#!/usr/bin/env node

// Ensure the Rollup native binary exists for Linux builds (e.g., Netlify CI).
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const { platform, arch, env, cwd } = process;

// Only enforce on Linux x64 targets where Rollup expects the native .node binary.
if (platform !== 'linux' || arch !== 'x64') {
  process.exit(0);
}

const projectRoot = cwd();
const rollupPackagePath = path.join(projectRoot, 'node_modules', 'rollup', 'package.json');

if (!fs.existsSync(rollupPackagePath)) {
  console.warn('[ensure-rollup-binary] Rollup is not installed yet; skipping native check.');
  process.exit(0);
}

const rollupPackage = require(rollupPackagePath);
const desiredVersion = rollupPackage.version;
const binaryPackageName = `@rollup/rollup-linux-x64-gnu`;

const installBinary = () => {
  const spec = `${binaryPackageName}@${desiredVersion}`;
  console.log(`[ensure-rollup-binary] Installing ${spec} ...`);
  execSync(`npm install ${spec} --no-save`, {
    stdio: 'inherit',
    env,
  });
};

const ensureBinaryPresent = () => {
  const binaryPath = path.join(projectRoot, 'node_modules', 'rollup', `dist/rollup.linux-x64-gnu.node`);

  if (fs.existsSync(binaryPath)) {
    return true;
  }

  // Fallback: try to resolve the platform package. If it exists but the file is missing,
  // reinstall to repair the dependency tree.
  try {
    const resolvedPackageJson = require.resolve(`${binaryPackageName}/package.json`, {
      paths: [projectRoot],
    });
    const installedVersion = require(resolvedPackageJson).version;

    if (installedVersion !== desiredVersion) {
      console.log(
        `[ensure-rollup-binary] Detected ${binaryPackageName}@${installedVersion}, expected ${desiredVersion}. Re-installing.`
      );
      installBinary();
    } else {
      console.log(
        `[ensure-rollup-binary] ${binaryPackageName}@${installedVersion} is installed but the binary is missing. Re-installing.`
      );
      installBinary();
    }
  } catch (error) {
    installBinary();
  }

  return fs.existsSync(binaryPath);
};

if (ensureBinaryPresent()) {
  console.log('[ensure-rollup-binary] Rollup native binary ready.');
  process.exit(0);
}

console.warn(
  '[ensure-rollup-binary] Unable to verify Rollup native binary after install. Build will continue; Rollup will fall back to WASM if available.'
);
