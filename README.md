# מתי · Mati, the math teacher 🤖

A page for 6th graders learning fractions, led by **Mati**, an animated robot. All text and speech are in Hebrew, with niqqud.
It is plain **HTML + CSS + JavaScript (ES modules)**: no server code, no build, no API keys.

## Open it

The files can be hosted anywhere static (GitHub Pages, Cloudflare Pages, Netlify), or viewed locally with any static file server:

```bash
python3 -m http.server 8791    # then open http://localhost:8791
```

Double-clicking `index.html` won't work: browsers block ES modules on `file://`.

## Requirements (checked at start)

Mati needs Chrome's built-in AI with image input. At start the page checks for it:
- **Ready**: the app opens.
- **Needs download**: a button downloads the model once (a few minutes), then the app opens.
- **Not possible**: Mati explains that a stronger laptop (16GB RAM, or a GPU with more than 4GB) with the latest Chrome and 22GB free disk space is needed, and the app does not start.

## Subjects (from the class worksheets)

| # | Subject | Example |
|---|---|---|
| 1 | כפל שבר בשבר | 1/4 × 2/5 |
| 2 | כפל מספרים מעורבים | 1/7 × 1 1/6 |
| 3 | כפל שלם בשבר | 5 × 7/10 |
| 4 | כפל של כמה שברים (reduce first) | 1/4 × 2/3 × 6/10 |
| 5 | חלק של כמות ("של" = כפל) | 2/5 של 10 |
| 6 | גדול, קטן או שווה? | □ × 16 > 16 |
| 7 | בעיות מילוליות | 3/8 of 240 pupils |

Each subject has two tabs:
- **לומדים**: Mati explains the rule step by step on a board, with pictures (an area model and groups), then works through a new example.
- **מתרגלים**: new exercises every time, getting harder after every 3 correct answers (3 levels). Hint, full worked solution, another exercise.

## How a solution is checked

1. The pupil solves on paper and uploads, drops or pastes a photo (iPhone HEIC works too; a decoder loads from a CDN only when needed).
2. **Chrome's built-in AI** (Prompt API, Gemini Nano with image input) copies the handwritten lines as text. It never solves or grades.
3. The pupil sees what was read and can fix it. If the AI could not read the photo, the pupil types the lines instead.
4. `js/check.js` checks **every "="** with exact fractions: it marks each step ✓ / ✗, names the first wrong step and gives its correct value, and points out answers that aren't reduced, unfinished lines and well-known mistakes (adding instead of multiplying, multiplying wholes and fractions separately, forgetting the numerator…).

The pupil can also type just the final answer.

Chrome flags for photo reading: `chrome://flags/#prompt-api-for-gemini-nano`, `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input`.

## Files

```
index.html
css/app.css     look, robot moods and animations
js/app.js       screens, lesson, practice, photo flow, grading
js/topics.js    the 7 subjects: lessons + exercise generators (steps, hints, known mistakes)
js/check.js     reads a written line and checks every step (exact, no AI)
js/frac.js      exact fractions
js/math.js      math markup → stacked fractions (HTML) and spoken Hebrew
js/avatar.js    Mati: SVG robot, moods, speech bubble
js/ai.js        Chrome built-in AI: reading handwriting; photo preparation
js/speech.js    Hebrew voice
js/niqqud.js    ניקוד switch
js/store.js     progress, stars, settings (localStorage)
js/util.js      DOM helpers, toasts, confetti
```
