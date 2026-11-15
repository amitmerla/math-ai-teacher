// Exact fractions. Every answer in the app is checked with these, never with AI.

export const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };

export class F {
    constructor(n, d = 1) {
        if (!d) throw new RangeError('division by zero');
        if (d < 0) { n = -n; d = -d; }
        const g = gcd(n, d);
        this.n = n / g;
        this.d = d / g;
    }
    add(o) { return new F(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { return new F(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { return new F(this.n * o.n, this.d * o.d); }
    div(o) { return new F(this.n * o.d, this.d * o.n); }
    eq(o) { return this.n === o.n && this.d === o.d; }
    cmp(o) { return this.n * o.d - o.n * this.d; }
    /** Math markup (see math.js): "7", "3/8" or the mixed number "1_1/6". */
    mk(mixed = true) {
        if (this.d === 1) return String(this.n);
        if (mixed && this.n > this.d) {
            const w = Math.floor(this.n / this.d);
            return `${w}_${this.n - w * this.d}/${this.d}`;
        }
        return `${this.n}/${this.d}`;
    }
}

export const f = (n, d = 1) => new F(n, d);
export const ONE = f(1);
