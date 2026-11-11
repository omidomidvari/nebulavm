const INSTRUCTIONS = Object.freeze({
  0x00: { name: 'HLT', operands: 0 },
  0x01: { name: 'LDA', operands: 1 },
  0x02: { name: 'LDB', operands: 1 },
  0x03: { name: 'ADD', operands: 0 },
  0x04: { name: 'SUB', operands: 0 },
  0x05: { name: 'CMP', operands: 0 },
  0x06: { name: 'JZ', operands: 1, address: true },
  0x07: { name: 'JMP', operands: 1, address: true },
  0x08: { name: 'SEI', operands: 0 },
  0x09: { name: 'CLI', operands: 0 },
  0x0a: { name: 'MUL', operands: 0 },
  0x0b: { name: 'DIV', operands: 0 },
  0x0c: { name: 'AND', operands: 0 },
  0x0d: { name: 'OR', operands: 0 },
  0x0e: { name: 'XOR', operands: 0 },
  0x0f: { name: 'NOT', operands: 0 },
  0x10: { name: 'SHL', operands: 0 },
  0x11: { name: 'SHR', operands: 0 },
  0x12: { name: 'STA', operands: 1, address: true },
  0x13: { name: 'LDM', operands: 1, address: true },
  0x14: { name: 'STM', operands: 1, address: true },
  0x15: { name: 'INC', operands: 0 },
  0x16: { name: 'DEC', operands: 0 },
  0x17: { name: 'SWAP', operands: 0 },
  0x18: { name: 'NOP', operands: 0 },
});

/** Inspect bytecode for invalid opcodes, missing operands, and invalid addresses. */
export function checkCorruptedFile(input, memSize = 256) {
  const errors = [];
  if (!(input instanceof Uint8Array)) {
    return { valid: false, errors: ['Program must be a Uint8Array.'] };
  }
  if (!Number.isInteger(memSize) || memSize < 1 || memSize > 256) {
    return { valid: false, errors: ['Memory size must be an integer from 1 to 256.'] };
  }
  if (input.length > memSize) {
    errors.push(`Program length ${input.length} exceeds memory size ${memSize}.`);
  }

  for (let pc = 0; pc < input.length;) {
    const instructionPC = pc;
    const opcode = input[pc++];
    const instruction = INSTRUCTIONS[opcode];
    if (!instruction) {
      errors.push(`Invalid opcode 0x${opcode.toString(16).padStart(2, '0')} at address ${instructionPC}.`);
      continue;
    }
    if (pc + instruction.operands > input.length) {
      errors.push(`${instruction.name} at address ${instructionPC} is missing an operand.`);
      break;
    }
    if (instruction.operands) {
      const address = input[pc];
      if (instruction.address && address >= memSize) {
        errors.push(`${instruction.name} at address ${instructionPC} references out-of-range address ${address}.`);
      }
      pc += instruction.operands;
    }
  }

  return { valid: errors.length === 0, errors };
}

export function assertValidProgram(input, memSize = 256) {
  const result = checkCorruptedFile(input, memSize);
  if (!result.valid) {
    const error = new Error(`Corrupted or invalid program: ${result.errors.join(' ')}`);
    error.code = 'NVM-2001';
    error.details = { errors: result.errors };
    throw error;
  }
  return input;
}

export default checkCorruptedFile;
