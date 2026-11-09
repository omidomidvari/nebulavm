export function triggerCrashScreen(message = 'NEBULA_SYSTEM_FAILURE', details = {}) {
  const rendered = [
    '',
    '',
    `Error: ${message}`,
    details.code ? `Code: ${details.code}` : '',
    details.source ? `Source: ${details.source}` : '',
    details.reason ? `Reason: ${details.reason}` : '',
    details.pc !== undefined ? `PC: ${details.pc}` : '',
    details.opcode !== undefined && details.opcode !== null ? `Opcode: ${details.opcode}` : '',
    details.registers ? `Registers: ${JSON.stringify(details.registers)}` : '',
    details.stack ? `Stack:\n${details.stack}` : '',
    '',
    'Nebula encountered a fatal system error and needs to restart.',
    '',
    'Stop code: 0x00000001',
    '',
    'If this is the first time you\'ve seen this message, restart your computer.',
    'If it appears again, check your system configuration.',
    '',
    'Please restart the program manually.'
  ].filter(Boolean).join('\n');

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
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
    if (typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('nebula:crash', { detail: { message, ...details } }));
  } else {
    console.error(rendered);
  }

  return { ok: true, message, details };
}

function detailLine(details) {
  const lines = [];
  if (details && typeof details === 'object') {
    if (details.source) lines.push(`source: ${details.source}`);
    if (details.stack) lines.push(`stack: ${details.stack}`);
    if (details.reason) lines.push(`reason: ${details.reason}`);
  }
  return lines.length ? lines.join('\n') : 'No additional diagnostic details were provided.';
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => triggerCrashScreen('NEBULA_SYSTEM_FAILURE', { source: 'window.error', reason: event.message, stack: event.error?.stack || '' }));
  window.addEventListener('unhandledrejection', (event) => triggerCrashScreen('NEBULA_SYSTEM_FAILURE', { source: 'unhandledrejection', reason: String(event.reason), stack: event.reason?.stack || '' }));
}

export default triggerCrashScreen;
