/** Stable error identifiers exposed by NebulaVM. Add values; do not reuse existing codes. */
export const NebulaErrorCode = {
  UNKNOWN: 'NVM-0000',
  INVALID_ARGUMENT: 'NVM-1001',
  PROGRAM_TOO_LARGE: 'NVM-1002',
  INVALID_OPCODE: 'NVM-2001',
  PC_OUT_OF_BOUNDS: 'NVM-2002',
  OPERAND_OUT_OF_BOUNDS: 'NVM-2003',
  JUMP_OUT_OF_BOUNDS: 'NVM-2004',
  MEMORY_READ_OUT_OF_BOUNDS: 'NVM-2005',
  MEMORY_WRITE_OUT_OF_BOUNDS: 'NVM-2006',
  INTERRUPT_HANDLER_FAILED: 'NVM-3001',
  STORAGE_FAILED: 'NVM-4001',
} as const;

export type NebulaErrorCode = (typeof NebulaErrorCode)[keyof typeof NebulaErrorCode];

export class NebulaError extends Error {
  readonly code: NebulaErrorCode;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(code: NebulaErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'NebulaError';
    this.code = code;
    this.details = Object.freeze({ ...details });
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): { name: string; code: NebulaErrorCode; message: string; details: Readonly<Record<string, unknown>> } {
    return { name: this.name, code: this.code, message: this.message, details: this.details };
  }
}

export function isNebulaError(error: unknown): error is NebulaError {
  return error instanceof NebulaError;
}

export function formatNebulaError(error: unknown): string {
  if (error instanceof NebulaError) return `[${error.code}] ${error.message}`;
  if (error instanceof Error) return `[${NebulaErrorCode.UNKNOWN}] ${error.message}`;
  return `[${NebulaErrorCode.UNKNOWN}] ${String(error)}`;
}
