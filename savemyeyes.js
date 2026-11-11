const DEFAULT_LIMIT = 8000;

export function countAscii(input) {
  if (typeof input !== 'string') throw new TypeError('Input must be a string.');
  let count = 0;
  for (const character of input) {
    if (character.codePointAt(0) <= 0x7f) count += 1;
  }
  return count;
}

/** Keep large diagnostics readable and avoid dumping unbounded output. */
export function limitOutput(input, maxChars = DEFAULT_LIMIT, warn = console.warn) {
  const text = String(input);
  if (!Number.isInteger(maxChars) || maxChars < 1) throw new RangeError('maxChars must be a positive integer.');
  if (text.length <= maxChars) return text;
  if (typeof warn === 'function') warn(`Output truncated from ${text.length} to ${maxChars} characters.`);
  const suffix = '\n… output truncated …';
  return text.slice(0, Math.max(0, maxChars - suffix.length)) + suffix.slice(0, maxChars);
}

export default limitOutput;
