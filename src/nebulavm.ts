import { triggerCrashScreen } from '../crashscreen.js';
import { MnemonicByOpcode, OperandCount } from './opcodes.js';

export class VMExecutionError extends Error {
  constructor(message, { pc, opcode = null, registers = null } = {}) {
    super(message);
    this.name = 'VMExecutionError';
    this.pc = pc;
    this.opcode = opcode;
    this.registers = registers;
  }
}

export interface Registers { a: number; b: number; pc: number; zf: number; cf: number; of: number; }
export interface ExecutionSnapshot { pc: number; op: number; registers: Registers; }
export interface VMState { halted: boolean; cycleCount: number; registers: Registers; memory: Uint8Array; pc: number; }
export interface DebugInfo { debugLog: string[]; executionHistory: ExecutionSnapshot[]; currentState: VMState; }
export interface ExecutionResult { cyclesRun: number; totalCycles: number; halted: boolean; registers: Registers; }

export class NebulaVM {
    private memSize: number;
    private mem: Uint8Array;
    private regs: Registers;
    private halted: boolean;
    private cycleCount: number;
    private interruptController: InterruptController;
    private enableDebug: boolean;
    private debugLog: string[];
    private executionHistory: ExecutionSnapshot[];
    private maxHistorySize: number;

    constructor(memSize: number = 256, enableDebug: boolean = false) {
        if (!Number.isInteger(memSize) || memSize < 1 || memSize > 256) throw new RangeError('memSize must be an integer from 1 to 256.');
        this.memSize = memSize;
        this.mem = new Uint8Array(memSize);
        this.regs = { a: 0, b: 0, pc: 0, zf: 0, cf: 0, of: 0 };
        this.halted = true;
        this.cycleCount = 0;
        this.interruptController = new InterruptController();
        this.enableDebug = enableDebug;
        this.debugLog = [];
        this.executionHistory = [];
        this.maxHistorySize = 100;
    }

    flash(bytes: Uint8Array): void {
        if (!(bytes instanceof Uint8Array)) throw new TypeError('flash() expects Uint8Array');
        if (bytes.length > this.memSize) throw new RangeError(`Program too large: ${bytes.length} > ${this.memSize}`);
        this.mem.fill(0);
        this.mem.set(bytes);
        this.regs = { a: 0, b: 0, pc: 0, zf: 0, cf: 0, of: 0 };
        this.halted = false;
        this.cycleCount = 0;
        this.debugLog = [];
        this.executionHistory = [];
        if (this.enableDebug) this.debug(`Program flashed: ${bytes.length} bytes`);
    }

    step(): void {
        if (this.halted) return;
        try {
            this.interruptController.processPendingInterrupts(this);
            if (this.halted) return;
            const currentPC = this.regs.pc;
            if (!Number.isInteger(currentPC) || currentPC < 0 || currentPC >= this.memSize) {
                throw new VMExecutionError(`Program counter out of bounds: ${currentPC}`, { pc: currentPC, registers: { ...this.regs } });
            }
            const op = this.mem[this.regs.pc++];
            const mnemonic = MnemonicByOpcode[op];
            if (mnemonic === undefined) throw new VMExecutionError(`Invalid opcode 0x${op.toString(16).padStart(2, '0')}`, { pc: currentPC, opcode: op, registers: { ...this.regs } });
            this.recordExecution(currentPC, op);
            if (this.enableDebug) this.debug(`PC: 0x${currentPC.toString(16).padStart(2, '0')} | OP: 0x${op.toString(16).padStart(2, '0')}`);
            this.execute(op);
            this.cycleCount++;
        } catch (error) {
            this.halted = true;
            const failure = error instanceof Error ? error : new Error(String(error));
            if (this.enableDebug) this.debug(`Execution error: ${failure.message}`);
            triggerCrashScreen('NEBULA_SYSTEM_FAILURE', {
                source: 'NebulaVM', reason: failure.message,
                stack: failure.stack || '', pc: (error as any)?.pc ?? this.regs.pc,
                opcode: (error as any)?.opcode ?? null, registers: { ...this.regs },
            });
            throw failure;
        }
    }

