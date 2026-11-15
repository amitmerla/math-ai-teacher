// Screens and flow: home (subjects) → a subject with two tabs, לומדים (lesson) and מתרגלים (practice).
// Practice: Mati gives an exercise; the pupil solves on paper and uploads a photo (Mati reads it,
// the pupil fixes what was read, every step is checked), or types the final answer.

import { $, $$, el, toast, confetti, confettiAt, pick, rnd } from './util.js';
import { store } from './store.js';
import { mathHTML, rich } from './math.js';
import { f } from './frac.js';
import { TOPICS, GROUPS, topicById } from './topics.js';
import { viz } from './viz.js';
import { mati } from './avatar.js';
import { watchNiqqud, refreshNiqqud, niqqudOn } from './niqqud.js';
import { ai, aiBus, checkAI, downloadAI, readHandwriting, prepareImage } from './ai.js';
import { analyze, grade, normalize, toMarkup } from './check.js';
import { hasVoice, stopSpeaking } from './speech.js';

const state = { topic: null, tab: 'learn', ex: null, tries: 0, revealed: false, done: false, failed: false, greeted: new Set(), scanning: false };

const PRAISE = ['כָּל הַכָּבוֹד!', 'מְעוּלֶּה!', 'יוֹפִי שֶׁל עֲבוֹדָה!', 'בּוּל!', 'אַלּוּפִים!', 'וָואוּ, מְדוּיָּק!'];
const AGAIN = ['כִּמְעַט! נַסּוּ שׁוּב.', 'לֹא נוֹרָא, טוֹעִים וְלוֹמְדִים. נַסּוּ שׁוּב!', 'עוֹד לֹא. בִּדְקוּ שׁוּב אֶת הַדֶּרֶךְ.'];

/* ================================================================ header */

function refreshStats(bump) {
    for (const [id, key] of [['#stat-stars', 'stars'], ['#stat-streak', 'streak']]) {
        const node = $(id);
        const b = $('b', node);
        if (b.textContent !== String(store.get(key))) {
            b.textContent = store.get(key);
            if (bump) { node.classList.remove('bump'); void node.offsetWidth; node.classList.add('bump'); }
        }
    }
}

function refreshSwitches() {
    $('#sw-niqqud').setAttribute('aria-pressed', String(niqqudOn()));
    $('#sw-sound').textContent = store.get('muted') ? '🔇' : '🔊';
    $('#sw-sound').classList.toggle('off', !!store.get('muted'));
}

$('#sw-niqqud').addEventListener('click', () => { store.set('niqqud', !niqqudOn()); refreshSwitches(); refreshNiqqud(); });
$('#sw-sound').addEventListener('click', () => {
    store.set('muted', !store.get('muted'));
    refreshSwitches();
    if (store.get('muted')) stopSpeaking();
    else if (!hasVoice()) toast('לֹא מָצָאתִי קוֹל בְּעִבְרִית בַּמַּחְשֵׁב הַזֶּה.', { icon: '🔇' });
    else mati.say('אֲנִי שׁוּב מְדַבֵּר!', { feel: 'wave' });
});

const AI_LABEL = {
    checking: 'בּוֹדֵק...', available: 'קוֹרֵא תְּמוּנוֹת', downloadable: 'הוֹרִידוּ אֶת הָעֵינַיִים',
    downloading: 'מוֹרִיד', unavailable: 'בְּלִי קְרִיאַת תְּמוּנוֹת',
};
function refreshAI() {
    const chip = $('#ai-chip');
    chip.dataset.status = ai.status;
    $('.chip-text', chip).textContent = ai.status === 'downloading' ? `${AI_LABEL.downloading} ${Math.round(ai.progress * 100)}%` : AI_LABEL[ai.status];
}
aiBus.addEventListener('change', refreshAI);
$('#ai-chip').addEventListener('click', () => {
    mati.say('הָעֵינַיִים שֶׁלִּי פְּעִילוֹת! הַעֲלוּ תְּמוּנָה שֶׁל הַפִּתְרוֹן, וַאֲנִי אֶקְרָא אוֹתָהּ.', { feel: 'happy' });
});

/* ================================================================ home */

function showHome() {
    state.topic = null;
    state.ex = null;
    $('#home').hidden = false;
    $('#topic').hidden = true;
    mati.moveTo($('#home-mati'));
    $('#topics').replaceChildren(...GROUPS.map(g => el('section', { class: 'group' },
        el('h2', { class: 'section-title' }, el('span', { text: g.icon }), ' ', g.title),
        el('div', { class: 'topics' }, TOPICS.filter(t => t.group === g.id).map(topicCard)))));
    scrollTo({ top: 0 });
}

