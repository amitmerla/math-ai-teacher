// Saved on this computer: the pupil's name, switches, stars and progress per subject.

const KEY = 'mati.math.v1';
const blank = () => ({ name: '', niqqud: true, muted: false, stars: 0, streak: 0, topics: {} });

let data = blank();
try { data = { ...blank(), ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { /* start fresh */ }

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode */ } };

export const store = {
    get: k => data[k],
    set(k, v) { data[k] = v; save(); },
    topic: id => data.topics[id] ?? { tries: 0, ok: 0 },
    /** 1 to 3: exercises get harder after every 3 correct answers in a subject. */
    level: id => 1 + Math.min(2, Math.floor(store.topic(id).ok / 3)),
    record(id, ok, stars) {
        const t = store.topic(id);
        t.tries += 1;
        if (ok) t.ok += 1;
        data.topics[id] = t;
        data.streak = ok ? data.streak + 1 : 0;
        data.stars += stars;
        save();
    },
};
