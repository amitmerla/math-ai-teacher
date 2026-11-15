// Shared pieces for the exercise generators.

import { f, gcd } from './frac.js';
import { rnd } from './util.js';

export const MUL = 'כּוֹפְלִים מוֹנֶה בְּמוֹנֶה, וּמְכַנֶּה בִּמְכַנֶּה.';
export const SOLVE = 'פִּתְרוּ אֶת הַתַּרְגִּיל:';

/** A proper fraction, usually already reduced. */
export function proper(minD, maxD) {
    for (;;) {
        const d = rnd(minD, maxD);
        const n = rnd(1, d - 1);
        if (gcd(n, d) === 1 || Math.random() < .2) return [n, d];
    }
}

/** The closing steps: reduce, then write as a mixed number. */
export function finish(n, d) {
    const steps = [];
    const g = gcd(n, d);
    const r = f(n, d);
    if (g > 1 && r.d > 1) steps.push({ he: `מְצַמְצְמִים: מְחַלְּקִים אֶת הַמּוֹנֶה וְאֶת הַמְּכַנֶּה בְּ-${g}.`, m: `${n}/${d} = ${r.n}/${r.d}` });
    if (r.d === 1 && d > 1) steps.push({ he: `הַמּוֹנֶה מִתְחַלֵּק בַּמְּכַנֶּה: ${n} לְחַלֵּק לְ-${d}.`, m: `${n}/${d} = ${r.n}` });
    if (r.d > 1 && r.n > r.d) steps.push({ he: 'הַמּוֹנֶה גָּדוֹל מֵהַמְּכַנֶּה, אָז כּוֹתְבִים מִסְפָּר מְעוֹרָב.', m: `${r.n}/${r.d} = ${r.mk()}` });
    return steps;
}

/** Reduce across the top and bottom of a product before multiplying. */
export function cancel(nums, dens) {
    const top = [...nums];
    const bottom = [...dens];
    for (let i = 0; i < top.length; i++) {
        for (let j = 0; j < bottom.length; j++) {
            const g = gcd(top[i], bottom[j]);
            top[i] /= g; bottom[j] /= g;
        }
    }
    const show = (from, to) => from.map((v, k) => (v === to[k] ? v : `${v}>${to[k]}`)).join(' x ');
    const prod = arr => arr.reduce((a, b) => a * b, 1);
    return { changed: top.some((v, k) => v !== nums[k]), m: `[${show(nums, top)}]/[${show(dens, bottom)}]`, n: prod(top), d: prod(bottom) };
}

export function traps(answer, list) {
    const seen = [];
    return list.filter(([v]) => v && !v.eq(answer) && !seen.some(s => s.eq(v)) && seen.push(v)).map(([v, he]) => ({ v, he }));
}

export const lcm = (a, b) => a / gcd(a, b) * b;

export function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = rnd(0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