function topicCard(t, i) {
        const p = store.topic(t.id);
        const level = store.level(t.id);
        return el('button', { class: 'topic-card', type: 'button', style: { '--c': t.color, '--i': i }, onclick: () => openTopic(t.id) },
            el('span', { class: 'tc-num', text: i + 1 }),
            el('span', { class: 'tc-icon', text: t.icon }),
            el('h3', { text: t.title }),
            el('p', { text: t.sub }),
            el('div', { class: 'tc-sample', html: mathHTML(t.sample) }),
            el('div', { class: 'tc-foot' },
                el('span', { class: 'tc-level' }, ...[1, 2, 3].map(n => el('i', { class: n <= level ? 'on' : '' })), el('small', { text: `רָמָה ${level}` })),
                el('span', { class: 'tc-ok', text: p.ok ? `✓ ${p.ok}` : 'חָדָשׁ!' })));
}

function greet() {
    const name = store.get('name');
    mati.say(`שָׁלוֹם ${name}! אֲנִי מַתִּי. בַּחֲרוּ נוֹשֵׂא, וְנִלְמַד יַחַד.`, { feel: 'wave', chestSign: '½' });
}

$('#go-home').addEventListener('click', () => {
    if (!started) return;
    mati.hush(); showHome(); mati.say('בַּחֲרוּ נוֹשֵׂא, וְנַמְשִׁיךְ!', { feel: 'wave', chestSign: '½' }); });
$('#t-back').addEventListener('click', () => $('#go-home').click());

/* ================================================================ subject */

function openTopic(id, tab) {
    const t = topicById(id);
    state.topic = t;
    $('#home').hidden = true;
    $('#topic').hidden = false;
    $('#topic').style.setProperty('--c', t.color);
    $('#t-title').replaceChildren(el('span', { text: t.icon }), ' ', t.title);
    mati.moveTo($('#dock'));
    showTab(tab ?? (store.topic(id).tries ? 'practice' : 'learn'));
    scrollTo({ top: 0 });
}

function showTab(tab) {
    state.tab = tab;
    mati.hush();
    $$('.tabs [role="tab"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    if (tab === 'learn') renderLearn();
    else newExercise();
}
$$('.tabs [role="tab"]').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

/* ================================================================ lesson */

/** In a worked example, show what the pupil will choose from (options, numbers to order). */
function exampleExtra(ex) {
    if (ex.kind === 'choice') return el('div', { class: 'choices static' }, ex.options.map(o => el('span', { class: 'choice-btn', html: rich(o) })));
    if (ex.kind === 'order') return el('div', { class: 'order-pool', dir: 'ltr' }, ex.items.map(it => el('span', { class: 'order-chip', html: mathHTML(it.mk, 'xl') })));
    return null;
}

function renderLearn() {
    const t = state.topic;
    const ex = t.gen(1);
    const steps = [
        ...t.lesson.map(s => ({ ...s, tag: 'הַכְּלָל' })),
        { he: `עַכְשָׁיו נִפְתּוֹר יַחַד דּוּגְמָה. ${ex.he}`, m: ex.m, viz: ex.viz, extra: exampleExtra(ex), tag: 'דּוּגְמָה', group: 'ex' },
        ...ex.steps.map(s => ({ ...s, tag: 'דּוּגְמָה', group: 'ex' })),
        { he: 'זֶהוּ, עַכְשָׁיו אַתֶּם יוֹדְעִים! בּוֹאוּ נְתַרְגֵּל.', tag: 'סִיַּמְנוּ', end: true },
    ];
    let at = 0;

    const dots = el('div', { class: 'l-dots' }, steps.map((_, k) => el('button', { type: 'button', 'aria-label': `שלב ${k + 1}`, onclick: () => go(k) })));
    const board = el('div', { class: 'board' });
    const prev = el('button', { class: 'btn ghost', type: 'button', text: '→ הַקּוֹדֵם', onclick: () => go(at - 1) });
    const next = el('button', { class: 'btn primary big', type: 'button', onclick: () => (steps[at].end ? showTab('practice') : go(at + 1)) });
    $('#stage').replaceChildren(el('div', { class: 'lesson' }, dots, board, el('div', { class: 'l-nav' }, prev, next)));

    function go(k) {
        at = Math.max(0, Math.min(steps.length - 1, k));
        const s = steps[at];
        [...dots.children].forEach((d, i) => { d.className = i === at ? 'on' : i < at ? 'done' : ''; });
        // Earlier lines of the worked example stay on the board, dimmed.
        const before = s.group ? steps.slice(0, at).filter(x => x.group === s.group && x.m && x !== steps.find(y => y.group === s.group)) : [];
        board.replaceChildren(...[
            el('span', { class: 'board-tag', text: s.tag }),
            el('p', { class: 'board-text', html: rich(s.he) }),
            ...before.map(x => el('div', { class: 'board-math old', html: mathHTML(x.m) })),
            s.m && el('div', { class: 'board-math', html: mathHTML(s.m, 'xl') }),
            s.m2 && el('div', { class: 'board-math', html: mathHTML(s.m2, 'xl') }),
            s.viz && viz(s.viz),
            s.extra,
            s.end && el('div', { class: 'board-end', text: '🎓' }),
        ].filter(Boolean));
        board.classList.remove('in'); void board.offsetWidth; board.classList.add('in');
        prev.disabled = at === 0;
        next.textContent = s.end ? 'לְתַרְגּוּל! ✏️' : 'הַבָּא ←';
        mati.say(s.he, { feel: s.end ? 'happy' : 'point', chestSign: s.end ? '🎓' : String(at + 1) });
        if (s.end) confettiAt(board, 60);
    }
    go(0);
}

/* ================================================================ practice */

function newExercise() {
    const t = state.topic;
    Object.assign(state, { ex: t.gen(store.level(t.id)), tries: 0, revealed: false, done: false, failed: false, scanning: false });
    renderPractice();
    const first = !state.greeted.has(t.id);
    state.greeted.add(t.id);
    mati.say(first && !t.noPhoto
        ? 'הִנֵּה תַּרְגִּיל. פִּתְרוּ בַּמַּחְבֶּרֶת, שָׁלָב אַחֲרֵי שָׁלָב. אַחַר כָּךְ צַלְּמוּ וְהַעֲלוּ, וַאֲנִי אֶבְדּוֹק אֶת הַדֶּרֶךְ.'
        : pick(['הִנֵּה תַּרְגִּיל חָדָשׁ!', 'מוּכָנִים? הִנֵּה עוֹד אֶחָד!', 'בּוֹאוּ נִרְאֶה אֶת זֶה!']), { feel: 'point', chestSign: '?' });
}

const digitsOnly = e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9); };
const numInput = (cls, label) => el('input', { class: cls, inputmode: 'numeric', autocomplete: 'off', 'aria-label': label, oninput: digitsOnly });

