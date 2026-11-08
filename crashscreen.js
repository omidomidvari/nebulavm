export function triggerCrashScreen(message = 'NEBULA_SYSTEM_FAILURE', details = {}) {
  const rendered = [
    '',
    '',
    `Error: ${message}`,
    detailLine(details),
    '',
    'Nebula encountered a fatal system error and needs to restart.',
    '',
    'Stop code: 0x00000001',
    '',
    'If this is the first time you\'ve seen this message, restart your computer.',
    'If it appears again, check your system configuration.',
    '',
    'Please restart the program manually.'
  ].join('\n');

  if (typeof window !== 'undefined') {
    console.error(rendered);

    let overlay = document.getElementById('nebula-crash-screen');
    if (!overlay) {
      overlay = document.createElement('pre');
      overlay.id = 'nebula-crash-screen';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.margin = '0';
      overlay.style.padding = '2rem';
      overlay.style.background = '#090909';
      overlay.style.color = '#ff5c5c';
      overlay.style.fontFamily = 'monospace';
      overlay.style.whiteSpace = 'pre-wrap';
      overlay.style.overflow = 'auto';
      overlay.style.zIndex = '999999';
      overlay.style.boxSizing = 'border-box';
      document.body.appendChild(overlay);
    }

    overlay.textContent = rendered;
    window.dispatchEvent(new CustomEvent('nebula:crash', { detail: { message, ...details } }));
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

  if (lines.length === 0) {
    return 'at Object.<anonymous> (/box/index.js:1:7)';
  }

  return lines.join('\n');
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    triggerCrashScreen('NEBULA_SYSTEM_FAILURE', {
      source: 'window.error',
      reason: event.message,
      stack: event.error?.stack || ''
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    triggerCrashScreen('NEBULA_SYSTEM_FAILURE', {
      source: 'unhandledrejection',
      reason: String(event.reason),
      stack: event.reason?.stack || ''
    });
  });
}

export default triggerCrashScreen;
