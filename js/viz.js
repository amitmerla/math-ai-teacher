// Pictures on the board: area model, groups, columns, number line, order-of-operations ladder,
// table, prism / pyramid, rectangle. Each one animates in (see "viz" in css/app.css).

import { el } from './util.js';
import { mathHTML, rich } from './math.js';

const NS = 'http://www.w3.org/2000/svg';
const svg = (tag, attrs = {}, ...kids) => {
    const n = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
    n.append(...kids.flat().filter(Boolean));
    return n;
};
const fmt = n => (Math.abs(n) >= 1000 ? Number(n).toLocaleString('en-US') : String(n));

export function viz(v) {
    const make = { area, groups, column, line, ladder, table, solid, rect }[v?.type];
    return make ? el('div', { class: `viz v-${v.type}` }, make(v)) : null;
}

/* ---------------------------------------------------------------- a/b × c/d on a rectangle */

function area(v) {
    const cells = [];
    for (let r = 0; r < v.b; r++) {
        for (let c = 0; c < v.d; c++) cells.push(el('i', { class: `${c < v.c ? 'col' : ''} ${r < v.a ? 'row' : ''}`, style: { '--k': r * v.d + c } }));
    }
    return [
        el('div', { class: 'viz-area', style: { '--cols': v.d } }, cells),
        el('div', { class: 'viz-key' },
            el('span', { class: 'k-col', html: rich(`{{${v.c}/${v.d}}} מֵהָעַמּוּדוֹת`) }),
            el('span', { class: 'k-row', html: rich(`{{${v.a}/${v.b}}} מֵהַשּׁוּרוֹת`) }),
            el('span', { class: 'k-both', html: rich(`גַּם וְגַם: {{${v.a * v.c}/${v.b * v.d}}}`) })),
    ];
}

/* ---------------------------------------------------------------- a/b of q, as groups */

function groups(v) {
    const per = v.q / v.b;
    return el('div', { class: 'viz-groups' }, Array.from({ length: v.b }, (_, g) =>
        el('div', { class: `grp ${g < v.a ? 'on' : ''}`, style: { '--k': g } }, Array.from({ length: per }, () => el('i')))));
}

/* ---------------------------------------------------------------- column arithmetic */

function column({ a, b, op, partials = [], result }) {
    const sign = { '+': '+', '-': '−', x: '×' }[op];
    const nums = [a, b, ...partials, result ?? 0];
    const width = Math.max(...nums.map(n => String(n).length)) + 1;
    const pad = s => String(s).padStart(width, ' ');
    const row = (s, cls = '', delay = 0) => el('div', { class: `col-row ${cls}` },
        [...pad(s)].map((ch, k) => el('i', { class: ch === ' ' ? 'blank' : '', style: { '--k': delay + k }, text: ch.trim() })));

    const rows = [];
    if (op === '+' && result != null) {
        // The carried 1s, written above the column they go to.
        const A = String(a).padStart(width, '0'), B = String(b).padStart(width, '0');
        const carry = Array(width).fill(' ');
        let c = 0;
        for (let k = width - 1; k > 0; k--) {
            c = Math.floor((+A[k] + +B[k] + c) / 10);
            if (c) carry[k - 1] = '1';
        }
        rows.push(row(carry.join(''), 'carry', 20));
    }
    rows.push(row(a));
    const second = pad(b).split('');
    second[0] = sign;
    rows.push(row(second.join(''), 'op-row'));
    rows.push(el('div', { class: 'col-line' }));
    if (partials.length) {
        partials.forEach((p, k) => rows.push(row(p, 'partial', 8 + k * width)));
        rows.push(el('div', { class: 'col-line' }));
    }
    if (result != null) rows.push(row(result, 'result', 12 + partials.length * width));
    return el('div', { class: 'viz-cols', dir: 'ltr', style: { '--w': width } }, rows);
}

/* ---------------------------------------------------------------- number line */

function line({ min, max, ticks, items, big }) {
    const at = x => `${((x - min) / (max - min)) * 100}%`;
    const tickLabel = t => (big ? fmt(t) : Number.isInteger(t) ? String(t) : null);
    return el('div', { class: `viz-line ${big ? 'big' : ''}`, dir: 'ltr' },
        el('div', { class: 'nl-bar' }),
        ...ticks.map(t => el('div', { class: 'nl-tick', style: { left: at(t) } }, tickLabel(t) != null && el('span', { text: tickLabel(t) }))),
        ...items.map((it, k) => el('div', { class: `nl-item ${k % 2 ? 'low' : ''}`, style: { left: at(it.v), '--k': k } },
            el('span', { class: 'nl-label', html: mathHTML(it.mk) }), el('i'))));
}

/* ---------------------------------------------------------------- order of operations */

