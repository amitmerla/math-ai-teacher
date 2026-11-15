// Small shared helpers: DOM, toasts, confetti.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') {
            for (const [prop, val] of Object.entries(v)) {
                if (prop.startsWith('--')) node.style.setProperty(prop, val);
                else node.style[prop] = val;
            }
        }
        else node.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) if (c != null && c !== false) node.append(c.nodeType ? c : String(c));
    return node;
}

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = arr => arr[rnd(0, arr.length - 1)];

/* ---------------------------------------------------------------- toasts */

export function toast(html, { icon = '✨', ms = 3600 } = {}) {
    const t = el('div', { class: 'toast' }, el('span', { text: icon }), el('span', { html }));
    $('#toasts').append(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, ms);
}

/* ---------------------------------------------------------------- confetti */

const canvas = $('#fx-canvas');
const ctx = canvas.getContext('2d');
let parts = [];
let raf = 0;

function resize() {
    canvas.width = innerWidth * devicePixelRatio;
    canvas.height = innerHeight * devicePixelRatio;
}
addEventListener('resize', resize);
resize();

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#fb923c', '#facc15', '#34d399'];
const SYMBOLS = ['⭐', '×', '½', '＋', '✓'];

export function confetti(x = innerWidth / 2, y = innerHeight / 2, n = 110) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const d = devicePixelRatio;
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 4 + Math.random() * 10;
        parts.push({
            x: x * d, y: y * d,
            vx: Math.cos(a) * s * d, vy: (Math.sin(a) * s - 7) * d,
            w: (5 + Math.random() * 6) * d, h: (8 + Math.random() * 8) * d,
            r: Math.random() * 6, vr: (Math.random() - .5) * .4,
            c: COLORS[i % COLORS.length], life: 1,
            sym: Math.random() < .3 ? SYMBOLS[i % SYMBOLS.length] : null,
        });
    }
    if (!raf) raf = requestAnimationFrame(tick);
}

export function confettiAt(node, n) {
    const r = node.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2, n);
}

function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const d = devicePixelRatio;
    parts = parts.filter(p => p.life > 0 && p.y < canvas.height + 40);
    for (const p of parts) {
        p.vy += .32 * d;
        p.vx *= .985;
        p.x += p.vx; p.y += p.vy;
        p.r += p.vr;
        p.life -= .006;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.5));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        if (p.sym) {
            ctx.font = `800 ${p.h * 1.7}px system-ui`;
            ctx.fillText(p.sym, -p.h / 2, p.h / 2);
        } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
    if (!raf) ctx.clearRect(0, 0, canvas.width, canvas.height);
}
