// Subjects from the "חזרה למבחן נובמבר" review sheets: adding and subtracting fractions,
// dividing, ordering fractions and decimals, order of operations, big numbers, estimation,
// solids (prisms and pyramids) and the area and perimeter of a rectangle.
//
// Same rules as js/topics.js: plural, gender-neutral Hebrew with full niqqud on full spelling,
// math inside text in {{ }}. Extra exercise kinds used here:
//   choice  options: [Hebrew text], correct: index, why: [text per option] (optional), reason (optional)
//   order   items: [{ mk, v }], order: indexes from smallest to largest

import { f, gcd } from './frac.js';
import { rnd, pick } from './util.js';
import { SOLVE, proper, finish, traps, lcm, shuffle } from './gen.js';

/* ================================================================ adding and subtracting fractions */

const T_BOTH = 'חִיבַּרְתֶּם גַּם אֶת הַמְּכַנִּים. מְחַבְּרִים רַק אֶת הַמּוֹנִים, אַחֲרֵי שֶׁמּוֹצְאִים מְכַנֶּה מְשׁוּתָּף.';
const T_BOTH_SUB = 'חִיסַּרְתֶּם גַּם אֶת הַמְּכַנִּים. מְחַסְּרִים רַק אֶת הַמּוֹנִים, אַחֲרֵי שֶׁמּוֹצְאִים מְכַנֶּה מְשׁוּתָּף.';
const T_NO_EXPAND = 'הֶחְלַפְתֶּם אֶת הַמְּכַנֶּה, אֲבָל שְׁכַחְתֶּם לְהַרְחִיב גַּם אֶת הַמּוֹנֶה. כּוֹפְלִים מוֹנֶה וּמְכַנֶּה בְּאוֹתוֹ מִסְפָּר.';

const mkMix = (w, n, d) => (w ? (n ? `${w}_${n}/${d}` : `${w}`) : `${n}/${d}`);
const plainMix = (w, n, d) => (w ? `${w} ${n}/${d}` : `${n}/${d}`);

function expandStep(n, d, L) {
    const k = L / d;
    return k === 1 ? null : { he: `מַרְחִיבִים אֶת {{${n}/${d}}}: כּוֹפְלִים אֶת הַמּוֹנֶה וְאֶת הַמְּכַנֶּה בְּ-${k}.`, m: `${n}/${d} = [${n} x ${k}]/[${d} x ${k}] = ${n * k}/${L}` };
}

function genAddSub(level) {
    if (level === 3) return genAddSubMixed();
    let a, b, c, d;
    for (;;) {
        [a, b] = proper(2, level === 1 ? 6 : 10);
        if (level === 1) { d = b * rnd(1, 3); c = rnd(1, d - 1); }
        else {
            d = rnd(2, 10);
            c = rnd(1, Math.random() < .3 ? d + 3 : d - 1);      // sometimes a fraction bigger than 1, like 7/5
            if (Math.random() < .3) [a, b] = [rnd(b + 1, b + 4), b];
        }
        if (gcd(c, d) !== 1 || (level > 1 && (b === d || b % d === 0 || d % b === 0))) continue;
        if (lcm(b, d) <= 60) break;
    }
    const add = Math.random() < .55;
    if (!add && f(a, b).cmp(f(c, d)) <= 0) [a, b, c, d] = [c, d, a, b];
    if (!add && f(a, b).eq(f(c, d))) return genAddSub(level);
    const L = lcm(b, d);
    const [A, C] = [a * L / b, c * L / d];
    const N = add ? A + C : A - C;
    const op = add ? '+' : '-';
    const answer = f(N, L);
    const same = b === d;
    return {
        kind: 'frac', he: SOLVE, m: `${a}/${b} ${op} ${c}/${d} =`, plain: `${a}/${b} ${op} ${c}/${d}`, answer,
        hint: same ? 'הַמְּכַנִּים שָׁוִים: מְחַשְּׁבִים רַק אֶת הַמּוֹנִים.' : 'קוֹדֶם מוֹצְאִים מְכַנֶּה מְשׁוּתָּף: מִסְפָּר שֶׁמִּתְחַלֵּק בִּשְׁנֵי הַמְּכַנִּים.',
        steps: [
            ...(same ? [] : [
                { he: `מוֹצְאִים מְכַנֶּה מְשׁוּתָּף: הַמִּסְפָּר הַקָּטָן בְּיוֹתֵר שֶׁמִּתְחַלֵּק גַּם בְּ-${b} וְגַם בְּ-${d} הוּא ${L}.` },
                expandStep(a, b, L), expandStep(c, d, L),
            ].filter(Boolean)),
            { he: add ? 'מְחַבְּרִים אֶת הַמּוֹנִים. הַמְּכַנֶּה נִשְׁאָר כְּמוֹ שֶׁהוּא.' : 'מְחַסְּרִים אֶת הַמּוֹנִים. הַמְּכַנֶּה נִשְׁאָר כְּמוֹ שֶׁהוּא.', m: `${A}/${L} ${op} ${C}/${L} = ${N}/${L}` },
            ...finish(N, L),
        ],
        traps: traps(answer, add
            ? [[f(a + c, b + d), T_BOTH], [same ? null : f(a + c, L), T_NO_EXPAND]]
            : [[b !== d && a > c ? f(a - c, Math.abs(b - d) || 1) : null, T_BOTH_SUB], [same || a <= c ? null : f(a - c, L), T_NO_EXPAND]]),
    };
}

function genAddSubMixed() {
    const sub = Math.random() < .6;
    let w1, n1, d1, w2, n2, d2, L;
    for (;;) {
        [n1, d1] = proper(2, 10);
        [n2, d2] = proper(2, 10);
        L = lcm(d1, d2);
        if (d1 === d2 || L > 60) continue;
        w1 = rnd(2, 6);
        w2 = sub ? rnd(1, w1 - 1) : rnd(1, 4);
        // In subtraction, borrowing (the first fraction is the smaller one) most of the time.
        if (sub && Math.random() < .7 && n1 * L / d1 >= n2 * L / d2) continue;
        break;
    }
    const [A, C] = [n1 * L / d1, n2 * L / d2];
    const p = mkMix(w1, n1, d1);
    const q = mkMix(w2, n2, d2);
    const op = sub ? '-' : '+';
    const answer = sub ? f(w1 * d1 + n1, d1).sub(f(w2 * d2 + n2, d2)) : f(w1 * d1 + n1, d1).add(f(w2 * d2 + n2, d2));
    const steps = [{
        he: `מוֹצְאִים מְכַנֶּה מְשׁוּתָּף לַשְּׁבָרִים: ${L}. הַשְּׁלֵמִים לֹא מִשְׁתַּנִּים.`,
        m: `${p} ${op} ${q} = ${mkMix(w1, A, L)} ${op} ${mkMix(w2, C, L)}`,
    }];
    let W, N;
    if (!sub) {
        W = w1 + w2; N = A + C;
        steps.push({ he: 'מְחַבְּרִים שְׁלֵמִים עִם שְׁלֵמִים, וּשְׁבָרִים עִם שְׁבָרִים.', m: `${w1} + ${w2} = ${W}`, m2: `${A}/${L} + ${C}/${L} = ${N}/${L}` });
    } else if (A < C) {
        steps.push({
            he: `הַשֶּׁבֶר {{${A}/${L}}} קָטָן מִ-{{${C}/${L}}}, אָז פּוֹרְטִים שָׁלֵם אֶחָד: שָׁלֵם אֶחָד הוּא {{${L}/${L}}}.`,
            m: `${mkMix(w1, A, L)} = ${mkMix(w1 - 1, A + L, L)}`,
        });
        W = w1 - 1 - w2; N = A + L - C;
        steps.push({ he: 'עַכְשָׁיו מְחַסְּרִים שְׁלֵמִים מִשְּׁלֵמִים, וּשְׁבָרִים מִשְּׁבָרִים.', m: `${w1 - 1} - ${w2} = ${W}`, m2: `${A + L}/${L} - ${C}/${L} = ${N}/${L}` });
    } else {
        W = w1 - w2; N = A - C;
        steps.push({ he: 'מְחַסְּרִים שְׁלֵמִים מִשְּׁלֵמִים, וּשְׁבָרִים מִשְּׁבָרִים.', m: `${w1} - ${w2} = ${W}`, m2: `${A}/${L} - ${C}/${L} = ${N}/${L}` });
    }
    const raw = mkMix(W, N, L);
    if (raw !== answer.mk()) steps.push({ he: N >= L ? 'הַשֶּׁבֶר גָּדוֹל מִשָּׁלֵם, אָז מַעֲבִירִים שָׁלֵם אֶחָד, וּמְצַמְצְמִים אִם אֶפְשָׁר.' : 'מְצַמְצְמִים אֶת הַשֶּׁבֶר.', m: `${raw} = ${answer.mk()}` });
    return {
        kind: 'frac', he: SOLVE, m: `${p} ${op} ${q} =`, plain: `${plainMix(w1, n1, d1)} ${op} ${plainMix(w2, n2, d2)}`, answer,
        hint: sub ? 'שְׁלֵמִים לְחוּד, שְׁבָרִים לְחוּד. אִם הַשֶּׁבֶר הָרִאשׁוֹן קָטָן מִדַּי, פּוֹרְטִים שָׁלֵם אֶחָד.' : 'מְחַבְּרִים שְׁלֵמִים לְחוּד וּשְׁבָרִים לְחוּד, אַחֲרֵי שֶׁמּוֹצְאִים מְכַנֶּה מְשׁוּתָּף.',
        steps,
        traps: traps(answer, [
            [sub && A < C ? f(w1 - w2).add(f(C - A, L)) : null, 'הֲפַכְתֶּם אֶת הַסֵּדֶר בַּשְּׁבָרִים. כְּשֶׁהַשֶּׁבֶר הָרִאשׁוֹן קָטָן יוֹתֵר, לֹא מְחַסְּרִים הָפוּךְ: פּוֹרְטִים שָׁלֵם אֶחָד.'],
        ]),
    };
}

