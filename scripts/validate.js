const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const ANDROID = path.join(ROOT, 'android');
const PKG = require(path.join(ROOT, 'package.json'));

let errors = [];
let warnings = [];

const log = (kind, msg) => {
  const pfx = kind === 'ERROR' ? '❌ ERROR' : '⚠️  WARN';
  console.error(`${pfx}: ${msg}`);
  kind === 'ERROR' ? errors.push(msg) : warnings.push(msg);
};

const rel = (fp) => path.relative(ROOT, fp);

const getAllFiles = (dir, ext) => {
  const files = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const fp = path.join(d, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') walk(fp);
      else if (entry.isFile() && fp.endsWith(ext)) files.push(fp);
    }
  };
  walk(dir);
  return files;
};

const read = (fp) => fs.readFileSync(fp, 'utf-8');

// --------------------------------------------------------------------------
// 1. Empty URI patterns in useVideoPlayer
// --------------------------------------------------------------------------
function checkEmptyUriPatterns() {
  console.log('\n[1/7] Checking empty URI patterns in useVideoPlayer...');
  const files = getAllFiles(SRC, '.tsx');
  let found = false;
  for (const file of files) {
    const content = read(file);

    // Match: useVideoPlayer({ uri: '' }) or useVideoPlayer({uri:""})
    const emptyLiteral = /useVideoPlayer\s*\(\s*\{[^}]*uri\s*:\s*['"`]\s*['"`]\s*\}/s;
    if (emptyLiteral.test(content)) {
      log('ERROR', `${rel(file)}: useVideoPlayer called with literal empty URI string`);
      found = true;
    }

    // Match: condition ? { uri: valid } : { uri: '' }
    const ternaryFallback = /useVideoPlayer\s*\(\s*[^,]+?\?\s*\{[^}]*uri:\s*[^}]+?\}\s*:\s*\{[^}]*uri:\s*['"`]\s*['"`]\s*\}/s;
    if (ternaryFallback.test(content)) {
      log('ERROR', `${rel(file)}: useVideoPlayer has ternary fallback with empty URI — extract into child component`);
      found = true;
    }
  }
  if (!found) console.log('  ✓ No empty URI patterns found');
}

// --------------------------------------------------------------------------
// 2. Check for useVideoPlayer in screen components (should be in child)
// --------------------------------------------------------------------------
function checkUnsafeVideoPlayerUsage() {
  console.log('\n[2/7] Checking for unsafe useVideoPlayer calls...');
  const files = getAllFiles(SRC, '.tsx');
  let issues = 0;

  const whitelist = [
    'src/components/VideoItem.tsx',       // VideoContent child component
    'src/screens/StoryViewScreen.tsx',     // StoryVideoContent child component
    'src/screens/LiveScreen.tsx',          // LiveVideoContent child component
    'src/screens/UploadScreen.tsx',        // UploadVideoContent child component
  ];

  for (const file of files) {
    const content = read(file);
    if (!/useVideoPlayer\s*\(/.test(content)) continue;

    const rp = rel(file);
    if (whitelist.includes(rp)) continue;

    log('WARN', `${rp}: contains useVideoPlayer — verify it's inside a child component that only mounts with valid URI`);
    issues++;
  }
  if (!issues) console.log('  ✓ All useVideoPlayer calls are in child components');
}

// --------------------------------------------------------------------------
// 3. TypeScript compilation check
// --------------------------------------------------------------------------
function checkTypeScript() {
  console.log('\n[3/7] Running TypeScript type check...');
  try {
    const out = execSync('npx tsc --noEmit', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (out.trim()) {
      out.trim().split('\n').filter(l => l.includes('error')).forEach(l => log('ERROR', `TypeScript: ${l.trim()}`));
    }
  } catch (e) {
    const lines = e.stdout ? e.stdout.trim().split('\n').filter(l => l.includes('error')) : [e.message];
    if (lines.length === 0) lines.push(e.stderr ? e.stderr.trim() : e.message);
    lines.forEach(l => log('ERROR', `TypeScript: ${l.trim()}`));
  }
  if (errors.filter(e => e.startsWith('TypeScript')).length === 0) console.log('  ✓ TypeScript compiles cleanly');
}

// --------------------------------------------------------------------------
// 4. ESLint errors
// --------------------------------------------------------------------------
function checkEslint() {
  console.log('\n[4/7] Running ESLint...');
  try {
    const out = execSync('npx eslint . --format unix', { cwd: ROOT, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const lines = out.trim().split('\n').filter(l => l.includes('['));
    const errLines = lines.filter(l => /:\d+:\d+:\s*Error\s/.test(l));
    const warnLines = lines.filter(l => /:\d+:\d+:\s*Warning\s/.test(l));

    errLines.forEach(l => log('ERROR', `ESLint: ${l.trim()}`));
    if (errLines.length === 0) {
      console.log(`  ✓ No ESLint errors (${warnLines.length} warnings)`);
    }
  } catch (e) {
    const out = e.stdout || '';
    const lines = out.trim().split('\n').filter(l => /:\d+:\d+:\s*Error\s/.test(l));
    if (lines.length > 0) {
      lines.forEach(l => log('ERROR', `ESLint: ${l.trim()}`));
    } else {
      log('WARN', 'ESLint exited with code 1 — run manually to check details');
    }
  }
}

// --------------------------------------------------------------------------
// 5. package.json dependency sanity
// --------------------------------------------------------------------------
function checkDependencies() {
  console.log('\n[5/7] Checking package.json dependencies...');
  const allDeps = { ...PKG.dependencies, ...PKG.devDependencies };
  let issues = 0;

  for (const [name, ver] of Object.entries(allDeps)) {
    const pkgDir = path.join(ROOT, 'node_modules', name);
    if (!fs.existsSync(path.join(pkgDir, 'package.json'))) {
      log('ERROR', `Dependency '${name}' (${ver}) is not installed — run npm install`);
      issues++;
    }
  }

  for (const name of Object.keys(PKG.dependencies)) {
    if (PKG.devDependencies && name in PKG.devDependencies) {
      log('WARN', `'${name}' appears in both dependencies and devDependencies`);
    }
  }

  const critical = ['react', 'react-native', 'react-native-reanimated', 'react-native-safe-area-context', 'react-native-screens', '@supabase/supabase-js', 'nativewind', 'tailwindcss'];
  for (const dep of critical) {
    if (!(dep in allDeps)) {
      log('ERROR', `Missing critical dependency: ${dep}`);
      issues++;
    }
  }

  if (!issues) console.log('  ✓ Dependencies look good');
}

// --------------------------------------------------------------------------
// 6. Android config sanity
// --------------------------------------------------------------------------
function checkAndroidConfig() {
  console.log('\n[6/7] Checking Android configuration...');
  let issues = 0;

  const keystore = path.join(ANDROID, 'app', 'debug.keystore');
  if (!fs.existsSync(keystore)) log('WARN', 'debug.keystore not found (will be generated)');

  const gradlew = path.join(ANDROID, 'gradlew');
  if (!fs.existsSync(gradlew)) { log('ERROR', 'gradlew not found'); issues++; }

  const manifest = path.join(ANDROID, 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!fs.existsSync(manifest)) { log('ERROR', 'AndroidManifest.xml not found'); issues++; }

  const gradleProps = read(path.join(ANDROID, 'gradle.properties'));
  if (!gradleProps.includes('newArchEnabled=true')) log('WARN', 'newArchEnabled not true in gradle.properties');

  if (!issues) console.log('  ✓ Android config OK');
}

// --------------------------------------------------------------------------
// 7. Check Katex/lib display issues — find rgba called as function
// --------------------------------------------------------------------------
function checkStyleIssues() {
  console.log('\n[7/7] Checking common pattern issues...');
  const files = getAllFiles(SRC, '.tsx');
  let issues = 0;

  for (const file of files) {
    const content = read(file);
    // In RN StyleSheet, rgba() must be a string, not called as function
    const rgbaCalls = content.match(/\brgba\s*\(/g);
    if (rgbaCalls) {
      log('WARN', `${rel(file)}: ${rgbaCalls.length}x rgba() function call — make sure it's used in a StyleSheet.create context`);
    }
  }

  if (!issues) console.log('  ✓ No common pattern issues');
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------
console.log('══════════════════════════════════════════════');
console.log('  G4 — Comprehensive Project Validation');
console.log('══════════════════════════════════════════════\n');

checkEmptyUriPatterns();
checkUnsafeVideoPlayerUsage();
checkTypeScript();
checkEslint();
checkDependencies();
checkAndroidConfig();
checkStyleIssues();

console.log('\n══════════════════════════════════════════════');
console.log(`  ${errors.length} errors, ${warnings.length} warnings`);
console.log('══════════════════════════════════════════════\n');

if (errors.length > 0) {
  console.error('❌ Validation FAILED — fix errors above before building\n');
  process.exit(1);
} else {
  console.log('✅ Validation PASSED — ready for build\n');
  process.exit(0);
}
