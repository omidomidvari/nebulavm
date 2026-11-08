export const NebulaAssembler = {
    compile(source) {
        const ops = {
            LDA: 0x01,
            LDB: 0x02,
            ADD: 0x03,
            SUB: 0x04,
            CMP: 0x05,
            JZ: 0x06,
            JMP: 0x07,
            SEI: 0x08,
            CLI: 0x09,
            MUL: 0x0A,
            DIV: 0x0B,
            AND: 0x0C,
            OR: 0x0D,
            XOR: 0x0E,
            NOT: 0x0F,
            SHL: 0x10,
            SHR: 0x11,
            STA: 0x12,
            LDM: 0x13,
            STM: 0x14,
            INC: 0x15,
            DEC: 0x16,
            SWAP: 0x17,
            NOP: 0x18,
            HLT: 0x00,
        };

        const instructionsWithOperand = new Set(['LDA', 'LDB', 'STA', 'LDM', 'STM', 'JZ', 'JMP', 'INC', 'DEC']);
        const cleanedSource = String(source || '')
            .replace(/;.*$/gm, '')
            .replace(/\s+/g, ' ')
            .trim();

        if (!cleanedSource) {
            return new Uint8Array();
        }

        const tokens = cleanedSource.split(/\s+/);
        const binary = [];

        for (let i = 0; i < tokens.length; i += 1) {
            const rawToken = tokens[i];
            if (!rawToken || rawToken === ':') continue;

            const token = rawToken.replace(/\[|\]|,|:/g, '').toUpperCase();
            const op = ops[token];

            if (op === undefined) {
                if (/^0X[0-9A-F]+$/i.test(token) || /^\d+$/.test(token)) {
                    binary.push(parseInt(token, 16));
                }
                continue;
            }

            binary.push(op);

            if (instructionsWithOperand.has(token)) {
                const nextToken = tokens[++i];
                if (nextToken === undefined) {
                    throw new Error(`Instruction ${token} is missing an operand.`);
                }

                const operand = nextToken.replace(/\[|\]|,|:/g, '');
                const parsed = /^0X[0-9A-F]+$/i.test(operand) || /^-?\d+$/.test(operand)
                    ? Number.parseInt(operand, /^0X/i.test(operand) ? 16 : 10)
                    : Number.parseInt(operand, 10);

                if (Number.isNaN(parsed)) {
                    throw new Error(`Invalid operand for ${token}: ${nextToken}`);
                }

                binary.push(parsed & 0xFF);
            }
        }

        return new Uint8Array(binary);
    },
};
