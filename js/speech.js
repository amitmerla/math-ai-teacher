// The Hebrew voice (speechSynthesis). Long text is spoken sentence by sentence,
// because Chrome cuts off long utterances.

import { store } from './store.js';

const synth = globalThis.speechSynthesis;
let voice = null;

function pickVoice() {
    // Hebrew voices may report the old "iw" code.
    const he = (synth?.getVoices() ?? []).filter(v => /^(he|iw)\b/i.test(v.lang));
    voice = he.find(v => /carmit/i.test(v.name)) ?? he.find(v => /google/i.test(v.name)) ?? he[0] ?? null;
}
if (synth) { pickVoice(); synth.addEventListener?.('voiceschanged', pickVoice); }

export const hasVoice = () => !!voice;
export const muted = () => !!store.get('muted');

let token = 0;

export function stopSpeaking() { token += 1; synth?.cancel(); }

const wait = ms => new Promise(r => setTimeout(r, ms));

/** Speak pointed Hebrew. Resolves when done (or right away, after a short "talking" pause, with no voice). */
export async function speak(text, { rate = .92 } = {}) {
    stopSpeaking();
    const my = token;
    if (!text.trim()) return;
    // Before the first click Chrome refuses to speak (and never says so), so Mati only "mouths" the words.
    if (!synth || !voice || muted() || navigator.userActivation?.hasBeenActive === false) {
        await wait(Math.min(2600, 500 + text.length * 22));
        return;
    }
    for (const sentence of text.match(/[^.!?:]+[.!?:]*/g) ?? [text]) {
        if (my !== token) return;
        if (!sentence.trim()) continue;
        await new Promise(resolve => {
            const u = new SpeechSynthesisUtterance(sentence.trim());
            u.lang = 'he-IL';
            u.voice = voice;
            u.rate = rate;
            u.pitch = 1.12;
            u.onend = u.onerror = resolve;
            setTimeout(resolve, 4000 + sentence.length * 220);     // never wait forever for a voice that went quiet
            synth.speak(u);
        });
    }
}
