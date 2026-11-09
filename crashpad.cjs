const { spawn } = require('node:child_process');
const path = require('node:path');

const entry = path.join(__dirname, 'dist', 'main.js');
const maxRestarts = Math.max(0, Number.parseInt(process.env.NEBULA_MAX_RESTARTS || '5', 10) || 0);
let restarts = 0;
let stopping = false;
let child;

function shutdown(signal) {
  stopping = true;
  if (child && child.exitCode === null) child.kill(signal);
}
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

function startNebula() {
  if (stopping) return;
  console.log('Starting NebulaVM...');
  child = spawn(process.execPath, [entry], { cwd: __dirname, stdio: 'inherit', env: process.env });
  child.once('error', (error) => { console.error('Unable to start NebulaVM:', error); process.exitCode = 1; });
  child.once('exit', (code, signal) => {
    if (stopping) return;
    if (code === 0 && signal === null) { console.log('NebulaVM exited cleanly.'); return; }
    console.error(`NebulaVM crashed (code=${code}, signal=${signal}).`);
    import('./crashscreen.js').then(({ triggerCrashScreen }) => triggerCrashScreen('NEBULA_SYSTEM_FAILURE', { source: 'crashpad.cjs', exitCode: code, signal })).catch((error) => console.error('Crash screen failed to load:', error));
    if (restarts >= maxRestarts) { console.error(`Restart limit (${maxRestarts}) reached; stopping.`); process.exitCode = 1; return; }
    const delay = Math.min(30000, 750 * (2 ** restarts++));
    console.warn(`Restarting in ${delay}ms (${restarts}/${maxRestarts})...`);
    setTimeout(startNebula, delay);
  });
}

startNebula();
