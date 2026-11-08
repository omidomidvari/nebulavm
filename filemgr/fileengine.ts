export class FileEngine {
  private static memoryStore = new Map<string, string>();

  static save(name: string, data: Uint8Array): void {
    if (!name) throw new Error('A file name is required.');
    const key = `nvm_file_${name}`;
    const payload = JSON.stringify(Array.from(data));
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, payload);
      return;
    }
    this.memoryStore.set(key, payload);
  }

  static load(name: string): Uint8Array | null {
    const key = `nvm_file_${name}`;
    const raw = typeof localStorage !== 'undefined'
      ? localStorage.getItem(key)
      : this.memoryStore.get(key) ?? null;

    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
      throw new Error(`Stored file "${name}" is not a valid byte array.`);
    }
    return new Uint8Array(parsed);
  }
}