function fracInput() {
    return el('div', { class: 'fin', dir: 'ltr' },
        numInput('fin-w', 'שלם'),
        el('div', { class: 'fin-f' }, numInput('fin-n', 'מונה'), el('i'), numInput('fin-d', 'מכנה')));
}

function readTyped(form) {
    const val = sel => $(sel, form)?.value.trim() ?? '';
    const [w, n, d] = [val('.fin-w'), val('.fin-n'), val('.fin-d')];
    if (n === '' && d === '') return w === '' ? null : { v: f(Number(w)), lit: { w: Number(w) } };
    if (n === '' || d === '' || Number(d) === 0) return null;
    const lit = Number(w) ? { w: Number(w), n: Number(n), d: Number(d) } : { n: Number(n), d: Number(d) };
    return { v: f(Number(n), Number(d)).add(f(Number(w) || 0)), lit };
}

function renderPractice() {
    const t = state.topic;
    const ex = state.ex;
    const level = store.level(t.id);

    const card = el('div', { class: 'ex-card' },
        el('div', { class: 'ex-top' },
            el('span', { class: 'ex-tag', text: 'תַּרְגִּיל' }),
            el('span', { class: 'tc-level' }, ...[1, 2, 3].map(n => el('i', { class: n <= level ? 'on' : '' })), el('small', { text: `רָמָה ${level}` }))),
        el('p', { class: 'ex-text', html: rich(ex.he) }),
        ex.m && el('div', { class: 'ex-math', html: mathHTML(ex.m, 'xl') }),
        ex.viz && viz(ex.viz));

    let answer;
    if (ex.kind === 'choice') {
        answer = el('div', { class: `choices ${ex.options.length === 2 ? 'two' : ''}` }, ex.options.map((o, i) =>
            el('button', { class: 'choice-btn', type: 'button', html: rich(o), onclick: e => {
                if (state.done) return;
                e.currentTarget.classList.add(i === ex.correct ? 'right' : 'wrong');
                submit({ choice: i });
            } })));
    } else if (ex.kind === 'order') {
        answer = orderPicker(ex);
    } else if (ex.kind === 'sign') {
        answer = el('div', { class: 'signs' }, ['<', '=', '>'].map(s =>
            el('button', { class: 'sign-btn', type: 'button', html: mathHTML(s, 'xl'), onclick: () => submit({ sign: s }) })));
    } else {
        const form = el('form', { class: 'typed', onsubmit: e => {
            e.preventDefault();
            const got = readTyped(form);
            if (!got) return mati.say('כִּתְבוּ תְּשׁוּבָה: מִסְפָּר שָׁלֵם, אוֹ מוֹנֶה וּמְכַנֶּה.', { feel: 'think' });
            submit(got);
        } },
            el('h3', { text: t.noPhoto ? 'כִּתְבוּ מִסְפָּר מַתְאִים' : 'אוֹ כִּתְבוּ רַק אֶת הַתְּשׁוּבָה' }),
            el('div', { class: 'typed-row' },
                ex.kind === 'int' ? el('div', { class: 'fin', dir: 'ltr' }, numInput('fin-w wide', 'תשובה')) : fracInput(),
                ex.unit && el('span', { class: 'unit', text: ex.unit })),
            ex.kind !== 'int' && el('p', { class: 'typed-tip', text: 'שָׁלֵם מִשְּׂמֹאל, מוֹנֶה לְמַעְלָה, מְכַנֶּה לְמַטָּה.' }),
            el('button', { class: 'btn primary', type: 'submit', text: 'בְּדִיקָה ✓' }));
        const drop = !t.noPhoto && el('button', { class: 'drop', type: 'button', onclick: () => $('#photo-input').click() },
            el('span', { class: 'drop-icon', text: '📷' }),
            el('b', { text: 'צַלְּמוּ אֶת הַפִּתְרוֹן וְהַעֲלוּ' }),
            el('small', { text: 'לַחֲצוּ לִבְחוֹר תְּמוּנָה, גִּרְרוּ לְכָאן, אוֹ הַדְבִּיקוּ' }),
            el('span', { class: 'drop-ring' }));
        answer = el('div', { class: `answer ${t.noPhoto ? 'solo' : ''}` }, drop, form);
    }

    $('#stage').replaceChildren(el('div', { class: 'practice' },
        card, answer,
        el('div', { id: 'scan', hidden: true }),
        el('div', { id: 'feedback' }),
        el('div', { class: 'ex-actions' },
            el('button', { class: 'btn ghost', type: 'button', text: '💡 רֶמֶז', onclick: showHint }),
            el('button', { class: 'btn ghost', type: 'button', text: '👀 הַרְאוּ לִי אֶת הַדֶּרֶךְ', onclick: showSolution }),
            el('button', { class: 'btn ghost', type: 'button', text: '🎲 תַּרְגִּיל אַחֵר', onclick: newExercise }))));
}

