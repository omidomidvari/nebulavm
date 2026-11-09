import { InterruptController } from './src/interrupt.js';

/**
 * NebulaVM - A high-performance 8-bit virtual machine
 * Version 2.0 - Enhanced instruction set, better debugging, improved performance
 */
export class NebulaVM {
    memSize;
    mem;
    regs;
    halted;
    cycleCount;
    interruptController;
    enableDebug;
    debugLog;
    executionHistory;
    maxHistorySize;

    constructor(memSize = 256, enableDebug = false) {
        if (!Number.isInteger(memSize) || memSize < 1 || memSize > 256) {
            throw new RangeError('memSize must be an integer from 1 to 256.');
        }

        this.memSize = memSize;
        this.mem = new Uint8Array(memSize);
        this.regs = {
            a: 0,
            b: 0,
            pc: 0,
            zf: 0,
            cf: 0,
            of: 0,
        };
        this.halted = true;
        this.cycleCount = 0;
        this.interruptController = new InterruptController();
        this.enableDebug = enableDebug;
        this.debugLog = [];
        this.executionHistory = [];
        this.maxHistorySize = 100;
    }

    flash(bytes) {
        if (!(bytes instanceof Uint8Array)) {
            throw new TypeError('flash() expects Uint8Array');
        }
        if (bytes.length > this.memSize) {
            throw new RangeError(`Program too large: ${bytes.length} > ${this.memSize}`);
        }

        this.mem.fill(0);
        this.mem.set(bytes);
        this.regs = { a: 0, b: 0, pc: 0, zf: 0, cf: 0, of: 0 };
        this.halted = false;
        this.cycleCount = 0;
        this.debugLog = [];
        this.executionHistory = [];
        this.interruptController.clearQueue();

        if (this.enableDebug) {
            this.debug(`Program flashed: ${bytes.length} bytes`);
        }
    }

    step() {
        if (this.halted) return;

        const currentPC = this.regs.pc;
        let activeOpcode = null;

        try {
            this.interruptController.processPendingInterrupts(this);
            if (this.halted) return;

            if (!Number.isInteger(this.regs.pc) || this.regs.pc < 0 || this.regs.pc >= this.memSize) {
                throw new RangeError(`Program counter out of bounds: ${this.regs.pc}`);
            }

            const op = this.mem[this.regs.pc++];
            activeOpcode = op;

            if (this.enableDebug) {
                this.debug(`PC: 0x${currentPC.toString(16).padStart(2, '0')} | OP: 0x${op.toString(16).padStart(2, '0')}`);
            }

            this.recordExecution(currentPC, op);

            switch (op) {
                case 0x00: this.instr_HLT(); break;
                case 0x01: this.instr_LDA(); break;
                case 0x02: this.instr_LDB(); break;
                case 0x03: this.instr_ADD(); break;
                case 0x04: this.instr_SUB(); break;
                case 0x05: this.instr_CMP(); break;
                case 0x06: this.instr_JZ(); break;
                case 0x07: this.instr_JMP(); break;
                case 0x08: this.instr_SEI(); break;
                case 0x09: this.instr_CLI(); break;
                case 0x0A: this.instr_MUL(); break;
                case 0x0B: this.instr_DIV(); break;
                case 0x0C: this.instr_AND(); break;
                case 0x0D: this.instr_OR(); break;
                case 0x0E: this.instr_XOR(); break;
                case 0x0F: this.instr_NOT(); break;
                case 0x10: this.instr_SHL(); break;
                case 0x11: this.instr_SHR(); break;
                case 0x12: this.instr_STA(); break;
                case 0x13: this.instr_LDM(); break;
                case 0x14: this.instr_STM(); break;
                case 0x15: this.instr_INC(); break;
                case 0x16: this.instr_DEC(); break;
                case 0x17: this.instr_SWAP(); break;
                case 0x18: this.instr_NOP(); break;
                default:
                    throw new RangeError(`Invalid opcode 0x${op.toString(16).padStart(2, '0')}`);
            }
        } catch (error) {
            this.halted = true;
            if (this.enableDebug) {
                this.debug(`Execution error: ${error instanceof Error ? error.message : String(error)}`);
            }
            throw error;
        }

        this.cycleCount++;
    }

    run(maxCycles = 10000) {
        if (!Number.isInteger(maxCycles) || maxCycles < 0) {
            throw new RangeError('maxCycles must be a non-negative integer.');
        }

        let cycles = 0;
        while (!this.halted && cycles < maxCycles) {
            this.step();
            cycles++;
        }

        return {
            cyclesRun: cycles,
            totalCycles: this.cycleCount,
            halted: this.halted,
            registers: { ...this.regs },
        };
    }

