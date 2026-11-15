// Mati's "eyes": Chrome's built-in AI (Prompt API, Gemini Nano with image input) reads the
// handwriting in a photo and copies it as text. It never solves and never grades:
// the copied lines are shown to the pupil to fix, and then checked by js/check.js.

const LM = globalThis.LanguageModel;

const IO = {
    expectedInputs: [{ type: 'text', languages: ['en'] }, { type: 'image' }],
    expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

/** status: 'checking' | 'available' | 'downloadable' | 'downloading' | 'unavailable' */
export const ai = { status: 'checking', progress: 0 };
export const aiBus = new EventTarget();
const set = patch => { Object.assign(ai, patch); aiBus.dispatchEvent(new Event('change')); };

// availability() never settles in some Chrome builds, so it gets a time limit.
const withTimeout = (p, ms, fallback) => Promise.race([Promise.resolve(p).catch(() => fallback), new Promise(r => setTimeout(() => r(fallback), ms))]);

export async function checkAI() {
    if (!LM) return set({ status: 'unavailable' });
    const a = await withTimeout(LM.availability(IO), 6000, 'unavailable');
    set({ status: ['available', 'downloadable', 'downloading'].includes(a) ? a : 'unavailable' });
}

/** Must be called from a click: model downloads need a user gesture. */
export async function downloadAI() {
    if (!LM) return;
    set({ status: 'downloading', progress: 0 });
    try {
        const session = await LM.create({
            ...IO,
            monitor: m => m.addEventListener('downloadprogress', e => set({ status: 'downloading', progress: e.total ? e.loaded / e.total : e.loaded })),
        });
        session.destroy?.();
    } catch { /* checkAI reports what happened */ }
    await checkAI();
}

const SYSTEM = `You copy handwritten school math from photos into plain text.
You only copy what is written. You never solve, never continue and never correct mistakes.`;

const RULES = `Copy every handwritten line of the calculation, from top to bottom, one string per line.
Rules:
- A fraction is written as numerator/denominator, for example 3/8.
- A mixed number is written with a space, for example 1 1/6.
- When the top or bottom of a fraction is a calculation, use parentheses: (1x2)/(4x5).
- Use x for multiplication, : for division, = for equals, + and - as written.
- Copy the digits exactly as written, even when the math is wrong.
- Skip words and anything that is crossed out.
Return JSON: {"lines": ["..."]}`;

const SCHEMA = {
    type: 'object',
    properties: { lines: { type: 'array', items: { type: 'string' } } },
    required: ['lines'],
};

/** Read the handwritten lines in a photo. `exercise` is the printed exercise, as plain text. */
export async function readHandwriting(blob, exercise, onText) {
    const session = await LM.create({ ...IO, initialPrompts: [{ role: 'system', content: SYSTEM }] });
    try {
        const stream = session.promptStreaming([{
            role: 'user',
            content: [
                { type: 'text', value: `This photo shows a pupil's handwritten solution of this exercise: ${exercise}\n${RULES}` },
                { type: 'image', value: blob },
            ],
        }], { responseConstraint: SCHEMA });
        let full = '';
        // Chrome has sent both whole-so-far and piece-by-piece chunks, depending on the version.
        for await (const chunk of stream) {
            full = full && chunk.startsWith(full) ? chunk : full + chunk;
            onText?.(full);
        }
        const lines = JSON.parse(full).lines;
        return Array.isArray(lines) ? lines.map(String).filter(l => l.trim()) : [];
    } finally {
        session.destroy?.();
    }
}

// iPhone photos arrive as HEIC, which Chrome cannot open. This decoder runs in the browser
// and is downloaded only the first time a HEIC photo is used.
// (heic2any was tried first: its old libheif cannot open photos from recent iPhones.)
const HEIC_URL = 'https://cdn.jsdelivr.net/npm/heic-to@1.6.5/dist/heic-to.js';

/** Make a photo ready: a JPEG no wider or taller than 1400px. */
export async function prepareImage(file) {
    let bitmap;
    try {
        bitmap = await createImageBitmap(file);
    } catch {
        const { heicTo } = await import(HEIC_URL);
        bitmap = await createImageBitmap(await heicTo({ blob: file, type: 'image/jpeg', quality: .9 }));
    }
    const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(bitmap.width * scale), height: Math.round(bitmap.height * scale) });
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', .9));
    return { blob, url: URL.createObjectURL(blob) };
}
