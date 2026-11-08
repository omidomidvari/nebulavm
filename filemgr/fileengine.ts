export class FileEngine {
    private static memoryStore = new Map<string, string>();

    static save(name: string, data: Uint8Array) {
        const payload = btoa(String.fromCharCode(...data));

        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`nvm_file_${name}`, payload);
            return;
        }

        this.memoryStore.set(`nvm_file_${name}`, payload);
    }

    static load(name: string): Uint8Array | null {
        const key = `nvm_file_${name}`;
        const raw = typeof localStorage !== 'undefined'
            ? localStorage.getItem(key)
            : this.memoryStore.get(key);

        if (!raw) return null;
        return new Uint8Array(atob(raw).split('').map((char) => char.charCodeAt(0)));
    }
}
