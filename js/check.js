// Checks a pupil's written way, line by line, with exact fractions (no AI here).
//
// A line is what the pupil wrote, as text: "1/4 x 2/5 = (1x2)/(4x5) = 2/20 = 1/10".
// Every "=" is checked: do both sides have the same value?

import { f, gcd } from './frac.js';

/** Make typed or AI-read text uniform. */
export function normalize(src) {
    return String(src ?? '')
        .replace(/\\d?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)')
        .replace(/\\times|\\cdot|[×✕✖*·•]/g, 'x')
        .replace(/(?<=[\d)\s])X(?=[\d(\s])/g, 'x')
        .replace(/\\div|÷/g, ':')
        .replace(/[−–—]/g, '-')
        .replace(/[⁄∕]/g, '/')
        .replace(/_/g, ' ')
        .replace(/(?<=\d)[.,](?=\d{3}(?!\d))/g, '')    // 1,200 / 1,457,987 / 16.000 are whole numbers
        .replace(/[֐-׿$\\]+/g, ' ')             // Hebrew words, LaTeX leftovers
        .replace(/\s+/g, ' ')
        .trim();
}

function lex(src) {
    const out = [];
    const re = /\s*(\d+|[x:+\-()/])/gy;
    let pos = 0;
    for (;;) {
        re.lastIndex = pos;
        const m = re.exec(src);
        if (!m) break;
        out.push({ t: m[1], spaced: /^\s/.test(m[0]) });
        pos = re.lastIndex;
    }
    return src.slice(pos).trim() ? null : out;
}

function parseTokens(toks) {
    let i = 0;
    const peek = () => toks[i]?.t;
    const isNum = k => k < toks.length && /^\d+$/.test(toks[k].t);

    function primary() {
        const t = peek();
        if (t === '(') {
            i += 1;
            const v = expr();
            if (peek() !== ')') throw new SyntaxError('missing )');
            i += 1;
            return v;
        }
        if (isNum(i)) { i += 1; return f(Number(t)); }
        throw new SyntaxError('number expected');
    }
    function unary() {
        // Mixed number: "1 1/6" (a number, a space, then a simple fraction).
        if (isNum(i) && isNum(i + 1) && toks[i + 1].spaced && toks[i + 2]?.t === '/' && isNum(i + 3)) {
            const [w, n, d] = [toks[i].t, toks[i + 1].t, toks[i + 3].t].map(Number);
            i += 4;
            return f(w).add(f(n, d));
        }
        let v = primary();
        if (peek() === '/') { i += 1; v = v.div(primary()); }
        return v;
    }
    function term() {
        let v = unary();
        while (peek() === 'x' || peek() === ':') {
            const op = toks[i++].t;
            const r = unary();
            v = op === 'x' ? v.mul(r) : v.div(r);
        }
        return v;
    }
    function expr() {
        let v = term();
        while (peek() === '+' || peek() === '-') {
            const op = toks[i++].t;
            const r = term();
            v = op === '+' ? v.add(r) : v.sub(r);
        }
        return v;
    }
    const v = expr();
    if (i < toks.length) throw new SyntaxError('unexpected ' + peek());
    return v;
}

const tryParse = toks => { try { return parseTokens(toks); } catch { return null; } };

/**
 * One side of an "=".
 * Returns { src, values, lit } where values are the possible readings ([] when unreadable)
 * and lit is { w, n, d } when the side is a single number, fraction or mixed number.
 */
export function parseSide(src) {
    const toks = lex(src);
    const side = { src, values: [], lit: null };
    if (!toks?.length) return side;

    // "1x2/4x5" written flat almost always means one tall fraction: (1x2)/(4x5).
    // That reading comes first (and is how the side is drawn); the strict reading is kept as a second chance.
    const slashes = toks.map((t, k) => (t.t === '/' ? k : -1)).filter(k => k >= 0);
    const flat = toks.every(t => /^\d+$/.test(t.t) || t.t === 'x' || t.t === '/');
    const above = toks.slice(0, slashes[0]);
    const below = toks.slice(slashes[0] + 1);
    // Only with a "x" on both sides of the slash: "2/5 x 100" stays 2/5 times 100.
    if (slashes.length === 1 && flat && above.some(t => t.t === 'x') && below.some(t => t.t === 'x')) {
        const top = tryParse(above);
        const bottom = tryParse(below);
        try {
            if (top && bottom) {
                side.values.push(top.div(bottom));
                side.src = `(${above.map(t => t.t).join(' ')})/(${below.map(t => t.t).join(' ')})`;
            }
        } catch { /* ÷0 */ }
    }

    const main = tryParse(toks);
    if (main && !side.values.some(v => v.eq(main))) side.values.push(main);

    const ts = toks.map(t => t.t);
    const num = k => Number(ts[k]);
    if (ts.length === 1 && /^\d+$/.test(ts[0])) side.lit = { w: num(0) };
    else if (ts.length === 3 && ts[1] === '/' && /^\d+$/.test(ts[0] + ts[2])) side.lit = { n: num(0), d: num(2) };
    else if (ts.length === 4 && ts[2] === '/' && toks[1].spaced && /^\d+$/.test(ts[0] + ts[1] + ts[3])) side.lit = { w: num(0), n: num(1), d: num(3) };
    return side;
}