function showHint() {
    $('#feedback').replaceChildren(el('div', { class: 'note hint' }, el('span', { text: '💡' }), el('p', { html: rich(state.ex.hint) })));
    mati.say(state.ex.hint, { feel: 'think', chestSign: '💡' });
}

function stepList(steps) {
    return el('ol', { class: 'way' }, steps.map((s, k) => el('li', { style: { '--k': k } },
        el('div', { class: 'way-head' },
            el('p', { html: rich(s.he) }),
            el('button', { class: 'icon-btn sm', type: 'button', 'aria-label': 'השמיעו', text: '🔊', onclick: () => mati.say(s.he, { feel: 'point' }) })),
        s.m && el('div', { class: 'way-math', html: mathHTML(s.m) }),
        s.m2 && el('div', { class: 'way-math', html: mathHTML(s.m2) }),
        s.viz && viz(s.viz))));
}

/** Tap the numbers from smallest to largest; tap a filled slot to take it back. */
function orderPicker(ex) {
    const picked = [];
    const pool = el('div', { class: 'order-pool', dir: 'ltr' });
    const slots = el('div', { class: 'order-slots', dir: 'ltr' });
    const draw = () => {
        pool.replaceChildren(...ex.items.map((it, i) => el('button', {
            class: 'order-chip', type: 'button', html: mathHTML(it.mk, 'xl'), disabled: picked.includes(i),
            onclick: () => {
                if (state.done) return;
                picked.push(i);
                draw();
                if (picked.length === ex.items.length) submit({ order: [...picked] });
            },
        })));
        slots.replaceChildren(...ex.items.flatMap((_, k) => [
            k > 0 && el('span', { class: 'order-lt', html: mathHTML('<', 'xl') }),
            el('button', {
                class: `order-slot ${picked[k] != null ? 'full' : ''}`, type: 'button',
                html: picked[k] != null ? mathHTML(ex.items[picked[k]].mk, 'xl') : '',
                onclick: () => { if (picked[k] != null && !state.done) { picked.splice(k); draw(); } },
            }),
        ]).filter(Boolean));
    };
    draw();
    return el('div', { class: 'order-box' }, pool,
        el('div', { class: 'order-ends' }, el('span', { text: 'הַגָּדוֹל' }), el('span', { text: 'הַקָּטָן' })),
        slots);
}

function answerView(ex) {
    if (ex.kind === 'choice') return rich(ex.options[ex.correct]);
    if (ex.kind === 'order') return mathHTML(ex.order.map(i => ex.items[i].mk).join(' < '), 'xl');
    if (ex.kind === 'frac' || ex.kind === 'int') return `${mathHTML(ex.answer.mk(), 'xl')}${ex.unit ? ` <span>${ex.unit}</span>` : ''}`;
    return null;
}

