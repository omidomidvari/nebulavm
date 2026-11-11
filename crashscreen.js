import { fatalErrorManagement } from './fatalerrormanagemt.js';
import { limitOutput } from './savemyeyes.js';

export function triggerCrashScreen(message = 'NEBULA_SYSTEM_FAILURE', details = {}) {
  const fatalError = fatalErrorManagement.report(message, details);
  const errorDetails = fatalError.details;
  const rendered = limitOutput([
    '',
    '',
    `Error: ${fatalError.message}`,
    fatalError.code ? `Code: ${fatalError.code}` : '',
    fatalError.source !== 'unknown' ? `Source: ${fatalError.source}` : '',
    errorDetails.reason ? `Reason: ${errorDetails.reason}` : '',
    errorDetails.pc !== undefined ? `PC: ${errorDetails.pc}` : '',
    errorDetails.opcode !== undefined && errorDetails.opcode !== null ? `Opcode: ${errorDetails.opcode}` : '',
    errorDetails.registers ? `Registers: ${JSON.stringify(errorDetails.registers)}` : '',
    errorDetails.stack ? `Stack:\n${errorDetails.stack}` : '',
    '',
    'Nebula encountered a fatal system error and needs to restart.',
    '',
    'Stop code: 0x00000001',
    '',
    'If this is the first time you\'ve seen this message, restart your computer.',
    'If it appears again, check your system configuration.',
    '',
    'Please restart the program manually.',
  ].filter(Boolean).join('\n'));

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    try {
      console.error(rendered);
      let overlay = document.getElementById('nebula-crash-screen');
      if (!overlay) {
        overlay = document.createElement('pre');
        overlay.id = 'nebula-crash-screen';
        Object.assign(overlay.style, {
          position: 'fixed', inset: '0', margin: '0', padding: '2rem',
          background: '#090909', color: '#ff5c5c', fontFamily: 'monospace',
          whiteSpace: 'pre-wrap', overflow: 'auto', zIndex: '999999', boxSizing: 'border-box',
        });
        (document.body || document.documentElement).appendChild(overlay);
      }
      overlay.textContent = rendered;
      if (typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nebula:crash', {
          detail: { message: fatalError.message, ...errorDetails },
        }));
      }
    } catch (renderError) {
      console.error('Unable to render Nebula crash screen:', renderError);
    }
  } else {
    console.error(rendered);
  }

  return { ok: true, message: fatalError.message, details: errorDetails, error: fatalError };
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => triggerCrashScreen('NEBULA_SYSTEM_FAILURE', {
    source: 'window.error', reason: event.message, stack: event.error?.stack || '',
  }));
  window.addEventListener('unhandledrejection', (event) => triggerCrashScreen('NEBULA_SYSTEM_FAILURE', {
    source: 'unhandledrejection', reason: String(event.reason), stack: event.reason?.stack || '',
  }));
}

export default triggerCrashScreen;
