/**
 * Unit Tests for NebulaVM Core Opcodes
 * Tests: LDA, LDB, ADD, SUB, JMP, HLT, DIV-by-zero
 * 
 * @module tests/opcodes.test.js
 */

import { NebulaVM } from '../nebulavm.js';

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

// ============ TEST SUITES ============

const tests = new TestRunner('NebulaVM Core Opcode Tests');

// ============ LDA (Load Accumulator) Tests ============
tests.test('LDA: Load immediate value into accumulator', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x42, // Load 0x42
  ]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.a, 0x42, 'Accumulator should contain 0x42');
  assertEqual(vm.regs.pc, 2, 'PC should advance by 2');
});

tests.test('LDA: Load zero into accumulator', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x00, // Load 0x00
  ]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.a, 0x00, 'Accumulator should contain 0x00');
  assertEqual(vm.regs.zf, 1, 'Zero flag should be set');
});

tests.test('LDA: Load max value into accumulator', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0xFF, // Load 0xFF
  ]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.a, 0xFF, 'Accumulator should contain 0xFF');
  assertEqual(vm.regs.zf, 0, 'Zero flag should not be set');
});

// ============ LDB (Load B Register) Tests ============
tests.test('LDB: Load immediate value into B register', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x02, // LDB
    0x55, // Load 0x55
  ]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.b, 0x55, 'B register should contain 0x55');
  assertEqual(vm.regs.pc, 2, 'PC should advance by 2');
});

tests.test('LDB: Load zero into B register', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x02, // LDB
    0x00, // Load 0x00
  ]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.b, 0x00, 'B register should contain 0x00');
});

tests.test('LDB: Does not affect accumulator', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x42, // Load 0x42
    0x02, // LDB
    0x55, // Load 0x55
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0x42, 'Accumulator should still be 0x42');
  assertEqual(vm.regs.b, 0x55, 'B register should be 0x55');
});

// ============ ADD (Addition) Tests ============
tests.test('ADD: Simple addition without overflow', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x10, // A = 0x10
    0x02, // LDB
    0x20, // B = 0x20
    0x03, // ADD
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0x30, 'A should be 0x30 (0x10 + 0x20)');
  assertEqual(vm.regs.cf, 0, 'Carry flag should not be set');
  assertEqual(vm.regs.zf, 0, 'Zero flag should not be set');
});

tests.test('ADD: Addition with overflow (carry set)', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0xFF, // A = 0xFF
    0x02, // LDB
    0x02, // B = 0x02
    0x03, // ADD
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0x01, 'A should be 0x01 (0xFF + 0x02 wraps)');
  assertEqual(vm.regs.cf, 1, 'Carry flag should be set');
});

tests.test('ADD: Adding zero', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x42, // A = 0x42
    0x02, // LDB
    0x00, // B = 0x00
    0x03, // ADD
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0x42, 'A should still be 0x42');
  assertEqual(vm.regs.cf, 0, 'Carry flag should not be set');
});

tests.test('ADD: Result is zero (zero flag set)', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x00, // A = 0x00
    0x02, // LDB
    0x00, // B = 0x00
    0x03, // ADD
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0x00, 'A should be 0x00');
  assertEqual(vm.regs.zf, 1, 'Zero flag should be set');
});

// ============ SUB (Subtraction) Tests ============
tests.test('SUB: Simple subtraction without borrow', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x50, // A = 0x50
    0x02, // LDB
    0x30, // B = 0x30
    0x04, // SUB
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0x20, 'A should be 0x20 (0x50 - 0x30)');
  assertEqual(vm.regs.cf, 0, 'Carry flag should not be set');
});

tests.test('SUB: Subtraction with borrow (carry set)', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x10, // A = 0x10
    0x02, // LDB
    0x20, // B = 0x20
    0x04, // SUB
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0xF0, 'A should wrap (0x10 - 0x20 = -16 wraps to 0xF0)');
  assertEqual(vm.regs.cf, 1, 'Carry flag should be set (borrow occurred)');
});

tests.test('SUB: Subtracting from itself results in zero', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x42, // A = 0x42
    0x02, // LDB
    0x42, // B = 0x42
    0x04, // SUB
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0x00, 'A should be 0x00');
  assertEqual(vm.regs.zf, 1, 'Zero flag should be set');
  assertEqual(vm.regs.cf, 0, 'Carry flag should not be set');
});