    private execute(op: number): void {
        switch (op) {
            case 0x00: this.halted = true; break;
            case 0x01: this.regs.a = this.readOperand(); this.updateZeroFlag(this.regs.a); break;
            case 0x02: this.regs.b = this.readOperand(); this.updateZeroFlag(this.regs.b); break;
            case 0x03: { const result = this.regs.a + this.regs.b; this.regs.cf = result > 255 ? 1 : 0; this.regs.a = result & 255; this.updateZeroFlag(this.regs.a); break; }
            case 0x04: { const result = this.regs.a - this.regs.b; this.regs.cf = result < 0 ? 1 : 0; this.regs.a = result & 255; this.updateZeroFlag(this.regs.a); break; }
            case 0x05: { const result = this.regs.a - this.regs.b; this.regs.cf = result < 0 ? 1 : 0; this.updateZeroFlag(result & 255); break; }
            case 0x06: { const target = this.readOperand(); if (this.regs.zf) this.setPC(target); break; }
            case 0x07: this.setPC(this.readOperand()); break;
            case 0x08: this.interruptController.setInterruptsEnabled(true); break;
            case 0x09: this.interruptController.setInterruptsEnabled(false); break;
            case 0x0a: { const result = this.regs.a * this.regs.b; this.regs.cf = result > 255 ? 1 : 0; this.regs.a = result & 255; this.updateZeroFlag(this.regs.a); break; }
            case 0x0b: if (this.regs.b === 0) this.raiseInterrupt(0x06); else { this.regs.a = Math.floor(this.regs.a / this.regs.b); this.updateZeroFlag(this.regs.a); } break;
            case 0x0c: this.regs.a &= this.regs.b; this.updateZeroFlag(this.regs.a); break;
            case 0x0d: this.regs.a |= this.regs.b; this.updateZeroFlag(this.regs.a); break;
            case 0x0e: this.regs.a ^= this.regs.b; this.updateZeroFlag(this.regs.a); break;
            case 0x0f: this.regs.a = (~this.regs.a) & 255; this.updateZeroFlag(this.regs.a); break;
            case 0x10: this.regs.cf = (this.regs.a >>> 7) & 1; this.regs.a = (this.regs.a << 1) & 255; this.updateZeroFlag(this.regs.a); break;
            case 0x11: this.regs.cf = this.regs.a & 1; this.regs.a >>>= 1; this.updateZeroFlag(this.regs.a); break;
            case 0x12: this.writeMemory(this.readOperand(), this.regs.a); break;
            case 0x13: this.regs.a = this.readMemory(this.readOperand()); this.updateZeroFlag(this.regs.a); break;
            case 0x14: this.writeMemory(this.readOperand(), this.regs.b); break;
            case 0x15: { const result = this.regs.a + 1; this.regs.cf = result > 255 ? 1 : 0; this.regs.a = result & 255; this.updateZeroFlag(this.regs.a); break; }
            case 0x16: { const result = this.regs.a - 1; this.regs.cf = result < 0 ? 1 : 0; this.regs.a = result & 255; this.updateZeroFlag(this.regs.a); break; }
            case 0x17: [this.regs.a, this.regs.b] = [this.regs.b, this.regs.a]; break;
            case 0x18: break;
            default: throw new VMExecutionError(`Invalid opcode ${op}`, { pc: this.regs.pc - 1, opcode: op });
        }
    }

    private readOperand(): number {
        if (this.regs.pc < 0 || this.regs.pc >= this.memSize) throw new VMExecutionError(`Operand fetch out of bounds at PC ${this.regs.pc}`, { pc: this.regs.pc, registers: { ...this.regs } });
        return this.mem[this.regs.pc++];
    }
    private setPC(address: number): void {
        if (!Number.isInteger(address) || address < 0 || address >= this.memSize) throw new VMExecutionError(`Jump target out of bounds: ${address}`, { pc: this.regs.pc, registers: { ...this.regs } });
        this.regs.pc = address;
    }
    private readMemory(address: number): number {
        if (address < 0 || address >= this.memSize) throw new VMExecutionError(`Memory read out of bounds: ${address}`, { pc: this.regs.pc, registers: { ...this.regs } });
        return this.mem[address];
    }
    private writeMemory(address: number, value: number): void {
        if (address < 0 || address >= this.memSize) throw new VMExecutionError(`Memory write out of bounds: ${address}`, { pc: this.regs.pc, registers: { ...this.regs } });
        this.mem[address] = value & 255;
    }
    private updateZeroFlag(value: number): void { this.regs.zf = value === 0 ? 1 : 0; }
    private debug(message: string): void { if (this.enableDebug) { this.debugLog.push(`[Cycle ${this.cycleCount}] ${message}`); if (this.debugLog.length > 1000) this.debugLog.shift(); } }
    private recordExecution(pc: number, op: number): void { this.executionHistory.push({ pc, op, registers: { ...this.regs } }); if (this.executionHistory.length > this.maxHistorySize) this.executionHistory.shift(); }

    run(maxCycles: number = 10000): ExecutionResult {
        if (!Number.isInteger(maxCycles) || maxCycles < 0) throw new RangeError('maxCycles must be a non-negative integer.');
        let cycles = 0;
        while (!this.halted && cycles < maxCycles) { this.step(); cycles++; }
        return { cyclesRun: cycles, totalCycles: this.cycleCount, halted: this.halted, registers: { ...this.regs } };
    }
    getInterruptController(): InterruptController { return this.interruptController; }
    raiseInterrupt(interruptId: number): void { this.interruptController.raiseInterrupt(interruptId); }
    getState(): VMState { return { halted: this.halted, cycleCount: this.cycleCount, registers: { ...this.regs }, memory: new Uint8Array(this.mem), pc: this.regs.pc }; }
    getDebugInfo(): DebugInfo { return { debugLog: [...this.debugLog], executionHistory: [...this.executionHistory], currentState: this.getState() }; }
    reset(): void { this.mem.fill(0); this.regs = { a: 0, b: 0, pc: 0, zf: 0, cf: 0, of: 0 }; this.halted = true; this.cycleCount = 0; this.debugLog = []; this.executionHistory = []; this.interruptController.clearQueue(); }
}

import type { InterruptController as InterruptControllerType } from './interrupt.js';
export default NebulaVM;