/* ================================================================ dividing by a whole number */

function genDivide(level) {
    const story = Math.random() < .5;
    if (level === 1) {
        let a, b;
        do { a = rnd(1, 12); b = rnd(2, 10); } while (a % b === 0);
        const answer = f(a, b);
        const kind = pick(['bottles', 'cakes']);
        const he = !story ? `${SOLVE} {{${a} : ${b}}}` : kind === 'bottles'
            ? `בְּחָבִית יֵשׁ ${a} לִיטְרִים שֶׁל מַיִם. מוֹזְגִים אֶת כָּל הַמַּיִם שָׁוֶה בְּשָׁוֶה לְ-${b} בַּקְבּוּקִים. כַּמָּה לִיטְרִים יֵשׁ בְּכָל בַּקְבּוּק?`
            : `מְחַלְּקִים ${a} עוּגוֹת שָׁוֶה בְּשָׁוֶה בֵּין ${b} יְלָדִים. כַּמָּה עוּגָה מְקַבֵּל כָּל יֶלֶד?`;
        return {
            kind: 'frac', he, m: story ? null : `${a} : ${b} =`, plain: `${a} : ${b}`, answer, unit: story && kind === 'bottles' ? 'לִיטְר' : null,
            hint: 'חִילּוּק שֶׁל שָׁלֵם בְּשָׁלֵם אֶפְשָׁר לִכְתּוֹב כְּשֶׁבֶר: מָה שֶׁמְּחַלְּקִים לְמַעְלָה, וּבְכַמָּה מְחַלְּקִים לְמַטָּה.',
            steps: [
                ...(story ? [{ he: 'מְחַלְּקִים שָׁוֶה בְּשָׁוֶה, אָז כּוֹתְבִים תַּרְגִּיל חִילּוּק.', m: `${a} : ${b}` }] : []),
                { he: 'כּוֹתְבִים אֶת הַחִילּוּק כְּשֶׁבֶר: הַמְּחוּלָּק לְמַעְלָה, הַמְּחַלֵּק לְמַטָּה.', m: `${a} : ${b} = ${a}/${b}` },
                ...finish(a, b),
            ],
            traps: traps(answer, [[f(b, a), 'הֲפַכְתֶּם אֶת הַשֶּׁבֶר! מָה שֶׁמְּחַלְּקִים כּוֹתְבִים לְמַעְלָה, וְאֶת מִסְפַּר הַחֲלָקִים לְמַטָּה.']]),
        };
    }
    if (level === 2) {
        let n, d;
        do { [n, d] = proper(2, 9); } while (gcd(n, d) !== 1);
        const k = rnd(2, 8);
        const answer = f(n, d * k);
        return {
            kind: 'frac', plain: `${n}/${d} : ${k}`, answer,
            he: story ? `חִילַּקְתִּי {{${n}/${d}}} פִּיצָה שָׁוֶה בְּשָׁוֶה בֵּין ${k} חֲבֵרִים. אֵיזֶה חֵלֶק מֵהַפִּיצָה קִבֵּל כָּל חָבֵר?` : SOLVE,
            m: story ? null : `${n}/${d} : ${k} =`,
            hint: 'כְּשֶׁמְּחַלְּקִים שֶׁבֶר בְּמִסְפָּר שָׁלֵם, כּוֹפְלִים אֶת הַמְּכַנֶּה בַּמִּסְפָּר.',
            steps: [
                ...(story ? [{ he: 'מְחַלְּקִים אֶת הַחֵלֶק שֶׁל הַפִּיצָה בֵּין הַחֲבֵרִים, אָז כּוֹתְבִים חִילּוּק.', m: `${n}/${d} : ${k}` }] : []),
                { he: 'כְּשֶׁמְּחַלְּקִים שֶׁבֶר בְּמִסְפָּר שָׁלֵם, כּוֹפְלִים אֶת הַמְּכַנֶּה בַּמִּסְפָּר. כָּל חֵלֶק נַעֲשֶׂה קָטָן יוֹתֵר.', m: `${n}/${d} : ${k} = [${n}]/[${d} x ${k}] = ${n}/${d * k}` },
                ...finish(n, d * k),
            ],
            traps: traps(answer, [
                [f(n * k, d), 'כְּפַלְתֶּם בִּמְקוֹם לְחַלֵּק. כְּשֶׁמְּחַלְּקִים, כָּל חֵלֶק נַעֲשֶׂה קָטָן יוֹתֵר!'],
                [f(d * k, n), 'הֲפַכְתֶּם אֶת הַשֶּׁבֶר. הַמּוֹנֶה נִשְׁאָר לְמַעְלָה, וְרַק הַמְּכַנֶּה גָּדֵל.'],
            ]),
        };
    }
    // level 3: a mixed number, both ways
    const [n, d] = proper(2, 6);
    const w = rnd(1, 4);
    const k = rnd(2, 6);
    const P = w * d + n;
    if (Math.random() < .5) {
        const answer = f(P * k, d);
        return {
            kind: 'frac', unit: 'מֶטֶר', plain: `${w} ${n}/${d} x ${k}`, answer,
            he: `רוֹנִית גָּזְרָה חֶבֶל לְ-${k} חֲלָקִים שָׁוִים. אוֹרֶךְ כָּל חֵלֶק הוּא {{${w}_${n}/${d}}} מֶטֶר. מָה הָיָה אוֹרֶךְ הַחֶבֶל לִפְנֵי שֶׁגָּזְרָה אוֹתוֹ?`,
            hint: 'הַחֶבֶל הַשָּׁלֵם בָּנוּי מִכָּל הַחֲלָקִים יַחַד. אָז מְחַלְּקִים אוֹ כּוֹפְלִים?',
            steps: [
                { he: `הַחֶבֶל הַשָּׁלֵם הוּא ${k} חֲלָקִים כָּאֵלֶּה, אָז כּוֹפְלִים.`, m: `${w}_${n}/${d} x ${k}` },
                { he: 'הוֹפְכִים אֶת הַמִּסְפָּר הַמְּעוֹרָב לְשֶׁבֶר, וְכוֹפְלִים אֶת הַמּוֹנֶה.', m: `${P}/${d} x ${k} = ${P * k}/${d}` },
                ...finish(P * k, d),
            ],
            traps: traps(answer, [
                [f(P, d * k), 'חִילַּקְתֶּם, אֲבָל כָּאן מְחַפְּשִׂים אֶת הַחֶבֶל הַשָּׁלֵם, שֶׁאָרוֹךְ יוֹתֵר מִכָּל חֵלֶק.'],
                [f(w * k).add(f(n, d)), 'כְּפַלְתֶּם רַק אֶת הַשָּׁלֵם. צָרִיךְ לִכְפּוֹל גַּם אֶת הַשֶּׁבֶר!'],
            ]),
        };
    }
    const answer = f(P, d * k);
    return {
        kind: 'frac', he: SOLVE, m: `${w}_${n}/${d} : ${k} =`, plain: `${w} ${n}/${d} : ${k}`, answer,
        hint: 'קוֹדֶם הוֹפְכִים אֶת הַמִּסְפָּר הַמְּעוֹרָב לְשֶׁבֶר, וְאָז כּוֹפְלִים אֶת הַמְּכַנֶּה בַּמִּסְפָּר.',
        steps: [
            { he: `הוֹפְכִים לְשֶׁבֶר: ${w} כָּפוּל ${d}, וְעוֹד ${n}.`, m: `${w}_${n}/${d} = ${P}/${d}` },
            { he: 'מְחַלְּקִים בְּמִסְפָּר שָׁלֵם: כּוֹפְלִים אֶת הַמְּכַנֶּה.', m: `${P}/${d} : ${k} = [${P}]/[${d} x ${k}] = ${P}/${d * k}` },
            ...finish(P, d * k),
        ],
        traps: traps(answer, [
            [f(n, d * k).add(f(w)), 'חִילַּקְתֶּם רַק אֶת הַשֶּׁבֶר וְהִשְׁאַרְתֶּם אֶת הַשָּׁלֵם. קוֹדֶם הוֹפְכִים הַכֹּל לְשֶׁבֶר.'],
            [f(P * k, d), 'כְּפַלְתֶּם בִּמְקוֹם לְחַלֵּק.'],
        ]),
    };
}

/* ================================================================ ordering fractions and decimals */

const decText = v => String(Math.round(v * 1000) / 1000);
const exactDec = v => Math.abs(Math.round(v * 1000) / 1000 - v) < 1e-9;

function numPool(level) {
    const dens = [[2, 3, 4, 5, 10], [2, 3, 4, 5, 8, 10, 20, 25], [3, 4, 5, 8, 12, 20, 25, 40, 50]][level - 1];
    const items = [];
    for (const d of dens) {
        for (let n = 1; n < d * (level === 1 ? 1 : 1.5); n++) {
            if (gcd(n, d) !== 1) continue;
            items.push(n > d && level > 1
                ? { mk: `${Math.floor(n / d)}_${n % d}/${d}`, v: n / d, frac: [n, d] }
                : { mk: `${n}/${d}`, v: n / d, frac: [n, d] });
        }
    }
    const decs = level === 1 ? [.1, .2, .3, .4, .5, .6, .7, .8, .9] : [.05, .15, .25, .3, .35, .45, .5, .6, .65, .7, .75, .8, .85, .9, .95, 1.2, 1.25, 1.5];
    for (const x of decs) items.push({ mk: String(x), v: x, dec: true });
    return items.filter(it => it.v > 0 && it.v < (level === 1 ? 1 : 2));
}

