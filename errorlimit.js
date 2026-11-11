export class ErrorLimit {
  constructor(maxErrors = 20) {
    this.maxErrors = Number.isInteger(maxErrors) && maxErrors > 0 ? maxErrors : 20;
    this.count = 0;
  }

  /** Returns true while an error is within the allowed report budget. */
  allow() {
    this.count += 1;
    return this.count <= this.maxErrors;
  }

  reset() {
    this.count = 0;
  }
}

export const errorLimit = new ErrorLimit();
export default errorLimit;
