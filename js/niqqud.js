// All the Hebrew in the app is written with full niqqud on top of the full spelling,
// so taking the marks off leaves normal Hebrew. The ניקוד switch shows it either way;
// the voice always reads the pointed text.

import { store } from './store.js';

const MARKS = /[֑-ׇֽֿׁׂׅׄ]/g;
export const strip = s => s.replace(MARKS, '');

const pointed = new WeakMap();
export const niqqudOn = () => store.get('niqqud') !== false;

function visit(root, fn) {
    if (root.nodeType === Node.TEXT_NODE) return fn(root);
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) fn(n);
}

function apply(node) {
    if (!pointed.has(node)) {
        if (!MARKS.test(node.data)) return;
        MARKS.lastIndex = 0;
        pointed.set(node, node.data);
    }
    const want = niqqudOn() ? pointed.get(node) : strip(pointed.get(node));
    if (node.data !== want) node.data = want;
}

export function refreshNiqqud() {
    document.body.classList.toggle('niqqud', niqqudOn());
    visit(document.body, apply);
}

/** Start watching the page, so text added later follows the switch too. */
export function watchNiqqud() {
    new MutationObserver(list => {
        for (const m of list) for (const n of m.addedNodes) visit(n, apply);
    }).observe(document.body, { childList: true, subtree: true });
    refreshNiqqud();
}
