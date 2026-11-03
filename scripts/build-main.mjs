// Bundles the Electron main process and preload with esbuild.
import { build } from 'esbuild';

const common = { bundle: true, platform: 'node', target: 'node22', format: 'cjs', sourcemap: true, external: ['electron'], logLevel: 'info' };
await build({ ...common, entryPoints: ['main/main.ts'], outfile: 'out/main/main.cjs' });
await build({ ...common, entryPoints: ['preload/preload.ts'], outfile: 'out/preload/preload.cjs' });
