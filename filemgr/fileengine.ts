export class FileEngine {
  private static memoryStore = new Map<string, string>();

  private static getStorage(): Storage | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const storage = globalThis.localStorage;
      const key = '__nebula_probe__';
      storage.setItem(key, key);
      storage.removeItem(key);
      return storage;
    } catch {
      return null;
    }
  }

  static save(name: string, data: Uint8Array): void {
    if (!name || typeof name !== 'string') {
      throw new Error('A file name is required.');
    }

    const key = `nvm_file_${name.trim()}`;
    const payload = JSON.stringify(Array.from(data));
    const storage = this.getStorage();

    if (storage) {
      storage.setItem(key, payload);
      return;
    }

    this.memoryStore.set(key, payload);
  }

  static load(name: string): Uint8Array | null {
    if (!name || typeof name !== 'string') {
      return null;
    }

    const key = `nvm_file_${name.trim()}`;
    const storage = this.getStorage();
    const raw = storage ? storage.getItem(key) : this.memoryStore.get(key) ?? null;

    if (raw === null) return null;

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) {
        throw new Error(`Stored file "${name}" is not a valid byte array.`);
      }
      return new Uint8Array(parsed);
    } catch {
      this.memoryStore.delete(key);
      return null;
    }
  }
}