function pickDistinct(pool, count, gap, needBoth) {
    for (let tries = 0; tries < 400; tries++) {
        const picked = shuffle(pool).slice(0, count);
        const vs = picked.map(p => p.v).sort((a, b) => a - b);
        if (vs.some((v, k) => k && v - vs[k - 1] < gap)) continue;
        if (needBoth && !(picked.some(p => p.dec) && picked.some(p => !p.dec))) continue;
        return picked;
    }
    return null;
}

const convert = it => (it.dec ? null : {
    he: exactDec(it.v) ? `הוֹפְכִים לְעֶשְׂרוֹנִי: ${it.frac[0]} לְחַלֵּק לְ-${it.frac[1]}.` : `{{${it.mk}}} לֹא נִגְמָר כְּעֶשְׂרוֹנִי, אָז מְעַגְּלִים.`,
    m: `${it.mk} ${exactDec(it.v) ? '=' : '≈'} ${decText(it.v)}`,
});

function genOrder(level) {
    const pool = numPool(level);
    if (level === 1 && Math.random() < .5) {
        const [A, B] = pickDistinct(pool, 2, .05, true);
        const sign = A.v < B.v ? '<' : '>';
        return {
            kind: 'sign', sign, he: 'אֵיזֶה סִימָן מַתְאִים?', m: `${A.mk} ○ ${B.mk}`,
            hint: 'הָפְכוּ אֶת הַשֶּׁבֶר לְמִסְפָּר עֶשְׂרוֹנִי, וְאָז הַשְׁווּ.',
            steps: [...[A, B].map(convert).filter(Boolean), { he: 'עַכְשָׁיו קַל לְהַשְׁווֹת:', m: `${A.mk} ${sign} ${B.mk}` }],
        };
    }
    const items = pickDistinct(pool, level === 1 ? 3 : 4, [.1, .04, .015][level - 1], level > 1);
    if (!items) return genOrder(level);
    const order = items.map((_, i) => i).sort((a, b) => items[a].v - items[b].v);
    const sorted = order.map(i => items[i]);
    return {
        kind: 'order', he: 'סַדְּרוּ אֶת הַמִּסְפָּרִים מֵהַקָּטָן לַגָּדוֹל. לַחֲצוּ עֲלֵיהֶם לְפִי הַסֵּדֶר.', items, order,
        hint: 'הָפְכוּ כָּל שֶׁבֶר לְמִסְפָּר עֶשְׂרוֹנִי: מוֹנֶה לְחַלֵּק לַמְּכַנֶּה. אָז קַל לְהַשְׁווֹת.',
        steps: [
            { he: 'הוֹפְכִים כָּל שֶׁבֶר לְמִסְפָּר עֶשְׂרוֹנִי, כְּדֵי שֶׁיִּהְיֶה קַל לְהַשְׁווֹת.' },
            ...items.map(convert).filter(Boolean),
            { he: 'עַכְשָׁיו מְסַדְּרִים מֵהַקָּטָן לַגָּדוֹל:', m: sorted.map(s => s.mk).join(' < '), viz: numberLine(sorted) },
        ],
    };
}

function numberLine(items) {
    const max = items.at(-1).v > 1 ? 2 : 1;
    return { type: 'line', min: 0, max, ticks: Array.from({ length: max * 4 + 1 }, (_, k) => k / 4), items: items.map(i => ({ mk: i.mk, v: i.v })) };
}

/* ================================================================ order of operations */

const OPS = ['x', ':', '+', '-'];
const isOp = t => OPS.includes(t);
const calc = (a, op, b) => (op === 'x' ? a * b : op === ':' ? a / b : op === '+' ? a + b : a - b);
const mkTok = t => t.join(' ');

/** One step: the first operation that should be done next. */
function reduceOnce(t) {
    let lo = 0, hi = t.length, paren = false;
    const close = t.indexOf(')');
    if (close >= 0) { lo = t.lastIndexOf('(', close) + 1; hi = close; paren = true; }
    const seg = t.slice(lo, hi);
    let k = seg.findIndex(x => x === 'x' || x === ':');
    let kind = 'mul';
    if (k < 0) { k = seg.findIndex(x => x === '+' || x === '-'); kind = 'add'; }
    const v = calc(seg[k - 1], seg[k], seg[k + 1]);
    const inner = [...seg.slice(0, k - 1), v, ...seg.slice(k + 2)];
    const out = paren && inner.length === 1 ? [...t.slice(0, lo - 1), v, ...t.slice(hi + 1)] : [...t.slice(0, lo), ...inner, ...t.slice(hi)];
    return { t: out, kind: paren ? 'paren' : kind, v };
}

function solveOps(t) {
    const steps = [];
    let cur = t;
    while (cur.length > 1) {
        const r = reduceOnce(cur);
        if (!Number.isInteger(r.v) || r.v < 0) return null;
        steps.push({ from: cur, to: r.t, kind: r.kind });
        cur = r.t;
    }
    return { value: cur[0], steps };
}

/** What you get when going left to right (still doing brackets first). */
function leftToRight(t) {
    const lr = s => { let v = s[0]; for (let i = 1; i < s.length; i += 2) v = calc(v, s[i], s[i + 1]); return v; };
    const c = [...t];
    while (c.includes(')')) { const e = c.indexOf(')'); const o = c.lastIndexOf('(', e); c.splice(o, e - o + 1, lr(c.slice(o + 1, e))); }
    return lr(c);
}

const TEMPLATES = [
    [['A', '-', 'B', ':', 'C', '+', 'D'], ['A', '+', 'B', 'x', 'C', '-', 'D'], ['A', ':', 'B', '+', 'C', 'x', 'D'], ['A', '-', 'B', 'x', 'C']],
    [['A', ':', '(', 'B', ':', 'C', ')', '+', 'D'], ['(', 'A', '+', 'B', ')', 'x', 'C', '-', 'D'], ['A', '-', '(', 'B', '-', 'C', ')', 'x', 'D'], ['A', 'x', 'B', '-', 'C', ':', 'D']],
    [['A', 'x', '(', 'B', '-', 'C', ')', ':', 'D', '+', 'E'], ['(', 'A', '+', 'B', ')', ':', '(', 'C', '-', 'D', ')', 'x', 'E'], ['A', '-', 'B', 'x', 'C', ':', 'D', '+', '(', 'E', '-', 'F', ')'], ['A', ':', '(', 'B', 'x', 'C', ')', '+', 'D', 'x', 'E']],
];

const OPS_TEXT = {
    paren: 'קוֹדֶם פּוֹתְרִים אֶת מָה שֶׁבְּתוֹךְ הַסּוֹגְרַיִם.',
    mul: 'כֶּפֶל וְחִילּוּק בָּאִים לִפְנֵי חִיבּוּר וְחִיסּוּר, מִשְּׂמֹאל לְיָמִין.',
    add: 'נִשְׁאֲרוּ חִיבּוּר וְחִיסּוּר: פּוֹתְרִים מִשְּׂמֹאל לְיָמִין.',
};

function genOps(level) {
    for (let tries = 0; tries < 5000; tries++) {
        const tpl = pick(TEMPLATES[level - 1]);
        const t = tpl.map(x => (/^[A-F]$/.test(x) ? rnd(2, x === 'A' && level === 1 ? 90 : 24) : x));
        const sol = solveOps(t);
        if (!sol || sol.value > 999) continue;
        const lr = leftToRight(t);
        const plainOps = solveOps(t.filter(x => x !== '(' && x !== ')'));
        const noParen = t.includes('(') && plainOps ? plainOps.value : null;
        // Only exercises where the order matters are worth practicing.
        if (lr === sol.value && (noParen === null || noParen === sol.value)) continue;
        const answer = f(sol.value);
        return {
            kind: 'int', he: SOLVE, m: `${mkTok(t)} =`, plain: mkTok(t), answer,
            hint: 'קוֹדֶם סוֹגְרַיִם, אַחַר כָּךְ כֶּפֶל וְחִילּוּק, וּבַסּוֹף חִיבּוּר וְחִיסּוּר.',
            steps: [
                { he: 'בּוֹדְקִים מָה הַסֵּדֶר: סוֹגְרַיִם, כֶּפֶל וְחִילּוּק, וּבַסּוֹף חִיבּוּר וְחִיסּוּר.', viz: { type: 'ladder' } },
                ...sol.steps.map(s => ({ he: OPS_TEXT[s.kind], m: `${mkTok(s.from)} = ${mkTok(s.to)}` })),
            ],
            traps: traps(answer, [
                [Number.isInteger(lr) && lr >= 0 ? f(lr) : null, 'פְּתַרְתֶּם לְפִי הַסֵּדֶר מִשְּׂמֹאל לְיָמִין. אֲבָל כֶּפֶל וְחִילּוּק בָּאִים לִפְנֵי חִיבּוּר וְחִיסּוּר!'],
                [noParen !== null ? f(noParen) : null, 'שְׁכַחְתֶּם אֶת הַסּוֹגְרַיִם! מָה שֶׁבְּתוֹךְ הַסּוֹגְרַיִם פּוֹתְרִים רִאשׁוֹן.'],
            ]),
        };
    }
    return genOps(1);
}

