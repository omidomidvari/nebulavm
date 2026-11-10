export class FatalError extends Error {
  constructor(message = 'NEBULA_SYSTEM_FAILURE', details = {}) {
    super(String(message));
    this.name = 'FatalError';
    this.code = typeof details.code === 'string' ? details.code : 'NVM-0000';
    this.source = typeof details.source === 'string' ? details.source : 'unknown';
    this.details = Object.freeze({ ...details });
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      source: this.source,
      details: this.details,
      stack: this.stack || '',
    };
  }
}

export function normalizeFatalError(error, details = {}) {
  const message = error instanceof Error ? error.message : String(error);
  const errorDetails = {
    ...(error instanceof FatalError ? error.details : {}),
    ...(error instanceof Error && error.stack ? { stack: error.stack } : {}),
    ...details,
  };

  return new FatalError(message, errorDetails);
}