/** Text as read → math markup for drawing (see math.js). */
export function toMarkup(src) {
    return src
        .replace(/\(([^()]*)\)\s*\/\s*\(([^()]*)\)/g, (_, a, b) => `[${space(a)}]/[${space(b)}]`)
        .replace(/\(([^()]*)\)\s*\/\s*(\d+)/g, (_, a, b) => `[${space(a)}]/[${b}]`)
        .replace(/(\d+) (\d+)\/(\d+)/g, '$1_$2/$3')
        .replace(/\s*([x:+\-=<>()])\s*(?![^[]*\])/g, ' $1 ')
        .replace(/(\d+)\s*\/\s*(\d+)(?![^[]*\])/g, '$1/$2')
        .replace(/\s+/g, ' ')
        .trim();
}
const space = s => s.replace(/\s*([x:+\-])\s*/g, ' $1 ').trim();

const same = (a, b) => a.values.some(x => b.values.some(y => x.eq(y)));

/**
 * Check all the lines.
 * Returns {
 *   rows: [{ sides: [{ src, values, lit, link }] }]   link: 'ok' | 'bad' | 'unknown' for the "=" before the side
 *   firstBad: { row, left, right } | null
 *   final: side | null     the last side that could be read
 *   unfinished: boolean    the work ends with "=" and nothing after it
 *   steps: number          how many "=" were checked
 * }
 */
export function analyze(lines) {
    const rows = [];
    let firstBad = null;
    let final = null;
    let unfinished = false;
    let steps = 0;

    lines.map(normalize).filter(Boolean).forEach((line, r) => {
        const parts = line.split('=').map(s => s.trim());
        unfinished = parts.length > 1 && parts.at(-1) === '';
        const sides = parts.filter((p, k) => p || k < parts.length - 1).map(parseSide);
        sides.forEach((side, k) => {
            if (k === 0) return;
            const prev = sides[k - 1];
            if (!side.values.length || !prev.values.length) { side.link = 'unknown'; return; }
            steps += 1;
            side.link = same(prev, side) ? 'ok' : 'bad';
            if (side.link === 'bad' && !firstBad) firstBad = { row: r, left: prev, right: side };
        });
        const last = sides.findLast(s => s.values.length);
        if (last) final = last;
        rows.push({ sides });
    });
    return { rows, firstBad, final, unfinished, steps };
}

/**
 * Grade a final answer against the exercise.
 * Returns { ok, notes: [text], trap: text | null }.
 */
export function grade(ex, value, lit) {
    if (ex.kind === 'box') {
        const ok = ex.check(value);
        return { ok, notes: [], trap: ok ? null : ex.why(value) };
    }
    const ok = value.eq(ex.answer);
    const notes = [];
    if (ok && lit && lit.d) {
        const g = gcd(lit.n, lit.d);
        const shown = lit.w ? `${lit.w}_${lit.n}/${lit.d}` : `${lit.n}/${lit.d}`;
        if (g > 1 || lit.n >= lit.d) {
            notes.push(g > 1
                ? `הַתּוֹצָאָה נְכוֹנָה, אֲבָל אֶפְשָׁר עוֹד לְצַמְצֵם: {{${shown} = ${ex.answer.mk()}}}`
                : `הַתּוֹצָאָה נְכוֹנָה. אֶפְשָׁר לִכְתּוֹב אוֹתָהּ גַּם כָּךְ: {{${shown} = ${ex.answer.mk()}}}`);
        }
    }
    const trap = ok ? null : ex.traps?.find(t => t.v.eq(value))?.he ?? null;
    return { ok, notes, trap };
}
