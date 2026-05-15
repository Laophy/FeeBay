/**
 * Steam depot builder.
 *
 * Produces a ZIP of the unpacked game ready for Steam's "Upload Depots via HTTP"
 * page. The ZIP's contents sit at its root (FeeBay Simulator.exe, resources/, …),
 * which is exactly the file tree Steam expects for a depot.
 *
 * The ZIP is built with Windows' bundled `tar` (bsdtar) rather than PowerShell's
 * Compress-Archive: PowerShell 5.1 writes backslash path separators inside the
 * archive, which is not spec-compliant and makes Steam's uploader fail.
 *
 * Usage:  npm run steam:build
 */
import { execSync, execFileSync } from 'node:child_process';
import { existsSync, rmSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
const unpackedDir = path.join('release', 'win-unpacked');
const zipPath = path.join('release', `feebay-steam-depot-v${version}.zip`);

console.log('[steam-build] 1/3 compiling renderer + electron...');
run('npm run build');

console.log('[steam-build] 2/3 packaging unpacked app (electron-builder --dir)...');
run('npx electron-builder --win --dir');

if (!existsSync(unpackedDir)) {
  throw new Error(
    `Expected "${unpackedDir}" but it was not produced. ` +
      'Check the electron-builder output above.',
  );
}

if (existsSync(zipPath)) rmSync(zipPath);

console.log('[steam-build] 3/3 zipping depot contents...');
// Archive the directory CONTENTS (each top-level entry) so they land at the
// zip root with no nested win-unpacked/ folder. We invoke System32's tar.exe
// (bsdtar) by absolute path on purpose — plain `tar` on PATH can resolve to
// GNU tar (e.g. from Git), which cannot create ZIP archives. bsdtar writes
// forward-slash separators, producing a spec-compliant ZIP Steam accepts.
const entries = readdirSync(unpackedDir);
if (entries.length === 0) {
  throw new Error(`"${unpackedDir}" is empty — nothing to package.`);
}
const bsdtar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
if (!existsSync(bsdtar)) {
  throw new Error(
    `bsdtar not found at "${bsdtar}". It ships with Windows 10/11 — a ZIP built ` +
      'by any other tool that uses backslash separators will be rejected by Steam.',
  );
}
try {
  execFileSync(
    bsdtar,
    ['-a', '-c', '-f', path.resolve(zipPath), '-C', unpackedDir, ...entries],
    { stdio: 'inherit' },
  );
} catch (err) {
  throw new Error(
    'Failed to create the ZIP with bsdtar. Original error: ' +
      (err && err.message ? err.message : String(err)),
  );
}

const sizeMB = (statSync(zipPath).size / (1024 * 1024)).toFixed(1);
console.log('\n[steam-build] Done.');
console.log(`  Depot ZIP : ${path.resolve(zipPath)}`);
console.log(`  Size      : ${sizeMB} MB compressed`);
if (Number(sizeMB) > 2048) {
  console.log('  NOTE: over 2048 MB — use steamcmd instead of the HTTP uploader.');
} else {
  console.log('  Upload this ZIP on the Steam depot "Upload Depots via HTTP" page.');
}
