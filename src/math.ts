export const NebulaMath = {
    clamp8: (val: number): number => val & 0xFF,
    toHex: (val: number): string => val.toString(16).toUpperCase().padStart(2, '0'),
    isZero: (val: number): boolean => (val & 0xFF) === 0
};