function ladder() {
    const steps = [['( )', 'סוֹגְרַיִם'], ['× :', 'כֶּפֶל וְחִילּוּק'], ['+ −', 'חִיבּוּר וְחִיסּוּר']];
    return el('div', { class: 'viz-ladder' }, steps.flatMap(([sym, he], k) => [
        k > 0 && el('span', { class: 'ld-arrow', style: { '--k': k }, text: '←' }),
        el('div', { class: 'ld-step', style: { '--k': k } }, el('b', { text: k + 1 }), el('span', { class: 'ld-sym', dir: 'ltr', text: sym }), el('small', { text: he })),
    ]).filter(Boolean));
}

/* ---------------------------------------------------------------- table */

function table({ head, rows }) {
    return el('table', { class: 'viz-table' },
        el('thead', {}, el('tr', {}, head.map(h => el('th', { text: h })))),
        el('tbody', {}, rows.map((r, k) => el('tr', { style: { '--k': k } }, r.map((c, j) => (j === 0 ? el('th', { text: c }) : el('td', { html: mathHTML(c) })))))));
}

/* ---------------------------------------------------------------- prism / pyramid */

function solid({ shape, n }) {
    const cx = 150, rx = 96, ry = 30, by = 196, ty = 64, apex = [150, 22];
    // Start so that one side faces the viewer.
    const off = Math.PI / 2 - Math.PI / n;
    const base = Array.from({ length: n }, (_, i) => {
        const t = off + 2 * Math.PI * i / n;
        return [cx + rx * Math.cos(t), by + ry * Math.sin(t)];
    });
    const front = Array.from({ length: n }, (_, i) => Math.sin(off + 2 * Math.PI * (i + .5) / n) > 1e-6);    // edge i → i+1
    const vertexSeen = i => front[i] || front[(i - 1 + n) % n];
    const top = base.map(([x, y]) => [x, y - (by - ty)]);
    const P = pts => pts.map(p => p.map(c => c.toFixed(1)).join(',')).join(' ');
    const edge = (p, q, seen, k) => svg('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: seen ? 'e' : 'e hidden', pathLength: 1, style: `--k:${k}` });

    const faces = [], hidden = [], seen = [];
    let k = 0;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        (front[i] ? seen : hidden).push(edge(base[i], base[j], front[i], k++));
        if (shape === 'prism') {
            if (front[i]) faces.push(svg('polygon', { points: P([base[i], base[j], top[j], top[i]]), class: 'f side' }));
            seen.push(edge(top[i], top[j], true, k++));
            (vertexSeen(i) ? seen : hidden).push(edge(base[i], top[i], vertexSeen(i), k++));
        } else {
            if (front[i]) faces.push(svg('polygon', { points: P([base[i], base[j], apex]), class: 'f side' }));
            (vertexSeen(i) ? seen : hidden).push(edge(base[i], apex, vertexSeen(i), k++));
        }
    }
    if (shape === 'prism') faces.unshift(svg('polygon', { points: P(top), class: 'f top' }));
    const dots = [...base, ...(shape === 'prism' ? top : [apex])].map((p, i) =>
        svg('circle', { cx: p[0], cy: p[1], r: 4.5, class: i < n && !vertexSeen(i) ? 'v hidden' : 'v', style: `--k:${i}` }));
    return svg('svg', { viewBox: '0 0 300 240', class: 'solid-svg', role: 'img' }, hidden, faces, seen, dots);
}

/* ---------------------------------------------------------------- rectangle */

function rect({ w, h, lw, lh, grid, trace }) {
    const s = Math.min(240 / w, 150 / h);
    const W = w * s, H = h * s, x0 = 40, y0 = 34;
    const cells = [];
    if (grid) {
        for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
            cells.push(svg('rect', { x: x0 + c * s + 1, y: y0 + r * s + 1, width: s - 2, height: s - 2, rx: 2, class: 'cell', style: `--k:${r * w + c}` }));
        }
    }
    return svg('svg', { viewBox: `0 0 ${W + 90} ${H + 64}`, class: 'rect-svg', role: 'img' },
        cells,
        svg('rect', { x: x0, y: y0, width: W, height: H, rx: 3, class: `outline ${trace ? 'trace' : ''}`, pathLength: 1 }),
        svg('text', { x: x0 + W / 2, y: y0 - 12, 'text-anchor': 'middle', direction: 'rtl', class: 'lbl' }, document.createTextNode(lw)),
        // In right-to-left SVG text, "end" is the left edge, so the label grows to the right, away from the shape.
        svg('text', { x: x0 + W + 10, y: y0 + H / 2 + 6, 'text-anchor': 'end', direction: 'rtl', class: 'lbl' }, document.createTextNode(lh)));
}
