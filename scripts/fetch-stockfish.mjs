// Downloads the official Stockfish Linux build into resources/engines/stockfish so it can be bundled
// into the Flatpak (the sandbox cannot see a system-installed Stockfish). Skips if already present.
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const VERSION = 'sf_17.1';
const BUILD = process.env.STOCKFISH_BUILD ?? 'x86-64-avx2'; // e.g. x86-64-sse41-popcnt for older CPUs
const out = path.resolve('resources/engines/stockfish');

if (existsSync(out) && !process.argv.includes('--force')) {
  console.log(`Stockfish already at ${out}`);
  process.exit(0);
}
const url = `https://github.com/official-stockfish/Stockfish/releases/download/${VERSION}/stockfish-ubuntu-${BUILD}.tar`;
console.log(`Downloading ${url}`);
const res = await fetch(url);
if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
const dir = mkdtempSync(path.join(tmpdir(), 'stockfish-'));
const tar = path.join(dir, 'sf.tar');
writeFileSync(tar, Buffer.from(await res.arrayBuffer()));
execFileSync('tar', ['-xf', tar, '-C', dir]);
mkdirSync(path.dirname(out), { recursive: true });
copyFileSync(path.join(dir, 'stockfish', `stockfish-ubuntu-${BUILD}`), out);
chmodSync(out, 0o755);
copyFileSync(path.join(dir, 'stockfish', 'Copying.txt'), path.join(path.dirname(out), 'STOCKFISH-LICENSE.txt'));
rmSync(dir, { recursive: true, force: true });
console.log(`Stockfish ${VERSION} (${BUILD}) -> ${out}`);