/* ================================================================ big numbers */

const digits = n => rnd(10 ** (n - 1), 10 ** n - 1);

/** Digit by digit, without carrying or borrowing: the classic slip. */
function noCarry(a, b, op) {
    const A = String(a), B = String(b).padStart(A.length, '0');
    let out = '';
    for (let i = 0; i < A.length; i++) {
        const x = +A[i], y = +B[i];
        out += op === '+' ? (x + y) % 10 : Math.abs(x - y);
    }
    return Number(out);
}

function placeParts(n) {
    const s = String(n);
    return [...s].map((ch, i) => Number(ch) * 10 ** (s.length - 1 - i)).filter(Boolean);
}

function genBig(level) {
    const op = pick(['+', '-', 'x', ':']);
    let a, b, answer, steps, tr = [];
    if (op === '+') {
        [a, b] = level === 1 ? [digits(4), digits(4)] : level === 2 ? [digits(6), digits(6)] : [digits(7), digits(6)];
        const r = a + b;
        answer = f(r);
        steps = [
            { he: 'כּוֹתְבִים בְּטוּר: אֲחָדוֹת מִתַּחַת לַאֲחָדוֹת, עֲשָׂרוֹת מִתַּחַת לַעֲשָׂרוֹת.', viz: { type: 'column', a, b, op } },
            { he: 'מְחַבְּרִים כָּל טוּר, מִיָּמִין לִשְׂמֹאל. כְּשֶׁיּוֹצֵא 10 אוֹ יוֹתֵר, כּוֹתְבִים אֶת הָאֲחָדוֹת וּמַעֲבִירִים 1 לַטּוּר הַבָּא.', m: `${a} + ${b} = ${r}`, viz: { type: 'column', a, b, op, result: r } },
        ];
        tr = [[f(noCarry(a, b, '+')), 'שְׁכַחְתֶּם אֶת הַהַעֲבָרָה! כְּשֶׁסְּכוּם בְּטוּר הוּא 10 אוֹ יוֹתֵר, מַעֲבִירִים 1 לַטּוּר הַבָּא.']];
    } else if (op === '-') {
        if (level > 1 && Math.random() < .35) { a = 10 ** (level + 3); b = digits(level + 3); }
        else { a = level === 1 ? digits(4) : digits(6); b = rnd(Math.floor(a / 3), a - 1); }
        const r = a - b;
        answer = f(r);
        steps = [
            { he: 'כּוֹתְבִים בְּטוּר: הַמִּסְפָּר הַגָּדוֹל לְמַעְלָה.', viz: { type: 'column', a, b, op } },
            { he: 'מְחַסְּרִים כָּל טוּר מִיָּמִין לִשְׂמֹאל. כְּשֶׁהַסִּפְרָה לְמַעְלָה קְטַנָּה מִדַּי, פּוֹרְטִים: לוֹקְחִים 1 מֵהַטּוּר שֶׁמִּשְּׂמֹאל.', m: `${a} - ${b} = ${r}`, viz: { type: 'column', a, b, op, result: r } },
            { he: 'בּוֹדְקִים: מְחַבְּרִים אֶת הַתּוֹצָאָה לַמִּסְפָּר שֶׁחִיסַּרְנוּ, וּמְקַבְּלִים אֶת הַמִּסְפָּר הַגָּדוֹל.', m: `${r} + ${b} = ${a}` },
        ];
        tr = [[f(noCarry(a, b, '-')), 'בְּטוּר שֶׁבּוֹ הַסִּפְרָה לְמַעְלָה קְטַנָּה, לֹא מְחַסְּרִים הָפוּךְ! פּוֹרְטִים 1 מֵהַטּוּר שֶׁמִּשְּׂמֹאל.']];
    } else if (op === 'x') {
        [a, b] = level === 1 ? [digits(3), rnd(3, 9)] : level === 2 ? [digits(3), digits(2)] : [digits(3), rnd(110, 999)];
        if (b > a) [a, b] = [b, a];
        const parts = placeParts(b);
        const prods = parts.map(p => a * p);
        const r = a * b;
        answer = f(r);
        steps = parts.length === 1
            ? [{ he: 'כּוֹפְלִים כָּל סִפְרָה, מִיָּמִין לִשְׂמֹאל, וּמַעֲבִירִים לַטּוּר הַבָּא כְּשֶׁצָּרִיךְ.', m: `${a} x ${b} = ${r}` }]
            : [
                { he: `מְפָרְקִים אֶת ${b} לְפִי מְקוֹם הַסִּפְרוֹת.`, m: `${b} = ${parts.join(' + ')}` },
                ...parts.map((p, k) => ({ he: k === 0 ? `כּוֹפְלִים אֶת ${a} בְּכָל חֵלֶק.` : 'וְעוֹד חֵלֶק:', m: `${a} x ${p} = ${prods[k]}` })),
                { he: 'מְחַבְּרִים אֶת כָּל הַתּוֹצָאוֹת.', m: `${prods.join(' + ')} = ${r}`, viz: { type: 'column', a, b, op, partials: [...prods].reverse(), result: r } },
            ];
        const unshifted = parts.reduce((s, p) => s + a * Number(String(p)[0]), 0);
        tr = [[parts.length > 1 ? f(unshifted) : null, 'כְּשֶׁכּוֹפְלִים בַּעֲשָׂרוֹת, צָרִיךְ לְהוֹסִיף אֶפֶס: כָּפוּל 50 זֶה כָּפוּל 5 וְעוֹד אֶפֶס בַּסּוֹף.']];
    } else {
        b = rnd(2, 9);
        const q = level === 1 ? digits(3) : level === 2 ? digits(4) : digits(5);
        a = q * b;
        answer = f(q);
        const parts = placeParts(q);
        steps = [
            { he: `מְפָרְקִים אֶת ${a} לַחֲלָקִים שֶׁקַּל לְחַלֵּק בְּ-${b}.`, m: `${a} = ${parts.map(p => p * b).join(' + ')}` },
            ...parts.map(p => ({ he: 'מְחַלְּקִים כָּל חֵלֶק:', m: `${p * b} : ${b} = ${p}` })),
            { he: 'מְחַבְּרִים אֶת הַתּוֹצָאוֹת.', m: `${parts.join(' + ')} = ${q}` },
            { he: 'בּוֹדְקִים בְּכֶפֶל:', m: `${q} x ${b} = ${a}` },
        ];
        const noZero = Number(String(q).replace(/0/g, ''));
        tr = [[noZero !== q ? f(noZero) : null, 'אִבַּדְתֶּם אֶפֶס בַּתּוֹצָאָה! כְּשֶׁסִּפְרָה לֹא מִתְחַלֶּקֶת, כּוֹתְבִים 0 בַּמָּנָה וּמַמְשִׁיכִים.']];
    }
    return {
        kind: 'int', he: SOLVE, m: `${a} ${op} ${b} =`, plain: `${a} ${op} ${b} (the pupil may calculate in columns)`, answer,
        hint: { '+': 'כִּתְבוּ בְּטוּר וְחַבְּרוּ מִיָּמִין לִשְׂמֹאל. אַל תִּשְׁכְּחוּ אֶת הַהַעֲבָרָה!', '-': 'כִּתְבוּ בְּטוּר וְחַסְּרוּ מִיָּמִין לִשְׂמֹאל. כְּשֶׁחָסֵר, פּוֹרְטִים מֵהַשָּׁכֵן.', x: 'פָּרְקוּ אֶת הַמִּסְפָּר הַקָּטָן לְמֵאוֹת, עֲשָׂרוֹת וַאֲחָדוֹת, וְכִפְלוּ כָּל חֵלֶק.', ':': 'פָּרְקוּ אֶת הַמִּסְפָּר לַחֲלָקִים שֶׁמִּתְחַלְּקִים בְּקַלּוּת, וְחַלְּקוּ כָּל חֵלֶק.' }[op],
        steps, traps: traps(answer, tr),
    };
}

/* ================================================================ estimation */

const UNIT_NAME = { 1000: 'לָאֲלָפִים', 10000: 'לַעֲשָׂרוֹת הָאֲלָפִים', 100000: 'לִמְאוֹת הָאֲלָפִים' };

function nearRound(unit, lo, hi) {
    const R = rnd(lo, hi) * unit;
    let off;
    do { off = rnd(-Math.round(unit * .18), Math.round(unit * .18)); } while (Math.abs(off) < unit * .005);
    return { x: R + off, round: R, cut: Math.floor((R + off) / unit) * unit };
}

