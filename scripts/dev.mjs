import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
// npm prepends ancestor node_modules/.bin folders to PATH. A stray `node`
// package there must not override the Node executable that started npm.
const node = process.env.npm_node_execpath || process.execPath;
const version = spawnSync(node, ['--version'], { encoding: 'utf8' });
const [major, minor] = (version.stdout || '').trim().replace(/^v/, '').split('.').map(Number);

if (version.status !== 0 || major !== 22 || minor < 16) {
  console.error('The Snap requires Node 22.16 or newer in the Node 22 release line. Use the version in .nvmrc, then run npm run dev.');
  process.exit(1);
}

const child = spawn(node, [
  '--use-system-ca',
  require.resolve('next/dist/bin/next'),
  'dev',
  ...process.argv.slice(2),
], { stdio: 'inherit', env: process.env });

child.on('error', (error) => {
  console.error(`Could not start the preview: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', (code) => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
