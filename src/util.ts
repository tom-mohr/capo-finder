export function mod(a: number, b: number) {
    while (a < 0) a += b;
    while (a >= b) a -= b;
    return a;
}
