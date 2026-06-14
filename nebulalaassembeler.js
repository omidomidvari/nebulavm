export const NebulaAssembler = {
    compile: (source) => {
        const ops = { 
            "LDA": 0x01,   // Load Accumulator
            "LDB": 0x02,   // Load B Register
            "ADD": 0x03,   // Add A + B -> A
            "STA": 0x04,   // Store Accumulator
            "CMP": 0x05,   // Compare (set zero flag)
            "JZ":  0x06,   // Jump if Zero
            "JMP": 0x07,   // Unconditional Jump
            "SEI": 0x08,   // Set interrupt Enable
            "CLI": 0x09,   // CLear Interrupt (disable)
            "HLT": 0x00    // Halt
        };
        const tokens = source.split(/\s+/);
        const binary = [];

        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i].toUpperCase();
            if (ops[t] !== undefined) {
                binary.push(ops[t]);
                // If it takes an operand
                if (t === "LDA" || t === "LDB" || t === "STA" || t === "JZ" || t === "JMP") {
                    binary.push(parseInt(tokens[++i]));
                }
            }
        }
        return new Uint8Array(binary);
    }
};
