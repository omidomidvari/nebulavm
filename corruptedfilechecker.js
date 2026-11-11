import { errorcode } from './errorcodes.js';
const INSTRUCTIONS = {
    HLT:  { opcode: 0x00, operands: 0 },
    LDA:  { opcode: 0x01, operands: 1, type: "byte" },
    LDB:  { opcode: 0x02, operands: 1, type: "byte" },
    ADD:  { opcode: 0x03, operands: 0 },
    SUB:  { opcode: 0x04, operands: 0 },
    CMP:  { opcode: 0x05, operands: 0 },
    JZ:   { opcode: 0x06, operands: 1, type: "address" },
    JMP:  { opcode: 0x07, operands: 1, type: "address" },
    SEI:  { opcode: 0x08, operands: 0 },
    CLI:  { opcode: 0x09, operands: 0 },
    MUL:  { opcode: 0x0A, operands: 0 },
    DIV:  { opcode: 0x0B, operands: 0 },
    AND:  { opcode: 0x0C, operands: 0 },
    OR:   { opcode: 0x0D, operands: 0 },
    XOR:  { opcode: 0x0E, operands: 0 },
    NOT:  { opcode: 0x0F, operands: 0 },
    SHL:  { opcode: 0x10, operands: 0 },
    SHR:  { opcode: 0x11, operands: 0 },
    STA:  { opcode: 0x12, operands: 1, type: "address" },
    LDM:  { opcode: 0x13, operands: 1, type: "address" },
    STM:  { opcode: 0x14, operands: 1, type: "address" },
    INC:  { opcode: 0x15, operands: 0 },
    DEC:  { opcode: 0x16, operands: 0 },
    SWAP: { opcode: 0x17, operands: 0 },
    NOP:  { opcode: 0x18, operands: 0 }
};

export const NebulaAssembler = {
    compile(source, memSize = 256) {
        if (typeof source !== "string") {
            throw new TypeError("Assembly source must be a string.");
        }

        if (!Number.isInteger(memSize) || memSize < 1 || memSize > 256) {
            throw new Error("Memory size must be an integer from 1 to 256 bytes.");
        }

        const binary = [];
        const lines = source.split(/\r?\n/);

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            // Remove ';' comments, then ignore blank lines.
            const line = lines[lineIndex].split(";")[0].trim();
            if (!line) continue;

            const parts = line.split(/\s+/);
            const instructionName = parts[0].toUpperCase();
            const instruction = INSTRUCTIONS[instructionName];
            const lineNumber = lineIndex + 1;

            if (!instruction) {
                throw new Error(
                    `Line ${lineNumber}: Unknown instruction "${parts[0]}".`
                );
            }

            const operands = parts.slice(1);

            if (operands.length !== instruction.operands) {
                throw new Error(
                    `Line ${lineNumber}: ${instructionName} expects ` +
                    `${instruction.operands} operand(s), but got ${operands.length}.`
                );
            }

            binary.push(instruction.opcode);

            if (instruction.operands === 1) {
                const operandText = operands[0];

                // Accept decimal numbers (42) or hex numbers (0x2A).
                if (!/^(?:\d+|0x[0-9a-f]+)$/i.test(operandText)) {
                    throw new Error(
                        `Line ${lineNumber}: "${operandText}" is not a valid number.`
                    );
                }

                const value = Number(operandText);

                if (!Number.isInteger(value) || value < 0 || value > 0xFF) {
                    throw new Error(
                        `Line ${lineNumber}: Operand must fit in one byte (0–255).`
                    );
                }

                if (instruction.type === "address" && value >= memSize) {
                    throw new Error(
                        `Line ${lineNumber}: Address ${value} is outside ` +
                        `the VM memory range (0–${memSize - 1}).`
                    );
                }

                binary.push(value);
            }

            if (binary.length > memSize) {
                throw new Error(
                    `Program is too large: ${binary.length} bytes exceeds ` +
                    `${memSize}-byte memory.`
                );
            }
        }

        return new Uint8Array(binary);
    }
};

if (!instruction) {
    errorcode === 10000
   require('fatalerror.js')
}