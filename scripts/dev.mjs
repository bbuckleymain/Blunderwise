// Dev: vite dev server for the renderer + Electron pointed at it.
import { spawn } from 'node:child_process';
import { createServer } from 'vite';
import electron from 'electron';

await import('./build-main.mjs');
const server = await createServer({ configFile: 'vite.config.ts' });
await server.listen();
const url = `http://localhost:${server.config.server.port}`;
const child = spawn(String(electron), ['.'], { stdio: 'inherit', env: { ...process.env, VITE_DEV_SERVER_URL: url } });
child.on('exit', async (code) => {
  await server.close();
  process.exit(code ?? 0);
});
