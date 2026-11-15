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

15 subjects in three groups on the home page.

| Group | Subject | Example | Answer |
|---|---|---|---|
| שברים | כפל שבר בשבר | 1/4 × 2/5 | fraction |
| | כפל מספרים מעורבים (incl. "a whole number that makes 2 1/3 × □ whole") | 1/7 × 1 1/6 | fraction / box |
| | כפל שלם בשבר | 5 × 7/10 | fraction |
| | כפל של כמה שברים (reduce first) | 1/4 × 2/3 × 6/10 | fraction |
| | חלק של כמות ("של" = כפל) | 2/5 של 10 | number |
| | חיבור וחיסור שברים (common denominator, mixed, borrowing) | 5 2/5 − 1 5/8 | fraction |
| | חילוק ושברים (whole : whole, fraction : whole, rope / bottles / pizza) | 3/5 : 6 | fraction |
| | מסדרים שברים ועשרוניים | 1/3, 0.5, 3/4, 31/40 | tap in order / < = > |
| | גדול, קטן או שווה? | □ × 16 > 16 | box / < = > |
| | בעיות מילוליות | 3/8 of 240 pupils | number |
| מספרים וחשבון | סדר פעולות חשבון | 68 − 8 : 4 + 4 | number |
| | חשבון במספרים גדולים (columns, place-value splits) | 59 × 325 | number |
| | אומדן | 399,919 and 798,899 | multiple choice |
| גאומטריה | מנסרות ופירמידות (lateral faces, edges, vertices, bases; true / false with counterexamples) | מנסרה מחומשת | number / true-false |
| | שטח והיקף של מלבן (and backwards: find a side) | 12 × 7 | number |

Each subject has two tabs:
- **לומדים**: Mati explains the rule step by step on a board, with animated pictures (area model, groups, column arithmetic, number line, order-of-operations ladder, 3D prisms and pyramids, rectangles with unit squares), then works through a new example.
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
js/topics.js    fraction subjects + the full subject list and groups
js/topics-more.js  review-sheet subjects: add/subtract, divide, order, operations, big numbers, estimation, solids, rectangle
js/gen.js       shared generator helpers
js/viz.js       board pictures (SVG / HTML, animated)
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