function showSolution() {
    const ex = state.ex;
    state.revealed = true;
    $('#feedback').replaceChildren(el('div', { class: 'panel' },
        el('h3', { text: '👀 הַדֶּרֶךְ, שָׁלָב אַחֲרֵי שָׁלָב' }),
        stepList(ex.steps),
        el('button', { class: 'btn primary', type: 'button', text: 'תַּרְגִּיל חָדָשׁ ←', onclick: newExercise })));
    mati.say('הִנֵּה הַדֶּרֶךְ, שָׁלָב אַחֲרֵי שָׁלָב. קִרְאוּ לְאַט, וְאָז נַסּוּ תַּרְגִּיל חָדָשׁ לְבַד.', { feel: 'point', chestSign: '👀' });
    $('#feedback').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ---------------------------------------------------------------- grading */

/** got: { v, lit } or { sign }. way: { remarks, rows } from a checked photo. */
function submit(got, way) {
    const ex = state.ex;
    if (state.done) return;
    state.tries += 1;

    let ok, notes = [], trap = null;
    if (ex.kind === 'sign') {
        ok = got.sign === ex.sign;
        if (!ok) trap = ex.hint;
    } else if (ex.kind === 'choice') {
        ok = got.choice === ex.correct;
        if (ex.reason) notes = [ex.reason];
        else if (!ok) trap = ex.why?.[got.choice] ?? ex.hint;
    } else if (ex.kind === 'order') {
        ok = got.order.every((i, k) => i === ex.order[k]);
        if (!ok) trap = `${ex.hint} נִגְעוּ בְּמִסְפָּר שֶׁכְּבָר בַּשּׁוּרָה כְּדֵי לְהַחְזִיר אוֹתוֹ.`;
    } else {
        ({ ok, notes, trap } = grade(ex, got.v, got.lit));
    }
    const remarks = [...(way?.remarks ?? []), ...notes];
    // A known wrong answer gets its explanation, unless the checked way already shows the exact wrong step.
    if (!ok && trap && !way?.hasBad) remarks.unshift(trap);

    let stars = 0;
    if (ok) {
        state.done = true;
        stars = state.revealed ? 0 : Math.max(1, 4 - state.tries - (notes.length && !ex.reason ? 1 : 0));
        store.record(state.topic.id, true, stars);
    } else if (!state.failed) {
        state.failed = true;
        store.record(state.topic.id, false, 0);
    }
    // A true / false question has only one other answer, so a miss ends it (the answer is shown).
    if (!ok && ex.kind === 'choice' && ex.options.length === 2) state.done = true;
    refreshStats(true);

    const title = ok ? pick(PRAISE) : state.done ? 'לֹא נוֹרָא, עַכְשָׁיו אַתֶּם יוֹדְעִים!' : pick(AGAIN);
    const fb = $('#feedback');
    fb.replaceChildren(el('div', { class: `verdict ${ok ? 'ok' : 'bad'}` },
        el('div', { class: 'verdict-head' },
            el('span', { class: 'verdict-icon', text: ok ? '🎉' : '🤔' }),
            el('h3', { text: title }),
            ok && el('span', { class: 'verdict-stars' }, [1, 2, 3].map(n => el('i', { class: n <= stars ? 'on' : '', style: { '--k': n }, text: '★' })))),
        way?.rows,
        remarks.length ? el('ul', { class: 'remarks' }, remarks.map(r => el('li', { html: rich(r) }))) : null,
        (ok || state.done) && answerView(ex) && el('div', { class: 'verdict-answer', html: `${rich('הַתְּשׁוּבָה:')} ${answerView(ex)}` }),
        el('div', { class: 'verdict-actions' },
            ok || state.done
                ? el('button', { class: 'btn primary big', type: 'button', text: 'תַּרְגִּיל הַבָּא ←', onclick: newExercise })
                : el('button', { class: 'btn ghost', type: 'button', text: '👀 הַרְאוּ לִי אֶת הַדֶּרֶךְ', onclick: showSolution }))));
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (ok) {
        confettiAt(fb, 120);
        if (store.level(state.topic.id) > 1 && store.topic(state.topic.id).ok % 3 === 0 && store.topic(state.topic.id).ok <= 6) {
            toast(`עֲלִיתֶם לְרָמָה ${store.level(state.topic.id)}!`, { icon: '🚀' });
        }
        mati.say(`${title} ${remarks[0] ?? ''}`, { feel: 'happy', chestSign: '✓', after: 'idle' });
    } else {
        mati.say(remarks[0] ?? title, { feel: 'oops', chestSign: '?' });
    }
}

/* ---------------------------------------------------------------- photo → lines → check */

const LINE_TIP = 'שֶׁבֶר כּוֹתְבִים עִם קַו נָטוּי: 3/8. מִסְפָּר מְעוֹרָב עִם רֶוַח: 1 1/6. כֶּפֶל: x. חִילּוּק: נְקוּדָּתַיִים.';

function lineEditor(value = '') {
    const preview = el('div', { class: 'line-prev' });
    const input = el('input', { class: 'line-in', dir: 'ltr', value, spellcheck: 'false', autocomplete: 'off', placeholder: '1/4 x 2/5 = 2/20' });
    const draw = () => { preview.innerHTML = input.value.trim() ? mathHTML(toMarkup(normalize(input.value)).replace(/=/g, ' = ')) : ''; };
    input.addEventListener('input', draw);
    draw();
    const row = el('div', { class: 'line' },
        el('div', { class: 'line-main' }, input, preview),
        el('button', { class: 'icon-btn sm', type: 'button', 'aria-label': 'מחקו שורה', text: '✕', onclick: () => row.remove() }));
    return row;
}

async function handlePhoto(file) {
    const ex = state.ex;
    if (!ex || state.topic?.noPhoto || state.tab !== 'practice' || state.scanning || state.done) return;
    state.scanning = true;
    const scan = $('#scan');
    const img = el('img', { alt: '' });
    const log = el('ol', { class: 'scan-log' });
    const side = el('div', { class: 'scan-side' }, el('h3', { text: '🤖 מַתִּי קוֹרֵא אֶת הַדַּף' }), log);
    const say = text => { const li = el('li', { text }); log.append(li); return li; };
    scan.className = 'scan busy';
    scan.hidden = false;
    scan.replaceChildren(el('div', { class: 'scan-photo' }, img, el('i', { class: 'laser' }), el('i', { class: 'scan-mesh' })), side);
    $('#feedback').replaceChildren();
    scan.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    mati.say('אֲנִי סוֹרֵק אֶת הַדַּף שֶׁלָּכֶם. רֶגַע אֶחָד...', { feel: 'scan', chestSign: '📷', after: 'idle' });

    let lines = [];
    let how = 'none';
    try {
        const step1 = say('מֵכִין אֶת הַתְּמוּנָה');
        const ready = await prepareImage(file);
        img.src = ready.url;
        step1.classList.add('done');
        if (ai.status === 'available') {
            const step2 = say('קוֹרֵא אֶת כְּתַב הַיָּד');
            try {
                lines = await readHandwriting(ready.blob, ex.plain, text => { step2.dataset.n = text.length; });
                how = lines.length ? 'ai' : 'empty';
                step2.classList.add('done');
            } catch {
                how = 'failed';
                step2.classList.add('fail');
            }
        }
    } catch {
        state.scanning = false;
        scan.hidden = true;
        return mati.say('לֹא הִצְלַחְתִּי לִפְתּוֹחַ אֶת הַתְּמוּנָה. נַסּוּ תְּמוּנָה אַחֶרֶת.', { feel: 'oops', chestSign: '?' });
    }
    state.scanning = false;
    scan.className = 'scan';

    const list = el('div', { class: 'lines' }, (lines.length ? lines : ['', '']).map(lineEditor));
    side.replaceChildren(
        el('h3', { text: how === 'ai' ? '🤖 זֶה מָה שֶׁקָּרָאתִי' : '✍️ הַעְתִּיקוּ אֶת הַשּׁוּרוֹת מֵהַדַּף' }),
        el('p', { class: 'scan-tip', text: how === 'ai' ? 'בִּדְקוּ שֶׁקָּרָאתִי נָכוֹן, וְתַקְּנוּ אִם צָרִיךְ.' : LINE_TIP }),
        list,
        el('div', { class: 'scan-actions' },
            el('button', { class: 'btn ghost', type: 'button', text: '＋ שׁוּרָה', onclick: () => { const r = lineEditor(); list.append(r); $('input', r).focus(); } }),
            el('button', { class: 'btn primary', type: 'button', text: 'בִּדְקוּ אֶת הַדֶּרֶךְ שֶׁלִּי ✓', onclick: () => checkWay(list) })));
    mati.say({
        ai: 'זֶה מָה שֶׁקָּרָאתִי בַּדַּף. בִּדְקוּ שֶׁהֵבַנְתִּי נָכוֹן, תַּקְּנוּ אִם צָרִיךְ, וְלַחֲצוּ עַל בְּדִיקָה.',
        none: 'הָעֵינַיִים שֶׁלִּי לֹא פְּעִילוֹת בַּדַּפְדְּפָן הַזֶּה. הַעְתִּיקוּ לְכָאן אֶת הַשּׁוּרוֹת מֵהַדַּף, וַאֲנִי אֶבְדּוֹק כָּל שָׁלָב.',
        empty: 'לֹא מָצָאתִי חִישּׁוּבִים בַּתְּמוּנָה. הַעְתִּיקוּ לְכָאן אֶת הַשּׁוּרוֹת, וַאֲנִי אֶבְדּוֹק כָּל שָׁלָב.',
        failed: 'לֹא הִצְלַחְתִּי לִקְרוֹא אֶת הַתְּמוּנָה. הַעְתִּיקוּ לְכָאן אֶת הַשּׁוּרוֹת, וַאֲנִי אֶבְדּוֹק כָּל שָׁלָב.',
    }[how], { feel: how === 'ai' ? 'point' : 'think', chestSign: '✍️' });
    $('input', list)?.focus({ preventScroll: true });
}

const LINK = { ok: '✓', bad: '✗', unknown: '?' };

function checkWay(list) {
    const ex = state.ex;
    const lines = $$('.line-in', list).map(i => i.value).filter(v => v.trim());
    if (!lines.length) return mati.say('כִּתְבוּ לְפָחוֹת שׁוּרָה אַחַת.', { feel: 'think' });
    const an = analyze(lines);
    if (!an.final) return mati.say('לֹא הִצְלַחְתִּי לְהָבִין אֶת הַשּׁוּרוֹת. בִּדְקוּ אֶת הַכְּתִיבָה: שֶׁבֶר כּוֹתְבִים עִם קַו נָטוּי.', { feel: 'oops', chestSign: '?' });

    const draw = side => (side.values.length ? mathHTML(toMarkup(side.src)) : `<bdi class="m unread" dir="ltr">${side.src.replace(/[<>&]/g, '')}</bdi>`);
    const rows = el('div', { class: 'checked' }, an.rows.map((row, r) => el('div', { class: 'checked-row', style: { '--k': r } },
        el('span', { class: 'checked-n', text: r + 1 }),
        el('div', { class: 'checked-math', dir: 'ltr' }, row.sides.flatMap((side, k) => [
            k > 0 && el('span', { class: `link ${side.link}` }, el('b', { text: '=' }), el('i', { text: LINK[side.link] })),
            el('span', { html: draw(side) }),
        ])))));

    const remarks = [];
    if (an.firstBad) {
        const { row, left, right } = an.firstBad;
        let r = `בְּשׁוּרָה ${row + 1} יֵשׁ מַעֲבָר לֹא נָכוֹן: {{${toMarkup(left.src)}}} לֹא שָׁוֶה לְ-{{${toMarkup(right.src)}}}.`;
        if (!left.lit) r += ` הַתּוֹצָאָה הַנְּכוֹנָה שָׁם: {{${left.values[0].mk(false)}}}.`;
        remarks.push(r);
    }
    const start = an.rows[0].sides[0];
    if (ex.m && (ex.kind === 'frac' || ex.kind === 'int') && an.rows[0].sides.length > 1 && start.values.length && !start.values.some(v => v.eq(ex.answer))) {
        remarks.push('הַשּׁוּרָה הָרִאשׁוֹנָה לֹא מַתְאִימָה לַתַּרְגִּיל שֶׁעַל הַלּוּחַ. בִּדְקוּ שֶׁהֶעְתַּקְתֶּם נָכוֹן.');
    }
    if (an.unfinished) remarks.push('הַדֶּרֶךְ נִגְמֶרֶת בְּסִימַן שָׁוֶה, בְּלִי תּוֹצָאָה. הַשְׁלִימוּ אֶת הַצַּעַד הָאַחֲרוֹן.');
    if (!an.steps) remarks.push('בַּפַּעַם הַבָּאָה כִּתְבוּ גַּם אֶת הַדֶּרֶךְ, לֹא רַק אֶת הַתְּשׁוּבָה.');
    else if (!an.firstBad) remarks.push('כָּל הַמַּעֲבָרִים בַּדֶּרֶךְ נְכוֹנִים.');

    const value = (ex.answer && an.final.values.find(v => v.eq(ex.answer))) ?? an.final.values[0];
    submit({ v: value, lit: an.final.lit }, { remarks, rows, hasBad: !!an.firstBad });
}

$('#photo-input').addEventListener('change', e => { const [file] = e.target.files; e.target.value = ''; if (file) handlePhoto(file); });
addEventListener('paste', e => {
    const file = [...(e.clipboardData?.files ?? [])].find(x => x.type.startsWith('image/'));
    if (file) { e.preventDefault(); handlePhoto(file); }
});
addEventListener('dragover', e => { if (state.ex && e.dataTransfer?.types.includes('Files')) { e.preventDefault(); $('.drop')?.classList.add('over'); } });
addEventListener('dragleave', () => $('.drop')?.classList.remove('over'));
addEventListener('drop', e => {
    const [file] = e.dataTransfer?.files ?? [];
    if (!file) return;
    e.preventDefault();
    $('.drop')?.classList.remove('over');
    handlePhoto(file);
});

/* ================================================================ start */

// Math symbols drifting in the background.
$('#floaters').append(...Array.from({ length: 22 }, (_, i) => el('span', {
    text: pick(['½', '×', '¾', '÷', '+', '=', '⅓', '⅖', '%', '7', '3']),
    style: { left: `${rnd(0, 100)}%`, '--d': `${rnd(18, 40)}s`, '--delay': `${-rnd(0, 40)}s`, '--s': `${rnd(18, 54)}px`, '--r': `${rnd(-40, 40)}deg`, '--o': (rnd(6, 16) / 100).toFixed(2), '--h': i * 37 % 360 },
})));

/* ---------------------------------------------------------------- the AI gate */

// The app works only with Chrome's built-in AI (it reads the photos). Without it, nothing starts:
// Mati explains that a stronger computer and an up-to-date Chrome are needed.
let started = false;

function gate({ title, text, list, feel, chestSign, actions = [], bar = false }) {
    $('#gate-title').textContent = title;
    $('#gate-text').textContent = text;
    $('#gate-list').hidden = !list;
    $('#gate-list').replaceChildren(...(list ?? []).map(([icon, t]) => el('li', {}, el('span', { text: icon }), el('p', { text: t }))));
    $('#gate-bar').hidden = !bar;
    $('#gate-actions').replaceChildren(...actions);
    $('#gate').dataset.feel = feel;
    mati.say(`${title} ${text}`, { feel, chestSign });
}

function gateUpdate() {
    if (started) return;
    if (ai.status === 'checking') {
        return gate({ title: 'רֶגַע, אֲנִי בּוֹדֵק...', text: 'בּוֹדֵק שֶׁהַמַּחְשֵׁב הַזֶּה יָכוֹל לְהַפְעִיל אֶת הַמּוֹחַ שֶׁלִּי.', feel: 'scan', chestSign: '⏳' });
    }
    if (ai.status === 'available') return start();
    if (ai.status === 'downloadable') {
        return gate({
            title: 'כִּמְעַט מוּכָנִים!', feel: 'wave', chestSign: '⬇️',
            text: 'צָרִיךְ לְהוֹרִיד פַּעַם אַחַת אֶת הַמּוֹחַ שֶׁלִּי לַמַּחְשֵׁב. זֶה לוֹקֵחַ כַּמָּה דַּקּוֹת.',
            actions: [el('button', { class: 'btn primary big', type: 'button', text: 'הוֹרִידוּ אֶת הַמּוֹחַ שֶׁל מַתִּי ⬇️', onclick: () => downloadAI() })],
        });
    }
    if (ai.status === 'downloading') {
        $('#gate-bar i').style.width = `${Math.round(ai.progress * 100)}%`;
        if ($('#gate').dataset.feel === 'think') return;
        return gate({ title: 'מוֹרִיד...', text: 'הַמּוֹחַ שֶׁלִּי יוֹרֵד לַמַּחְשֵׁב. אַל תִּסְגְּרוּ אֶת הַדַּף.', feel: 'think', chestSign: '⬇️', bar: true });
    }
    gate({
        title: 'אוֹי, הַמַּחְשֵׁב הַזֶּה לֹא מַתְאִים לִי', feel: 'oops', chestSign: '!',
        text: 'כְּדֵי שֶׁאוּכַל לִקְרוֹא אֶת הַפִּתְרוֹנוֹת שֶׁלָּכֶם, אֲנִי צָרִיךְ מַחְשֵׁב נַיָּד חָזָק יוֹתֵר, עִם דַּפְדְּפָן כְּרוֹם מְעוּדְכָּן לַגִּרְסָה הָאַחֲרוֹנָה. בַּקְּשׁוּ עֶזְרָה מֵהוֹרֶה.',
        list: [
            ['💻', 'מַחְשֵׁב חָזָק: לְפָחוֹת 16GB זִכָּרוֹן, אוֹ כַּרְטִיס מָסָךְ עִם יוֹתֵר מִ-4GB.'],
            ['🌐', 'דַּפְדְּפָן Google Chrome, מְעוּדְכָּן לַגִּרְסָה הָאַחֲרוֹנָה.'],
            ['💾', 'לְפָחוֹת 22GB מָקוֹם פָּנוּי בַּדִּיסְק.'],
        ],
        actions: [el('button', { class: 'btn ghost', type: 'button', text: '🔄 בִּדְקוּ שׁוּב', onclick: () => { ai.status = 'checking'; gateUpdate(); checkAI(); } })],
    });
}
aiBus.addEventListener('change', gateUpdate);

function start() {
    if (started) return;
    started = true;
    $('#gate').hidden = true;
    $('#top-side').hidden = false;
    showHome();
    if (store.get('name')) return greet();
    const dlg = $('#hello');
    dlg.addEventListener('cancel', e => e.preventDefault());
    $('#hello-form').addEventListener('submit', () => {
        store.set('name', $('#hello-name').value.trim());
        greet();
        confetti();
    });
    dlg.showModal();
}

watchNiqqud();
refreshSwitches();
refreshStats();
refreshAI();
mati.moveTo($('#gate-mati'));
gateUpdate();
checkAI();
