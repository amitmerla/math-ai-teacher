// Math markup: one small notation that is both drawn (stacked fractions) and spoken (Hebrew words).
//
//   3/8                  fraction
//   1_1/6                mixed number
//   [1 x 2]/[4 x 5]      fraction with an expression above and below
//   6>3                  6 crossed out and replaced by 3 (reducing before multiplying)
//   x : + - = < > ( ) ?  signs          □  empty box          ○  empty circle
//   anything else        plain text
//
// Tokens are separated by spaces. In Hebrew text, math sits inside {{ ... }}.

import { esc } from './util.js';

const SIGNS = { x: '×', ':': ':', '=': '=', '+': '+', '-': '−', '<': '<', '>': '>', '(': '(', ')': ')', '?': '?' };

const tokens = mk => mk.match(/\[[^\]]*\]\/\[[^\]]*\]|\S+/g) ?? [];
const showNum = s => (Number(s) >= 1000 ? Number(s).toLocaleString('en-US') : s);
const frac = (n, d, cls = '') => `<span class="frac ${cls}"><span class="n">${n}</span><span class="d">${d}</span></span>`;
const inner = mk => tokens(mk).map(tokHTML).join('');

function tokHTML(t) {
    let m;
    if ((m = t.match(/^\[([^\]]*)\]\/\[([^\]]*)\]$/))) return frac(inner(m[1]), inner(m[2]), 'wide');
    if ((m = t.match(/^(\d+)_(\d+)\/(\d+)$/))) return `<span class="mix"><span class="num">${m[1]}</span>${frac(m[2], m[3])}</span>`;
    if ((m = t.match(/^(\d+)\/(\d+)$/))) return frac(m[1], m[2]);
    if ((m = t.match(/^(\d+)>(\d+)$/))) return `<span class="cx"><s>${m[1]}</s><sup>${m[2]}</sup></span>`;
    if (/^\d+$/.test(t)) return `<span class="num">${showNum(t)}</span>`;
    if (t === '□') return '<span class="box"></span>';
    if (t === '○') return '<span class="circ"></span>';
    if (SIGNS[t]) return `<span class="op">${SIGNS[t]}</span>`;
    return `<span class="t">${esc(t)}</span>`;
}

/** Markup → HTML, always left-to-right. */
export const mathHTML = (mk, cls = '') => `<bdi class="m ${cls}" dir="ltr">${inner(mk)}</bdi>`;

/** Hebrew text with {{math}} → HTML. */
export const rich = text => esc(text).replace(/\{\{(.+?)\}\}/g, (_, mk) => mathHTML(mk.replace(/&gt;/g, '>').replace(/&lt;/g, '<')));

/* ---------------------------------------------------------------- spoken Hebrew */

// חצי, שליש and רבע are masculine; חמישית and up are feminine.
const MASC = { 2: ['חֲצִי', 'חֲצָאִים'], 3: ['שְׁלִישׁ', 'שְׁלִישִׁים'], 4: ['רֶבַע', 'רְבָעִים'] };
const FEM = {
    5: ['חֲמִישִׁית', 'חֲמִישִׁיּוֹת'], 6: ['שִׁישִּׁית', 'שִׁישִּׁיּוֹת'], 7: ['שְׁבִיעִית', 'שְׁבִיעִיּוֹת'],
    8: ['שְׁמִינִית', 'שְׁמִינִיּוֹת'], 9: ['תְּשִׁיעִית', 'תְּשִׁיעִיּוֹת'], 10: ['עֲשִׂירִית', 'עֲשִׂירִיּוֹת'],
};
const COUNT_M = [, , 'שְׁנֵי', 'שְׁלוֹשָׁה', 'אַרְבָּעָה', 'חֲמִישָּׁה', 'שִׁישָּׁה', 'שִׁבְעָה', 'שְׁמוֹנָה', 'תִּשְׁעָה', 'עֲשָׂרָה'];
const COUNT_F = [, , 'שְׁתֵּי', 'שָׁלוֹשׁ', 'אַרְבַּע', 'חָמֵשׁ', 'שֵׁשׁ', 'שֶׁבַע', 'שְׁמוֹנֶה', 'תֵּשַׁע', 'עֶשֶׂר'];

function sayFrac(n, d) {
    n = Number(n); d = Number(d);
    const names = MASC[d] ?? FEM[d];
    if (!names) return `${n} חֶלְקֵי ${d}`;
    if (n === 1) return names[0];
    const count = (MASC[d] ? COUNT_M : COUNT_F)[n] ?? String(n);
    return `${count} ${names[1]}`;
}

const SAY = { x: 'כָּפוּל', ':': 'לְחַלֵּק לְ', '=': 'שָׁוֶה', '+': 'וְעוֹד', '-': 'פָּחוֹת', '<': 'קָטָן מִ', '>': 'גָּדוֹל מִ', '(': '', ')': '', '?': '', '□': 'מִסְפָּר', '○': '' };

function tokSay(t) {
    let m;
    if ((m = t.match(/^\[([^\]]*)\]\/\[([^\]]*)\]$/))) return `${sayMath(m[1])}, חֶלְקֵי ${sayMath(m[2])}`;
    if ((m = t.match(/^(\d+)_(\d+)\/(\d+)$/))) return `${m[1]} וְ${sayFrac(m[2], m[3])}`;
    if ((m = t.match(/^(\d+)\/(\d+)$/))) return sayFrac(m[1], m[2]);
    if ((m = t.match(/^(\d+)>(\d+)$/))) return m[2];
    return t in SAY ? SAY[t] : t;
}

export const sayMath = mk => tokens(mk).map(tokSay).filter(Boolean).join(' ');

/** Hebrew text with {{math}} → text for the voice. */
export const spoken = text => text.replace(/\{\{(.+?)\}\}/g, (_, mk) => ` ${sayMath(mk)} `).replace(/\s+/g, ' ').trim();
