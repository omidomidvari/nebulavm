import { InterruptController } from './src/interrupt.js';

export class NebulaVM {
    constructor(memSize = 256) {
        this.mem = new Uint8Array(memSize);
        this.regs = { a: 0, b: 0, pc: 0, zf: 0 };
        this.halted = true;
        this.interruptController = new InterruptController();
    }

    flash(bytes) {
        this.mem.fill(0);
        this.mem.set(bytes);
        this.regs = { a: 0, b: 0, pc: 0, zf: 0 };
        this.halted = false;
    }

    step() {
        // Process any pending interrupts before executing instruction
        this.interruptController.processPendingInterrupts(this);

        if (this.halted) return;
        const op = this.mem[this.regs.pc++];
        switch (op) {
            case 0x01: this.regs.a = this.mem[this.regs.pc++]; break; // LDA
            case 0x02: this.regs.b = this.mem[this.regs.pc++]; break; // LDB
            case 0x03: this.regs.a = (this.regs.a + this.regs.b) & 0xFF; break; // ADD
            case 0x04: this.mem[this.mem[this.regs.pc++]] = this.regs.a; break; // STA
            case 0x05: this.regs.zf = this.regs.a === 0 ? 1 : 0; break; // CMP (set zero flag)
            case 0x06: if (this.regs.zf) this.regs.pc = this.mem[this.regs.pc]; else this.regs.pc++; break; // JZ (jump if zero)
            case 0x07: this.regs.pc = this.mem[this.regs.pc]; break; // JMP (unconditional jump)
            case 0x08: this.interruptController.setInterruptsEnabled(true); break; // SEI (enable interrupts)
            case 0x09: this.interruptController.setInterruptsEnabled(false); break; // CLI (disable interrupts)
            case 0x00: this.halted = true; break; // HLT
        }
    }

    /**
     * Get the interrupt controller for registering handlers
     */
    getInterruptController() {
        return this.interruptController;
    }

    /**
     * Trigger an interrupt programmatically
     */
    raiseInterrupt(interruptId) {
        this.interruptController.raiseInterrupt(interruptId);
    }
}
