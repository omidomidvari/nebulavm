export class NebulaVM {
    constructor(memSize = 256) {
        this.mem = new Uint8Array(memSize);
        this.regs = { a: 0, b: 0, pc: 0 };
        this.halted = true;
    }

    flash(bytes) {
        this.mem.fill(0);
        this.mem.set(bytes);
        this.regs = { a: 0, b: 0, pc: 0 };
        this.halted = false;
    }

    step() {
        if (this.halted) return;
        const op = this.mem[this.regs.pc++];
        switch (op) {
            case 0x01: this.regs.a = this.mem[this.regs.pc++]; break; // LDA
            case 0x02: this.regs.b = this.mem[this.regs.pc++]; break; // LDB
            case 0x03: this.regs.a = (this.regs.a + this.regs.b) & 0xFF; break; // ADD
            case 0x04: this.mem[this.mem[this.regs.pc++]] = this.regs.a; break; // STA
            case 0x00: this.halted = true; break;
        }
    }
}