    instr_HLT() {
        this.halted = true;
        if (this.enableDebug) this.debug('HLT: Halt');
    }

    instr_LDA() {
        const val = this.readOperand();
        this.regs.a = val;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`LDA 0x${val.toString(16).padStart(2, '0')} -> A`);
    }

    instr_LDB() {
        const val = this.readOperand();
        this.regs.b = val;
        this.updateZeroFlag(this.regs.b);
        if (this.enableDebug) this.debug(`LDB 0x${val.toString(16).padStart(2, '0')} -> B`);
    }

    instr_ADD() {
        const result = this.regs.a + this.regs.b;
        this.regs.cf = result > 0xFF ? 1 : 0;
        this.regs.a = result & 0xFF;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`ADD: A(0x${this.regs.a.toString(16).padStart(2, '0')}) + B = 0x${result.toString(16).padStart(2, '0')}, CF=${this.regs.cf}`);
    }

    instr_SUB() {
        const result = this.regs.a - this.regs.b;
        this.regs.cf = result < 0 ? 1 : 0;
        this.regs.a = result & 0xFF;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`SUB: A(0x${this.regs.a.toString(16).padStart(2, '0')}) - B = 0x${result.toString(16).padStart(2, '0')}, CF=${this.regs.cf}`);
    }

    instr_CMP() {
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`CMP: A=0x${this.regs.a.toString(16).padStart(2, '0')}, ZF=${this.regs.zf}`);
    }

    instr_JZ() {
        const addr = this.readOperand();
        if (this.regs.zf) {
            this.setPC(addr);
            if (this.enableDebug) this.debug(`JZ: Jump to 0x${addr.toString(16).padStart(2, '0')} (taken)`);
        } else if (this.enableDebug) {
            this.debug(`JZ: Jump not taken`);
        }
    }

    instr_JMP() {
        const addr = this.readOperand();
        this.setPC(addr);
        if (this.enableDebug) this.debug(`JMP: Unconditional jump to 0x${addr.toString(16).padStart(2, '0')}`);
    }

    instr_SEI() {
        this.interruptController.setInterruptsEnabled(true);
        if (this.enableDebug) this.debug('SEI: Interrupts enabled');
    }

    instr_CLI() {
        this.interruptController.setInterruptsEnabled(false);
        if (this.enableDebug) this.debug('CLI: Interrupts disabled');
    }

    instr_MUL() {
        const result = this.regs.a * this.regs.b;
        this.regs.cf = result > 0xFF ? 1 : 0;
        this.regs.a = result & 0xFF;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`MUL: A(0x${this.regs.a.toString(16).padStart(2, '0')}) * B = 0x${result.toString(16).padStart(2, '0')}, CF=${this.regs.cf}`);
    }

    instr_DIV() {
        if (this.regs.b === 0) {
            this.raiseInterrupt(0x06);
            if (this.enableDebug) this.debug('DIV: Division by zero!');
            return;
        }

        const result = Math.floor(this.regs.a / this.regs.b);
        this.regs.a = result & 0xFF;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`DIV: A(0x${this.regs.a.toString(16).padStart(2, '0')}) / B = 0x${result.toString(16).padStart(2, '0')}`);
    }

    instr_AND() {
        this.regs.a = this.regs.a & this.regs.b;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`AND: A &= B -> 0x${this.regs.a.toString(16).padStart(2, '0')}`);
    }

    instr_OR() {
        this.regs.a = this.regs.a | this.regs.b;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`OR: A |= B -> 0x${this.regs.a.toString(16).padStart(2, '0')}`);
    }

    instr_XOR() {
        this.regs.a = this.regs.a ^ this.regs.b;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`XOR: A ^= B -> 0x${this.regs.a.toString(16).padStart(2, '0')}`);
    }

    instr_NOT() {
        this.regs.a = (~this.regs.a) & 0xFF;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`NOT: A = ~A -> 0x${this.regs.a.toString(16).padStart(2, '0')}`);
    }

    instr_SHL() {
        this.regs.cf = (this.regs.a & 0x80) ? 1 : 0;
        this.regs.a = (this.regs.a << 1) & 0xFF;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`SHL: A <<= 1 -> 0x${this.regs.a.toString(16).padStart(2, '0')}, CF=${this.regs.cf}`);
    }

    instr_SHR() {
        this.regs.cf = this.regs.a & 0x01;
        this.regs.a = this.regs.a >> 1;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`SHR: A >>= 1 -> 0x${this.regs.a.toString(16).padStart(2, '0')}, CF=${this.regs.cf}`);
    }

    instr_STA() {
        const addr = this.readOperand();
        if (addr < 0 || addr >= this.memSize) {
            throw new RangeError(`Memory write out of bounds: ${addr}`);
        }
        this.mem[addr] = this.regs.a;
        if (this.enableDebug) this.debug(`STA: A(0x${this.regs.a.toString(16).padStart(2, '0')}) -> [0x${addr.toString(16).padStart(2, '0')}]`);
    }

    instr_LDM() {
        const addr = this.readOperand();
        if (addr < 0 || addr >= this.memSize) {
            throw new RangeError(`Memory read out of bounds: ${addr}`);
        }
        this.regs.a = this.mem[addr];
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`LDM: [0x${addr.toString(16).padStart(2, '0')}](0x${this.regs.a.toString(16).padStart(2, '0')}) -> A`);
    }

    instr_STM() {
        const addr = this.readOperand();
        if (addr < 0 || addr >= this.memSize) {
            throw new RangeError(`Memory write out of bounds: ${addr}`);
        }
        this.mem[addr] = this.regs.b;
        if (this.enableDebug) this.debug(`STM: B(0x${this.regs.b.toString(16).padStart(2, '0')}) -> [0x${addr.toString(16).padStart(2, '0')}]`);
    }

    instr_INC() {
        const result = this.regs.a + 1;
        this.regs.cf = result > 0xFF ? 1 : 0;
        this.regs.a = result & 0xFF;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`INC: A++ -> 0x${this.regs.a.toString(16).padStart(2, '0')}, CF=${this.regs.cf}`);
    }

    instr_DEC() {
        const result = this.regs.a - 1;
        this.regs.cf = result < 0 ? 1 : 0;
        this.regs.a = result & 0xFF;
        this.updateZeroFlag(this.regs.a);
        if (this.enableDebug) this.debug(`DEC: A-- -> 0x${this.regs.a.toString(16).padStart(2, '0')}, CF=${this.regs.cf}`);
    }

    instr_SWAP() {
        [this.regs.a, this.regs.b] = [this.regs.b, this.regs.a];
        if (this.enableDebug) this.debug(`SWAP: A <-> B (A=0x${this.regs.a.toString(16).padStart(2, '0')}, B=0x${this.regs.b.toString(16).padStart(2, '0')})`);
    }

    instr_NOP() {
        if (this.enableDebug) this.debug('NOP: No operation');
    }

    readOperand() {
        const pc = this.regs.pc;
        if (!Number.isInteger(pc) || pc < 0 || pc >= this.memSize) {
            throw new RangeError(`Operand fetch out of bounds at PC ${pc}`);
        }
        this.regs.pc += 1;
        return this.mem[pc];
    }

    setPC(address) {
        if (!Number.isInteger(address) || address < 0 || address >= this.memSize) {
            throw new RangeError(`Jump target out of bounds: ${address}`);
        }
        this.regs.pc = address;
    }

    updateZeroFlag(value) {
        this.regs.zf = value === 0 ? 1 : 0;
    }

    debug(message) {
        if (this.enableDebug) {
            this.debugLog.push(`[Cycle ${this.cycleCount}] ${message}`);
            if (this.debugLog.length > 1000) {
                this.debugLog.shift();
            }
        }
    }

    recordExecution(pc, op) {
        this.executionHistory.push({ pc, op, registers: { ...this.regs } });
        if (this.executionHistory.length > this.maxHistorySize) {
            this.executionHistory.shift();
        }
    }

    getInterruptController() {
        return this.interruptController;
    }

    raiseInterrupt(interruptId) {
        this.interruptController.raiseInterrupt(interruptId);
    }

    getState() {
        return {
            halted: this.halted,
            cycleCount: this.cycleCount,
            registers: { ...this.regs },
            memory: new Uint8Array(this.mem),
            pc: this.regs.pc,
        };
    }

    getDebugInfo() {
        return {
            debugLog: [...this.debugLog],
            executionHistory: [...this.executionHistory],
            currentState: this.getState(),
        };
    }

    reset() {
        this.mem.fill(0);
        this.regs = { a: 0, b: 0, pc: 0, zf: 0, cf: 0, of: 0 };
        this.halted = true;
        this.cycleCount = 0;
        this.debugLog = [];
        this.executionHistory = [];
        this.interruptController.clearQueue();
    }
}

export default NebulaVM;
