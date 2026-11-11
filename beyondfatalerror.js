let fallbackReported = false;

/** Minimal last-resort reporter. Importing this module has no side effects. */
export function reportBeyondFatalError(error, details = {}) {
  if (fallbackReported) return false;
  fallbackReported = true;
  const message = error instanceof Error ? error.message : String(error);
  try {
    console.error('NEBULAVM FATAL ERROR (fallback reporter):', message, details);
  } catch {
    // Last-resort reporting must never throw while handling another failure.
  }
  return true;
}

export function resetBeyondFatalErrorForTests() {
  fallbackReported = false;
}