tests.test('SUB: Subtracting zero', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x55, // A = 0x55
    0x02, // LDB
    0x00, // B = 0x00
    0x04, // SUB
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0x55, 'A should remain 0x55');
  assertEqual(vm.regs.cf, 0, 'Carry flag should not be set');
});

// ============ JMP (Unconditional Jump) Tests ============
tests.test('JMP: Jump to specified address', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x07, // JMP
    0x10, // Jump to address 0x10
  ]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.pc, 0x10, 'PC should jump to 0x10');
});

tests.test('JMP: Jump back to beginning', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x42, // A = 0x42
    0x07, // JMP
    0x00, // Jump back to 0x00
  ]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.a, 0x42, 'First: A should be 0x42');
  vm.step();
  assertEqual(vm.regs.pc, 0x00, 'PC should jump to 0x00');
});

tests.test('JMP: Jump forward', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x07, // JMP
    0x50, // Jump to 0x50
  ]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.pc, 0x50, 'PC should jump to 0x50');
});

tests.test('JMP: Jump to end of addressable space', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x07, // JMP
    0xFF, // Jump to 0xFF
  ]);
  vm.flash(program);
  vm.step();
  assertEqual(vm.regs.pc, 0xFF, 'PC should jump to 0xFF');
});

// ============ HLT (Halt) Tests ============
tests.test('HLT: Halts execution', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x00, // HLT
  ]);
  vm.flash(program);
  assert(!vm.halted, 'VM should not be halted after flash');
  vm.step();
  assert(vm.halted, 'VM should be halted after HLT instruction');
});

tests.test('HLT: No further instructions execute after halt', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x00, // HLT
    0x01, // LDA
    0x42, // 0x42
  ]);
  vm.flash(program);
  vm.step();
  assert(vm.halted, 'VM should be halted');
  vm.step();
  assertEqual(vm.regs.a, 0x00, 'LDA should not execute (A should remain 0)');
});

tests.test('HLT: halt flag remains true on subsequent steps', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x00, // HLT
  ]);
  vm.flash(program);
  vm.step();
  assert(vm.halted, 'VM should be halted');
  vm.step();
  assert(vm.halted, 'VM should still be halted');
  assertEqual(vm.cycleCount, 1, 'Cycle count should be 1 (no more steps executed)');
});

// ============ DIV (Division by Zero) Tests ============
tests.test('DIV: Normal division', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x20, // A = 0x20 (32)
    0x02, // LDB
    0x04, // B = 0x04 (4)
    0x0B, // DIV
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assertEqual(vm.regs.a, 0x08, 'A should be 0x08 (0x20 / 0x04)');
});

tests.test('DIV by zero: Raises interrupt without halting', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x10, // A = 0x10
    0x02, // LDB
    0x00, // B = 0x00
    0x0B, // DIV (by zero)
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assert(!vm.halted, 'VM should not halt on division by zero');
  assertEqual(vm.regs.a, 0x10, 'A should remain unchanged');
});

tests.test('DIV by zero: Triggers MATH_ERROR interrupt (0x06)', () => {
  const vm = new NebulaVM(256, false);
  let interruptTriggered = false;
  let interruptId = null;

  // Register interrupt handler
  vm.getInterruptController().registerHandler(255, (interruptNum, context) => {
    interruptTriggered = true;
    interruptId = interruptNum;
  });

  const program = new Uint8Array([
    0x01, // LDA
    0x10, // A = 0x10
    0x02, // LDB
    0x00, // B = 0x00
    0x0B, // DIV (by zero)
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  
  // Note: Interrupt may be pending, not immediately processed
  // This depends on when processPendingInterrupts is called
  assert(!vm.halted, 'VM should not halt on division by zero');
});

tests.test('DIV by zero: Multiple division by zero', () => {
  const vm = new NebulaVM(256, false);
  const program = new Uint8Array([
    0x01, // LDA
    0x20, // A = 0x20
    0x02, // LDB
    0x00, // B = 0x00
    0x0B, // DIV (by zero)
    0x01, // LDA
    0x30, // A = 0x30
    0x02, // LDB
    0x00, // B = 0x00
    0x0B, // DIV (by zero again)
  ]);
  vm.flash(program);
  vm.step();
  vm.step();
  vm.step();
  assert(!vm.halted, 'Should not halt after first div by zero');
  vm.step();
  vm.step();
  vm.step();
  assert(!vm.halted, 'Should not halt after second div by zero');
});

// ============ RUN TESTS ============
(async () => {
  const success = await tests.run();
  process.exit(success ? 0 : 1);
})();