function genEstimate(level) {
    if (level > 1 && Math.random() < .4) {
        const a = rnd(2, 9) * 10 + pick([-2, -1, 1, 2]);
        const b = rnd(2, 9) * 100 + pick([-30, -20, -10, 10, 20, 30]) + rnd(-4, 4);
        const ra = Math.round(a / 10) * 10, rb = Math.round(b / 100) * 100;
        const est = ra * rb;
        const opts = shuffle([est, est / 10, est * 10, (ra + 10) * (rb + 100)]);
        return {
            kind: 'choice', he: `אֵיזֶה מִסְפָּר הֲכִי קָרוֹב לַתּוֹצָאָה שֶׁל {{${a} x ${b}}}? עֲנוּ בְּלִי לְחַשֵּׁב בְּדִיּוּק!`,
            options: opts.map(o => `{{${o}}}`), correct: opts.indexOf(est),
            hint: `עַגְּלוּ אֶת ${a} לָעֲשָׂרוֹת וְאֶת ${b} לַמֵּאוֹת, וְכִפְלוּ אֶת הַמִּסְפָּרִים הָעֲגוּלִים.`,
            steps: [
                { he: 'מְעַגְּלִים כָּל מִסְפָּר לְמִסְפָּר עָגוֹל קָרוֹב.', m: `${a} ≈ ${ra}`, m2: `${b} ≈ ${rb}` },
                { he: 'כּוֹפְלִים אֶת הַמִּסְפָּרִים הָעֲגוּלִים.', m: `${ra} x ${rb} = ${est}` },
                { he: 'וְהַתּוֹצָאָה הַמְּדוּיֶּקֶת, לִבְדִיקָה:', m: `${a} x ${b} = ${a * b}` },
            ],
        };
    }
    const unit = [1000, 10000, 100000][level - 1];
    const sub = Math.random() < .6;
    let X, Y;
    // Both numbers at least 2 units, so rounding the wrong way never gives 0.
    do { X = nearRound(unit, 4, 9); Y = nearRound(unit, 2, 8); } while (X.round <= Y.round);
    const other = v => (v.cut === v.round ? v.round + unit : v.cut);
    const combos = [[X.round, Y.round], [other(X), Y.round], [X.round, other(Y)], [other(X), other(Y)]];
    const opts = shuffle(combos);
    const op = sub ? '-' : '+';
    const why = opts.map(([p, q]) => {
        const bad = p !== X.round ? X : q !== Y.round ? Y : null;
        return bad ? `מְעַגְּלִים לַמִּסְפָּר הָעָגוֹל הַקָּרוֹב, לֹא קוֹטְעִים! {{${bad.x}}} קָרוֹב יוֹתֵר לְ-{{${bad.round}}} מֵאֲשֶׁר לְ-{{${other(bad)}}}.` : null;
    });
    return {
        kind: 'choice',
        he: sub ? `בְּאֶמְצָעוּת אֵיזֶה תַּרְגִּיל אֶפְשָׁר לֶאֱמוֹד אֶת הַהֶפְרֵשׁ בֵּין {{${X.x}}} לְבֵין {{${Y.x}}}?` : `בְּאֶמְצָעוּת אֵיזֶה תַּרְגִּיל אֶפְשָׁר לֶאֱמוֹד אֶת הַסְּכוּם שֶׁל {{${X.x}}} וְ-{{${Y.x}}}?`,
        options: opts.map(([p, q]) => `{{${p} ${op} ${q}}}`), correct: opts.findIndex(([p, q]) => p === X.round && q === Y.round), why,
        hint: `עַגְּלוּ כָּל מִסְפָּר ${UNIT_NAME[unit]} הַקְּרוֹבוֹת. לְאָן הוּא קָרוֹב יוֹתֵר: לְמַעְלָה אוֹ לְמַטָּה?`,
        steps: [
            { he: `מְעַגְּלִים אֶת {{${X.x}}} ${UNIT_NAME[unit]} הַקְּרוֹבוֹת.`, m: `${X.x} ≈ ${X.round}`, viz: roundLine(X, unit) },
            { he: `מְעַגְּלִים אֶת {{${Y.x}}} ${UNIT_NAME[unit]} הַקְּרוֹבוֹת.`, m: `${Y.x} ≈ ${Y.round}`, viz: roundLine(Y, unit) },
            { he: 'מְחַשְּׁבִים עִם הַמִּסְפָּרִים הָעֲגוּלִים.', m: `${X.round} ${op} ${Y.round} = ${sub ? X.round - Y.round : X.round + Y.round}` },
        ],
    };
}

function roundLine(V, unit) {
    const lo = Math.floor(V.x / unit) * unit;
    return { type: 'line', min: lo, max: lo + unit, ticks: [lo, lo + unit / 2, lo + unit], items: [{ mk: String(V.x), v: V.x }], big: true };
}

/* ================================================================ solids */

const POLY = {
    3: ['מְשׁוּלָּשׁ', 'מְשׁוּלֶּשֶׁת'], 4: ['מְרוּבָּע', 'מְרוּבַּעַת'], 5: ['מְחוּמָּשׁ', 'מְחוּמֶּשֶׁת'], 6: ['מְשׁוּשֶּׁה', 'מְשׁוּשָּׁה'],
    7: ['מְשׁוּבָּע', 'מְשׁוּבַּעַת'], 8: ['מְתוּמָּן', 'מְתוּמֶּנֶת'], 9: ['מְתוּשָּׁע', 'מְתוּשַּׁעַת'], 10: ['מְעוּשָּׂר', 'מְעוּשֶּׂרֶת'],
};
const SHAPE = { prism: 'מִנְסָרָה', pyramid: 'פִּירָמִידָה' };
// With the prefix לְ the פּ loses its dagesh: לְפִירָמִידָה.
const TO_SHAPE = { prism: 'לְמִנְסָרָה', pyramid: 'לְפִירָמִידָה' };
const PROP = { lat: 'פֵּאוֹת בַּמַּעֲטֶפֶת', edges: 'מִקְצוֹעוֹת', verts: 'קוֹדְקוֹדִים', bases: 'בְּסִיסִים' };

export const solidCounts = (shape, n) => (shape === 'prism'
    ? { lat: n, edges: 3 * n, verts: 2 * n, bases: 2 }
    : { lat: n, edges: 2 * n, verts: n + 1, bases: 1 });

function why(shape, prop, n) {
    const c = solidCounts(shape, n);
    if (shape === 'prism') return {
        lat: { he: 'לְכָל צֶלַע שֶׁל הַבָּסִיס יֵשׁ פֵּאָה אַחַת בַּמַּעֲטֶפֶת, בְּצוּרַת מַלְבֵּן.', m: `${n}` },
        edges: { he: `${n} מִקְצוֹעוֹת בַּבָּסִיס לְמַטָּה, ${n} בַּבָּסִיס לְמַעְלָה, וְעוֹד ${n} מִקְצוֹעוֹת שֶׁמְּחַבְּרִים בֵּינֵיהֶם.`, m: `${n} + ${n} + ${n} = ${c.edges}` },
        verts: { he: `${n} קוֹדְקוֹדִים בְּכָל בָּסִיס, וְיֵשׁ שְׁנֵי בְּסִיסִים.`, m: `${n} x 2 = ${c.verts}` },
        bases: { he: 'לְכָל מִנְסָרָה יֵשׁ שְׁנֵי בְּסִיסִים זֵהִים: לְמַטָּה וּלְמַעְלָה.', m: '2' },
    }[prop];
    return {
        lat: { he: 'לְכָל צֶלַע שֶׁל הַבָּסִיס יֵשׁ פֵּאָה אַחַת בַּמַּעֲטֶפֶת, בְּצוּרַת מְשׁוּלָּשׁ.', m: `${n}` },
        edges: { he: `${n} מִקְצוֹעוֹת בַּבָּסִיס, וְעוֹד ${n} מִקְצוֹעוֹת שֶׁעוֹלִים אֶל הַקּוֹדְקוֹד שֶׁלְּמַעְלָה.`, m: `${n} + ${n} = ${c.edges}` },
        verts: { he: `${n} קוֹדְקוֹדִים בַּבָּסִיס, וְעוֹד קוֹדְקוֹד אֶחָד לְמַעְלָה.`, m: `${n} + 1 = ${c.verts}` },
        bases: { he: 'לְפִירָמִידָה יֵשׁ בָּסִיס אֶחָד בִּלְבַד.', m: '1' },
    }[prop];
}

