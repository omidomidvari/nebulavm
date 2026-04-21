export const NebulaAssembler = {
    compile: (source) => {
        const ops = { "LDA": 0x01, "LDB": 0x02, "ADD": 0x03, "STA": 0x04, "HLT": 0x00 };
        const tokens = source.split(/\s+/);
        const binary = [];

        for (let i = 0; i < tokens.length; i++) {
            const t = tokens[i].toUpperCase();
            if (ops[t] !== undefined) {
                binary.push(ops[t]);
                // If it takes an operand
                if (t === "LDA" || t === "LDB" || t === "STA") {
                    binary.push(parseInt(tokens[++i]));
                }
            }
        }
        return new Uint8Array(binary);
    }
};
