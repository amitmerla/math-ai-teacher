# Mati · math teacher

Read README.md first. Fractions for 6th grade (Hebrew), led by the robot Mati. Sister project of "../Learn English".

## Decisions already made (don't undo without asking)

- **No server side.** Only static HTML + CSS + JS + animations. Anything that needs processing runs in the browser (e.g. HEIC decoding via `heic-to` from a CDN, loaded only when needed).
- **AI gate:** at start the app checks Chrome's built-in AI (with image input). If it is unavailable, Mati says a stronger laptop and an up-to-date Chrome are needed, and NO app content starts. If it only needs downloading, the gate offers the download (a click is required), then starts. Only "available" opens the app.
- Photo reading uses **Chrome's built-in AI** (Gemini Nano), not a cloud API. The AI only copies handwriting; it never grades. The pupil confirms or fixes the copied lines, and `js/check.js` grades with exact fractions.
- All Hebrew is plural / gender-neutral and written with **full niqqud on top of full spelling** (so removing marks gives normal spelling). The ניקוד switch shows it with or without marks; the voice always gets the pointed text.
- Math inside Hebrew text is written as `{{markup}}` (see the top of js/math.js); the same markup is drawn and spoken.
- The look is "WOW": dark glass, gradients, a robot with moods (talk, happy, oops, think, scan, point, wave), confetti.

## Not verified yet

The test browser had no Gemini Nano, so reading real handwriting with the AI was never seen working, and the download path of the gate was never seen. The lessons, practice, step checker and feedback were tested before the gate was added (via the "type the lines" path, still used when the AI cannot read a photo). HEIC decoding with heic-to was not run in a test (a JPEG of the same photo was); the older heic2any failed on these iPhone photos.
