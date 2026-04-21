export class FileEngine {
    static save(name: string, data: Uint8Array) {
        localStorage.setItem(`nvm_file_${name}`, btoa(String.fromCharCode(...data)));
    }

    static load(name: string): Uint8Array | null {
        const raw = localStorage.getItem(`nvm_file_${name}`);
        if (!raw) return null;
        return new Uint8Array(atob(raw).split("").map(c => c.charCodeAt(0)));
    }
}
