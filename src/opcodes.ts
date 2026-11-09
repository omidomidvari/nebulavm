export const Opcode = Object.freeze({
  HLT: 0x00,
  LDA: 0x01,
  LDB: 0x02,
  ADD: 0x03,
  SUB: 0x04,
  CMP: 0x05,
  JZ: 0x06,
  JMP: 0x07,
  SEI: 0x08,
  CLI: 0x09,
  MUL: 0x0a,
  DIV: 0x0b,
  AND: 0x0c,
  OR: 0x0d,
  XOR: 0x0e,
  NOT: 0x0f,
  SHL: 0x10,
  SHR: 0x11,
  STA: 0x12,
  LDM: 0x13,
  STM: 0x14,
  INC: 0x15,
  DEC: 0x16,
  SWAP: 0x17,
  NOP: 0x18,
});

export const OperandCount: Record<number, number> = {
  [Opcode.LDA]: 1,
  [Opcode.LDB]: 1,
  [Opcode.JZ]: 1,
  [Opcode.JMP]: 1,
  [Opcode.STA]: 1,
  [Opcode.LDM]: 1,
  [Opcode.STM]: 1,
};

export const MnemonicByOpcode: Record<number, string> = Object.fromEntries(
  Object.entries(Opcode).map(([name, value]) => [Number(value), name]),
);
