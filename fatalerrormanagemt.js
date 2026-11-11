import { errorLimit } from './errorlimit.js';
import { reportBeyondFatalError } from './beyondfatalerror.js';
import { normalizeFatalError } from './fatalerror.js';

export class FatalErrorManagement {
  constructor(maxHistory = 50) {
    this.maxHistory = Number.isInteger(maxHistory) && maxHistory > 0 ? maxHistory : 50;
    this.history = [];
    this.listeners = new Set();
  }

  report(error, details = {}) {
    const fatalError = normalizeFatalError(error, details);
    if (!errorLimit.allow()) {
      reportBeyondFatalError(fatalError, details);
      return fatalError;
    }

    this.history.push(fatalError);
    if (this.history.length > this.maxHistory) this.history.shift();
    for (const listener of [...this.listeners]) {
      try {
        listener(fatalError);
      } catch (listenerError) {
        try { console.error('Fatal error listener failed:', listenerError); } catch { /* no-op */ }
      }
    }
    return fatalError;
  }

  subscribe(listener) {
    if (typeof listener !== 'function') throw new TypeError('Fatal error listener must be a function.');
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getHistory() {
    return this.history.map((error) => error.toJSON());
  }

  clearHistory() {
    this.history.length = 0;
    errorLimit.reset();
  }
}

export const fatalErrorManagement = new FatalErrorManagement();