const TF = [
    { he: 'לְכָל הַמִּנְסָרוֹת יֵשׁ בָּסִיס מְרוּבָּע.', ok: false, reason: 'לֹא נָכוֹן. דּוּגְמָה נֶגְדִּית: לְמִנְסָרָה מְשׁוּלֶּשֶׁת יֵשׁ בָּסִיס מְשׁוּלָּשׁ.', viz: { type: 'solid', shape: 'prism', n: 3 } },
    { he: 'קַיֶּמֶת פִּירָמִידָה שֶׁיֵּשׁ לָהּ רַק שְׁלוֹשָׁה קוֹדְקוֹדִים.', ok: false, reason: 'לֹא נָכוֹן. לַפִּירָמִידָה הֲכִי קְטַנָּה, הַפִּירָמִידָה הַמְּשׁוּלֶּשֶׁת, יֵשׁ 4 קוֹדְקוֹדִים: 3 בַּבָּסִיס וְאֶחָד לְמַעְלָה.', viz: { type: 'solid', shape: 'pyramid', n: 3 } },
    { he: 'כָּל פִּירָמִידָה הִיא פֵּאוֹן.', ok: true, reason: 'נָכוֹן. כָּל הַפֵּאוֹת שֶׁל פִּירָמִידָה הֵן מְצוּלָּעִים, וְגוּף כָּזֶה נִקְרָא פֵּאוֹן.' },
    { he: 'כָּל הַפֵּאוֹת בְּמִנְסָרָה מְשׁוּלֶּשֶׁת הֵן בְּצוּרַת מְשׁוּלָּשׁ.', ok: false, reason: 'לֹא נָכוֹן. רַק שְׁנֵי הַבְּסִיסִים הֵם מְשׁוּלָּשִׁים. הַפֵּאוֹת בַּמַּעֲטֶפֶת הֵן מַלְבֵּנִים.', viz: { type: 'solid', shape: 'prism', n: 3 } },
    { he: 'הַפֵּאוֹת בַּמַּעֲטֶפֶת שֶׁל פִּירָמִידָה הֵן מְשׁוּלָּשִׁים.', ok: true, reason: 'נָכוֹן. כָּל פֵּאָה בַּמַּעֲטֶפֶת עוֹלָה מִצֶּלַע שֶׁל הַבָּסִיס אֶל הַקּוֹדְקוֹד שֶׁלְּמַעְלָה, וְלָכֵן הִיא מְשׁוּלָּשׁ.', viz: { type: 'solid', shape: 'pyramid', n: 4 } },
    { he: 'כָּל פֵּאוֹן הוּא מִנְסָרָה.', ok: false, reason: 'לֹא נָכוֹן. דּוּגְמָה נֶגְדִּית: פִּירָמִידָה הִיא פֵּאוֹן, אֲבָל הִיא לֹא מִנְסָרָה.', viz: { type: 'solid', shape: 'pyramid', n: 5 } },
    { he: 'לְכָל מִנְסָרָה יֵשׁ שְׁנֵי בְּסִיסִים.', ok: true, reason: 'נָכוֹן. לְמִנְסָרָה יֵשׁ תָּמִיד שְׁנֵי בְּסִיסִים זֵהִים, לְמַטָּה וּלְמַעְלָה.' },
    { he: 'לְפִירָמִידָה יֵשׁ שְׁנֵי בְּסִיסִים.', ok: false, reason: 'לֹא נָכוֹן. לְפִירָמִידָה יֵשׁ בָּסִיס אֶחָד בִּלְבַד, וּלְמַעְלָה יֵשׁ קוֹדְקוֹד.' },
    { he: 'קוּבִּיָּה הִיא מִנְסָרָה.', ok: true, reason: 'נָכוֹן. קוּבִּיָּה הִיא מִנְסָרָה מְרוּבַּעַת, שֶׁכָּל הַפֵּאוֹת שֶׁלָּהּ רִיבּוּעִים.', viz: { type: 'solid', shape: 'prism', n: 4 } },
    { he: 'גְּלִיל הוּא פֵּאוֹן.', ok: false, reason: 'לֹא נָכוֹן. לִגְלִיל יֵשׁ מַעֲטֶפֶת מְעוּגֶּלֶת, וּבְפֵאוֹן כָּל הַפֵּאוֹת הֵן מְצוּלָּעִים יְשָׁרִים.' },
    { he: 'בְּפִירָמִידָה מְרוּבַּעַת יֵשׁ 5 קוֹדְקוֹדִים.', ok: true, reason: 'נָכוֹן. 4 קוֹדְקוֹדִים בַּבָּסִיס, וְעוֹד אֶחָד לְמַעְלָה.', viz: { type: 'solid', shape: 'pyramid', n: 4 } },
    { he: 'לְמִנְסָרָה מְשׁוּשָּׁה יֵשׁ 12 מִקְצוֹעוֹת.', ok: false, reason: 'לֹא נָכוֹן. יֵשׁ לָהּ 18 מִקְצוֹעוֹת: 6 לְמַטָּה, 6 לְמַעְלָה, וְעוֹד 6 שֶׁמְּחַבְּרִים בֵּינֵיהֶם.', viz: { type: 'solid', shape: 'prism', n: 6 } },
];

function genSolids(level) {
    if (Math.random() < (level === 3 ? .3 : .4)) {
        const s = pick(TF);
        return {
            kind: 'choice', he: `נָכוֹן אוֹ לֹא נָכוֹן? "${s.he}"`, options: ['נָכוֹן ✓', 'לֹא נָכוֹן ✗'], correct: s.ok ? 0 : 1, reason: s.reason, viz: null,
            hint: 'דַּמְיְנוּ אֶת הַגּוּף, אוֹ חַפְּשׂוּ דּוּגְמָה נֶגְדִּית: גּוּף אֶחָד שֶׁלֹּא מַתְאִים לַמִּשְׁפָּט.',
            steps: [{ he: s.reason, viz: s.viz }],
        };
    }
    const shape = pick(['prism', 'pyramid']);
    const prop = pick(['lat', 'edges', 'verts', 'bases', 'edges', 'verts']);
    if (level === 3 && Math.random() < .5) {
        // Backwards: from the count to the base.
        const n = rnd(5, 20);
        const p = pick(['edges', 'verts']);
        const total = solidCounts(shape, n)[p];
        const back = shape === 'prism' ? (p === 'edges' ? `${total} : 3 = ${n}` : `${total} : 2 = ${n}`) : (p === 'edges' ? `${total} : 2 = ${n}` : `${total} - 1 = ${n}`);
        return {
            kind: 'int', answer: f(n), unit: 'צְלָעוֹת',
            he: `${TO_SHAPE[shape]} יֵשׁ ${total} ${PROP[p]}. כַּמָּה צְלָעוֹת יֵשׁ לַבָּסִיס שֶׁלָּהּ?`,
            hint: 'כִּתְבוּ אֶת הַחוּקִּיּוּת לְבָסִיס עִם n צְלָעוֹת, וְאָז לְכוּ אָחוֹרָה.',
            steps: [why(shape, p, n), { he: 'הוֹלְכִים אָחוֹרָה וּמוֹצְאִים אֶת מִסְפַּר הַצְּלָעוֹת שֶׁל הַבָּסִיס.', m: back }],
            traps: traps(f(n), [[f(total), 'זֶה הַמִּסְפָּר שֶׁבַּשְּׁאֵלָה. שָׁאֲלוּ עַל מִסְפַּר הַצְּלָעוֹת שֶׁל הַבָּסִיס.']]),
        };
    }
    const n = level === 1 ? rnd(3, 6) : rnd(3, 10);
    const c = solidCounts(shape, n);
    const name = `${SHAPE[shape]} ${POLY[n][1]}`;
    const toName = `${TO_SHAPE[shape]} ${POLY[n][1]}`;
    const answer = f(c[prop]);
    return {
        kind: 'int', answer, unit: PROP[prop].split(' ')[0],
        he: `כַּמָּה ${PROP[prop]} יֵשׁ ${toName}?`, viz: n <= 8 ? { type: 'solid', shape, n } : null,
        hint: `הַבָּסִיס הוּא ${POLY[n][0]}: כַּמָּה צְלָעוֹת יֵשׁ לוֹ? מִשָּׁם מַתְחִילִים.`,
        steps: [
            { he: `הַבָּסִיס שֶׁל ${name} הוּא ${POLY[n][0]}, וְיֵשׁ לוֹ ${n} צְלָעוֹת.`, viz: n <= 8 ? { type: 'solid', shape, n } : null },
            why(shape, prop, n),
        ],
        traps: traps(answer, [
            [shape === 'prism' && prop === 'edges' ? f(2 * n) : null, 'שְׁכַחְתֶּם אֶת הַמִּקְצוֹעוֹת שֶׁמְּחַבְּרִים בֵּין שְׁנֵי הַבְּסִיסִים.'],
            [shape === 'pyramid' && prop === 'verts' ? f(n) : null, 'שְׁכַחְתֶּם אֶת הַקּוֹדְקוֹד שֶׁלְּמַעְלָה, בַּקָּצֶה שֶׁל הַפִּירָמִידָה.'],
            [shape === 'prism' && prop === 'verts' ? f(n) : null, 'סְפַרְתֶּם רַק בָּסִיס אֶחָד. לְמִנְסָרָה יֵשׁ שְׁנֵי בְּסִיסִים!'],
            [shape === 'pyramid' && prop === 'edges' ? f(n) : null, 'סְפַרְתֶּם רַק אֶת הַבָּסִיס. יֵשׁ גַּם מִקְצוֹעוֹת שֶׁעוֹלִים לְמַעְלָה.'],
            [prop === 'lat' ? f(n + (shape === 'prism' ? 2 : 1)) : null, 'סְפַרְתֶּם גַּם אֶת הַבְּסִיסִים. הַשְּׁאֵלָה הִיא רַק עַל הַפֵּאוֹת בַּמַּעֲטֶפֶת.'],
        ]),
    };
}

/* ================================================================ rectangle: area and perimeter */

const CM = 'ס״מ';
const CM2 = 'סמ״ר';

