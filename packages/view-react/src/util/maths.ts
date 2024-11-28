export const distribute = (min: number, max: number, n: number, i: number): number =>
    min + ((i + 1) * (max - min)) / (n + 1);

export const mean = (...xs: number[]): number => xs.reduce((a, b) => a + b) / xs.length;
