const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');

function startNebula() {
  console.log('The program may continue to boot... please wait');

  const child = spawn(process.execPath, ['--input-type=module', './nebulavm.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env,
  });

  child.on('exit', async (code, signal) => {
    if (code !== 0 && code !== null) {
      console.warn('Sorry. NebulaVM has crashed.');
      console.warn('Reboot activated...');

      try {
        const crashScreen = await import(pathToFileURL(require.resolve('./crashscreen.js')).href);
        if (typeof crashScreen.triggerCrashScreen === 'function') {
          crashScreen.triggerCrashScreen('NEBULA_SYSTEM_FAILURE', {
            source: 'crashpad.cjs',
            exitCode: code,
            signal: signal || 'unknown'
          });
        }
      } catch (error) {
        console.error('Crash screen failed to load:', error);
      }

      setTimeout(startNebula, 750);
    } else {
      console.log('No errors detected. Clean exit.');
    }
  });
}

startNebula();