function genRect(level) {
    let w = rnd(3, level === 1 ? 12 : 20);
    let h = rnd(2, w - 1);
    if (level === 3 && Math.random() < .25) h = w;
    const A = w * h, P = 2 * (w + h);
    const square = w === h;
    const name = square ? 'הָרִיבּוּעַ' : 'הַמַּלְבֵּן';
    const back = level === 3 && Math.random() < .55;
    if (back) {
        const byArea = Math.random() < .5;
        return {
            kind: 'int', answer: f(h), unit: CM, viz: { type: 'rect', w, h, lw: `${w} ${CM}`, lh: '?' },
            he: byArea ? `שֶׁטַח הַמַּלְבֵּן הוּא ${A} ${CM2}, וְאוֹרְכּוֹ ${w} ${CM}. מָה רוֹחַב הַמַּלְבֵּן?` : `הֶיקֵּף הַמַּלְבֵּן הוּא ${P} ${CM}, וְאוֹרְכּוֹ ${w} ${CM}. מָה רוֹחַב הַמַּלְבֵּן?`,
            plain: 'a rectangle question; the pupil writes short calculations such as 84:12=7',
            hint: byArea ? 'אוֹרֶךְ כָּפוּל רוֹחַב שָׁוֶה לַשֶּׁטַח. אֵיזוֹ פְּעוּלָּה הוֹלֶכֶת אָחוֹרָה?' : 'חֲצִי מֵהַהֶיקֵּף הוּא אוֹרֶךְ וְעוֹד רוֹחַב.',
            steps: byArea
                ? [{ he: 'אוֹרֶךְ כָּפוּל רוֹחַב שָׁוֶה לַשֶּׁטַח, אָז הָרוֹחַב הוּא הַשֶּׁטַח לְחַלֵּק לָאוֹרֶךְ.', m: `${A} : ${w} = ${h}` }]
                : [{ he: 'הַהֶיקֵּף הוּא פַּעֲמַיִים אוֹרֶךְ וְעוֹד פַּעֲמַיִים רוֹחַב. חֲצִי הֶיקֵּף הוּא אוֹרֶךְ וְעוֹד רוֹחַב.', m: `${P} : 2 = ${w + h}` }, { he: 'מוֹרִידִים אֶת הָאוֹרֶךְ, וּמְקַבְּלִים אֶת הָרוֹחַב.', m: `${w + h} - ${w} = ${h}` }],
            traps: traps(f(h), byArea ? [] : [[f(P - w), 'הוֹרַדְתֶּם אֶת הָאוֹרֶךְ רַק פַּעַם אַחַת. בַּהֶיקֵּף יֵשׁ שְׁנֵי אוֹרְכִּים וּשְׁנֵי רְחָבִים.'], [f(P / 2), 'זֶה חֲצִי הַהֶיקֵּף: אוֹרֶךְ וְעוֹד רוֹחַב. עַכְשָׁיו מוֹרִידִים אֶת הָאוֹרֶךְ.']]),
        };
    }
    const area = Math.random() < .5;
    const viz = { type: 'rect', w, h, lw: `${w} ${CM}`, lh: `${h} ${CM}`, grid: area && level === 1 };
    return area ? {
        kind: 'int', answer: f(A), unit: CM2, viz, he: `חַשְּׁבוּ אֶת הַשֶּׁטַח שֶׁל ${name}:`,
        plain: `the area of a ${w} cm by ${h} cm rectangle; the pupil writes e.g. ${w}x${h}=${A}`,
        hint: 'שֶׁטַח = אוֹרֶךְ כָּפוּל רוֹחַב. הוּא סוֹפֵר כַּמָּה רִיבּוּעִים קְטַנִּים נִכְנָסִים בִּפְנִים.',
        steps: [{ he: 'שֶׁטַח הוּא כַּמָּה רִיבּוּעִים שֶׁל סֶנְטִימֶטֶר אֶחָד נִכְנָסִים בְּתוֹךְ הַצּוּרָה: אוֹרֶךְ כָּפוּל רוֹחַב.', m: `${w} x ${h} = ${A}`, viz: { ...viz, grid: w * h <= 200 } }],
        traps: traps(f(A), [[f(P), 'חִישַּׁבְתֶּם אֶת הַהֶיקֵּף. שֶׁטַח הוּא אוֹרֶךְ כָּפוּל רוֹחַב.'], [f(w + h), 'חִיבַּרְתֶּם. שֶׁטַח הוּא כֶּפֶל: אוֹרֶךְ כָּפוּל רוֹחַב.']]),
    } : {
        kind: 'int', answer: f(P), unit: CM, viz, he: `חַשְּׁבוּ אֶת הַהֶיקֵּף שֶׁל ${name}:`,
        plain: `the perimeter of a ${w} cm by ${h} cm rectangle; the pupil writes e.g. ${w}+${h}+${w}+${h}=${P}`,
        hint: 'הֶיקֵּף הוּא הַקַּו מִסָּבִיב: מְחַבְּרִים אֶת כָּל אַרְבַּע הַצְּלָעוֹת.',
        steps: [
            { he: 'הֶיקֵּף הוּא הָאוֹרֶךְ שֶׁל כָּל הַקַּו מִסָּבִיב: מְחַבְּרִים אֶת כָּל אַרְבַּע הַצְּלָעוֹת.', m: `${w} + ${h} + ${w} + ${h} = ${P}`, viz: { ...viz, trace: true } },
            { he: 'אוֹ בְּקִצּוּר: אוֹרֶךְ וְעוֹד רוֹחַב, כָּפוּל 2.', m: `( ${w} + ${h} ) x 2 = ${P}` },
        ],
        traps: traps(f(P), [[f(A), 'חִישַּׁבְתֶּם אֶת הַשֶּׁטַח. הֶיקֵּף הוּא סְכוּם הַצְּלָעוֹת מִסָּבִיב.'], [f(w + h), 'חִיבַּרְתֶּם רַק שְׁתֵּי צְלָעוֹת. לַמַּלְבֵּן יֵשׁ אַרְבַּע!']]),
    };
}

/* ================================================================ the subjects */

