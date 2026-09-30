import { NebulaVM } from '../dist/src/nebulavm.js';

/**
 * Unit Tests for NebulaVM Core Opcodes
 * Tests: LDA, LDB, ADD, SUB, JMP, HLT, DIV-by-zero
 * 
 * @module tests/opcodes.test.js
 */

// Test utilities
class TestRunner {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(description, fn) {
    this.tests.push({ description, fn });
  }

  async run() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${this.name}`);
    console.log('='.repeat(60));

    for (const { description, fn } of this.tests) {
      try {
        await fn();
        console.log(`✓ ${description}`);
        this.passed++;
      } catch (error) {
        console.log(`✗ ${description}`);
        console.log(`  Error: ${error.message}`);
        this.failed++;
      }
    }

    console.log('='.repeat(60));
    console.log(`Results: ${this.passed} passed, ${this.failed} failed`);
    console.log('='.repeat(60));

    return this.failed === 0;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(
      message || `Expected ${expected}, but got ${actual}`
    );
  }
}

const tests = new TestRunner('NebulaVM Core Opcode Tests');

tests.test('LDA: Load immediate value into accumulator', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([0x01, 0x42]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.a, 0x42, 'Accumulator should contain 0x42');
  assertEqual(vm.regs.pc, 2, 'PC should advance by 2');
});

tests.test('LDA: Load zero into accumulator', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([0x01, 0x00]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.a, 0x00, 'Accumulator should contain 0x00');
  assertEqual(vm.regs.zf, 1, 'Zero flag should be set');
});

tests.test('LDA: Load max value into accumulator', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([0x01, 0xFF]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.a, 0xFF, 'Accumulator should contain 0xFF');
  assertEqual(vm.regs.zf, 0, 'Zero flag should not be set');
});

tests.test('LDB: Load immediate value into B register', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([0x02, 0x55]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.b, 0x55, 'B register should contain 0x55');
  assertEqual(vm.regs.pc, 2, 'PC should advance by 2');
});

tests.test('ADD: Simple addition without overflow', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([0x01, 0x10, 0x02, 0x20, 0x03]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0x30, 'A should be 0x30 (0x10 + 0x20)');
  assertEqual(vm.regs.cf, 0, 'Carry flag should not be set');
  assertEqual(vm.regs.zf, 0, 'Zero flag should not be set');
});

tests.test('SUB: Simple subtraction without borrow', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([0x01, 0x50, 0x02, 0x30, 0x04]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0x20, 'A should be 0x20 (0x50 - 0x30)');
  assertEqual(vm.regs.cf, 0, 'Carry flag should not be set');
});

tests.test('JMP: Jump to specified address', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([0x07, 0x10]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.pc, 0x10, 'PC should jump to 0x10');
});

tests.test('HLT: Halts execution', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([0x00]);
  vm.flash(program);
  assert(!vm.halted, 'VM should not be halted after flash');
  vm.step();
  assert(vm.halted, 'VM should be halted after HLT instruction');
});

tests.test('DIV by zero: Raises interrupt without halting', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([0x01, 0x10, 0x02, 0x00, 0x0B]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assert(!vm.halted, 'VM should not halt on division by zero');
  assertEqual(vm.regs.a, 0x10, 'A should remain unchanged');
});

(async () => {
  const success = await tests.run();
  process.exit(success ? 0 : 1);
})();