export const MORE_TOPICS = [
    {
        id: 'addsub', group: 'frac', icon: '➕', color: '#2dd4bf', title: 'חִיבּוּר וְחִיסּוּר שְׁבָרִים', sub: 'קוֹדֶם מְכַנֶּה מְשׁוּתָּף', sample: '6/5 + 7/8', gen: genAddSub,
        lesson: [
            { he: 'מְחַבְּרִים שְׁבָרִים רַק כְּשֶׁיֵּשׁ לָהֶם אוֹתוֹ מְכַנֶּה. וְאָז מְחַבְּרִים אֶת הַמּוֹנִים, וְהַמְּכַנֶּה נִשְׁאָר.', m: '2/7 + 3/7 = 5/7' },
            { he: 'כְּשֶׁהַמְּכַנִּים שׁוֹנִים, מוֹצְאִים מְכַנֶּה מְשׁוּתָּף: מִסְפָּר שֶׁמִּתְחַלֵּק בִּשְׁנֵי הַמְּכַנִּים. לְ-5 וּלְ-8 זֶה 40.', m: '6/5 + 7/8 = 48/40 + 35/40' },
            { he: 'מְחַבְּרִים אֶת הַמּוֹנִים, וְכוֹתְבִים כְּמִסְפָּר מְעוֹרָב.', m: '48/40 + 35/40 = 83/40 = 2_3/40' },
            { he: 'בְּחִיסּוּר מִסְפָּרִים מְעוֹרָבִים, אִם הַשֶּׁבֶר הָרִאשׁוֹן קָטָן מִדַּי, פּוֹרְטִים שָׁלֵם אֶחָד.', m: '5_16/40 - 1_25/40 = 4_56/40 - 1_25/40 = 3_31/40' },
        ],
    },
    {
        id: 'divide', group: 'frac', icon: '➗', color: '#e879f9', title: 'חִילּוּק וּשְׁבָרִים', sub: 'מְחַלְּקִים שָׁוֶה בְּשָׁוֶה', sample: '3/5 : 6', gen: genDivide,
        lesson: [
            { he: 'חִילּוּק שֶׁל שָׁלֵם בְּשָׁלֵם אֶפְשָׁר לִכְתּוֹב כְּשֶׁבֶר. 7 לִיטְרִים לְ-8 בַּקְבּוּקִים: בְּכָל בַּקְבּוּק {{7/8}} לִיטְר.', m: '7 : 8 = 7/8' },
            { he: 'כְּשֶׁמְּחַלְּקִים שֶׁבֶר בְּמִסְפָּר שָׁלֵם, כּוֹפְלִים אֶת הַמְּכַנֶּה בַּמִּסְפָּר. כָּל חֵלֶק נַעֲשֶׂה קָטָן יוֹתֵר.', m: '3/5 : 6 = [3]/[5 x 6] = 3/30 = 1/10' },
            { he: 'מִסְפָּר מְעוֹרָב? קוֹדֶם הוֹפְכִים אוֹתוֹ לְשֶׁבֶר.', m: '2_2/5 : 4 = 12/5 : 4 = 12/20 = 3/5' },
            { he: 'בִּבְעָיָה מִילּוּלִית שׁוֹאֲלִים: מְחַלְּקִים לַחֲלָקִים, אוֹ מְחַבְּרִים חֲלָקִים לְשָׁלֵם? 5 חֲלָקִים שֶׁל {{2_2/5}} מֶטֶר הֵם חֶבֶל שֶׁל 12 מֶטֶר.', m: '2_2/5 x 5 = 12' },
        ],
    },
    {
        id: 'order', group: 'frac', icon: '📏', color: '#fbbf24', title: 'מְסַדְּרִים שְׁבָרִים וְעֶשְׂרוֹנִיִּים', sub: 'מֵהַקָּטָן לַגָּדוֹל', sample: '1/3 < 0.5 < 3/4', gen: genOrder, noPhoto: true,
        lesson: [
            { he: 'כְּדֵי לְהַשְׁווֹת שְׁבָרִים וּמִסְפָּרִים עֶשְׂרוֹנִיִּים, הוֹפְכִים אֶת כּוּלָּם לְאוֹתָהּ צוּרָה. הֲכִי קַל: מִסְפָּר עֶשְׂרוֹנִי.', m: '3/4 = 0.75' },
            { he: 'שֶׁבֶר הוֹפְכִים לְעֶשְׂרוֹנִי בְּחִילּוּק: הַמּוֹנֶה לְחַלֵּק לַמְּכַנֶּה. אוֹ מַרְחִיבִים לִמְכַנֶּה 10, 100 אוֹ 1000.', m: '31/40 = 775/1000 = 0.775' },
            { he: 'יֵשׁ שְׁבָרִים שֶׁלֹּא נִגְמָרִים. {{1/3}} הוּא בְּעֵרֶךְ 0.333.', m: '1/3 ≈ 0.333' },
            { he: 'עַכְשָׁיו מְסַדְּרִים מֵהַקָּטָן לַגָּדוֹל. אֶפְשָׁר גַּם לְסַמֵּן עַל צִיר הַמִּסְפָּרִים.', m: '1/3 < 0.5 < 3/4 < 31/40', viz: numberLine([{ mk: '1/3', v: 1 / 3 }, { mk: '0.5', v: .5 }, { mk: '3/4', v: .75 }, { mk: '31/40', v: .775 }]) },
        ],
    },
    {
        id: 'ops', group: 'num', icon: '🧮', color: '#f97316', title: 'סֵדֶר פְּעוּלּוֹת חֶשְׁבּוֹן', sub: 'סוֹגְרַיִם, כֶּפֶל, וּבַסּוֹף חִיבּוּר', sample: '60 : ( 20 : 4 ) + 10', gen: genOps,
        lesson: [
            { he: 'בְּתַרְגִּיל עִם כַּמָּה פְּעוּלּוֹת יֵשׁ סֵדֶר קָבוּעַ. רִאשׁוֹן: מָה שֶׁבְּתוֹךְ הַסּוֹגְרַיִם.', m: '60 : ( 20 : 4 ) + 10 = 60 : 5 + 10', viz: { type: 'ladder' } },
            { he: 'אַחַר כָּךְ: כֶּפֶל וְחִילּוּק, מִשְּׂמֹאל לְיָמִין.', m: '60 : 5 + 10 = 12 + 10' },
            { he: 'וּבַסּוֹף: חִיבּוּר וְחִיסּוּר, מִשְּׂמֹאל לְיָמִין.', m: '12 + 10 = 22' },
            { he: 'זְהִירוּת! כָּאן הַחִילּוּק בָּא רִאשׁוֹן, לַמְרוֹת שֶׁהוּא בָּאֶמְצַע.', m: '68 - 8 : 4 + 4 = 68 - 2 + 4 = 70' },
        ],
    },
    {
        id: 'big', group: 'num', icon: '🔟', color: '#38bdf8', title: 'חֶשְׁבּוֹן בְּמִסְפָּרִים גְּדוֹלִים', sub: 'חִיבּוּר, חִיסּוּר, כֶּפֶל וְחִילּוּק', sample: '59 x 325', gen: genBig,
        lesson: [
            { he: 'מְחַבְּרִים מִסְפָּרִים גְּדוֹלִים בְּטוּר: כָּל סִפְרָה מִתַּחַת לַסִּפְרָה בְּאוֹתוֹ מָקוֹם. מַתְחִילִים מִיָּמִין, וְזוֹכְרִים אֶת הַהַעֲבָרָה.', m: '1457987 + 768445 = 2226432', viz: { type: 'column', a: 1457987, b: 768445, op: '+', result: 2226432 } },
            { he: 'בְּחִיסּוּר, כְּשֶׁהַסִּפְרָה לְמַעְלָה קְטַנָּה מִדַּי, פּוֹרְטִים: לוֹקְחִים 1 מֵהַטּוּר שֶׁמִּשְּׂמֹאל.', m: '100000 - 76987 = 23013', viz: { type: 'column', a: 100000, b: 76987, op: '-', result: 23013 } },
            { he: 'בְּכֶפֶל מְפָרְקִים מִסְפָּר אֶחָד לַעֲשָׂרוֹת וַאֲחָדוֹת, כּוֹפְלִים כָּל חֵלֶק, וּמְחַבְּרִים.', m: '325 x 59 = 325 x 50 + 325 x 9 = 16250 + 2925 = 19175' },
            { he: 'בְּחִילּוּק מְפָרְקִים אֶת הַמִּסְפָּר לַחֲלָקִים שֶׁקַּל לְחַלֵּק.', m: '28440 : 6 = 24000 : 6 + 4200 : 6 + 240 : 6', m2: '4000 + 700 + 40 = 4740' },
            { he: 'וְתָמִיד בּוֹדְקִים: חִיסּוּר בּוֹדְקִים בְּחִיבּוּר, וְחִילּוּק בּוֹדְקִים בְּכֶפֶל.', m: '23013 + 76987 = 100000' },
        ],
    },
    {
        id: 'estimate', group: 'num', icon: '🎯', color: '#a3e635', title: 'אוֹמְדָן', sub: 'חִישּׁוּב מָהִיר בְּעֵרֶךְ', sample: '800000 - 400000', gen: genEstimate, noPhoto: true,
        lesson: [
            { he: 'אוֹמְדָן הוּא חִישּׁוּב מָהִיר שֶׁל בְּעֵרֶךְ. מְעַגְּלִים אֶת הַמִּסְפָּרִים לְמִסְפָּרִים עֲגוּלִים, וּמְחַשְּׁבִים בְּקַלּוּת.' },
            { he: 'מְעַגְּלִים לַמִּסְפָּר הָעָגוֹל הַקָּרוֹב בְּיוֹתֵר. {{399919}} קָרוֹב מְאוֹד לְ-{{400000}}, וְרָחוֹק מִ-{{300000}}!', m: '399919 ≈ 400000', viz: { type: 'line', min: 300000, max: 400000, ticks: [300000, 350000, 400000], items: [{ mk: '399919', v: 399919 }], big: true } },
            { he: 'וְ-{{798899}} קָרוֹב לְ-{{800000}}. לָכֵן הַהֶפְרֵשׁ בֵּינֵיהֶם הוּא בְּעֵרֶךְ:', m: '800000 - 400000 = 400000' },
            { he: 'זְהִירוּת: לֹא קוֹטְעִים אֶת הַסִּפְרוֹת! מְעַגְּלִים לְמַעְלָה אוֹ לְמַטָּה, לְפִי מָה שֶׁקָּרוֹב יוֹתֵר.' },
        ],
    },
    {
        id: 'solids', group: 'geo', icon: '🧊', color: '#818cf8', title: 'מִנְסָרוֹת וּפִירָמִידוֹת', sub: 'פֵּאוֹת, מִקְצוֹעוֹת וְקוֹדְקוֹדִים', sample: '3 x n', gen: genSolids, noPhoto: true,
        lesson: [
            { he: 'מִנְסָרָה הִיא גּוּף עִם שְׁנֵי בְּסִיסִים זֵהִים, לְמַטָּה וּלְמַעְלָה. הַפֵּאוֹת בַּמַּעֲטֶפֶת הֵן מַלְבֵּנִים.', viz: { type: 'solid', shape: 'prism', n: 5 } },
            { he: 'פִּירָמִידָה הִיא גּוּף עִם בָּסִיס אֶחָד, וְקוֹדְקוֹד אֶחָד לְמַעְלָה. הַפֵּאוֹת בַּמַּעֲטֶפֶת הֵן מְשׁוּלָּשִׁים.', viz: { type: 'solid', shape: 'pyramid', n: 4 } },
            { he: 'הַשֵּׁם מְסַפֵּר מָה הַבָּסִיס. לְמִנְסָרָה מְחוּמֶּשֶׁת יֵשׁ בָּסִיס מְחוּמָּשׁ, עִם 5 צְלָעוֹת.' },
            { he: 'כְּשֶׁלַּבָּסִיס יֵשׁ n צְלָעוֹת, סוֹפְרִים כָּךְ:', viz: { type: 'table', head: ['', 'פֵּאוֹת בַּמַּעֲטֶפֶת', 'מִקְצוֹעוֹת', 'קוֹדְקוֹדִים', 'בְּסִיסִים'], rows: [['מִנְסָרָה', 'n', '3 x n', '2 x n', '2'], ['פִּירָמִידָה', 'n', '2 x n', 'n + 1', '1']] } },
            { he: 'פֵּאוֹן הוּא גּוּף שֶׁכָּל הַפֵּאוֹת שֶׁלּוֹ מְצוּלָּעִים. מִנְסָרוֹת וּפִירָמִידוֹת הֵן פֵּאוֹנִים, אֲבָל לֹא כָּל פֵּאוֹן הוּא מִנְסָרָה!' },
        ],
    },
    {
        id: 'rect', group: 'geo', icon: '▭', color: '#fb7185', title: 'שֶׁטַח וְהֶיקֵּף שֶׁל מַלְבֵּן', sub: 'כֶּפֶל לַשֶּׁטַח, חִיבּוּר לַהֶיקֵּף', sample: '12 x 7', gen: genRect,
        lesson: [
            { he: 'הֶיקֵּף הוּא הָאוֹרֶךְ שֶׁל כָּל הַקַּו מִסָּבִיב לַצּוּרָה: מְחַבְּרִים אֶת כָּל הַצְּלָעוֹת.', m: '12 + 7 + 12 + 7 = 38', viz: { type: 'rect', w: 12, h: 7, lw: `12 ${CM}`, lh: `7 ${CM}`, trace: true } },
            { he: 'בְּמַלְבֵּן הַצְּלָעוֹת הַנֶּגְדִּיּוֹת שָׁווֹת, אָז אֶפְשָׁר גַּם כָּךְ:', m: '( 12 + 7 ) x 2 = 38' },
            { he: 'שֶׁטַח הוּא כַּמָּה רִיבּוּעִים שֶׁל סֶנְטִימֶטֶר אֶחָד נִכְנָסִים בְּתוֹךְ הַצּוּרָה: אוֹרֶךְ כָּפוּל רוֹחַב.', m: '12 x 7 = 84', viz: { type: 'rect', w: 12, h: 7, lw: `12 ${CM}`, lh: `7 ${CM}`, grid: true } },
            { he: `שִׂימוּ לֵב לַיְּחִידוֹת: הֶיקֵּף מוֹדְדִים בְּ${CM}, וְשֶׁטַח בְּ${CM2}, סֶנְטִימֶטֶר רָבוּעַ.` },
        ],
    },
];
