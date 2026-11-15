// Mati, the robot who leads the app. One SVG, moods are CSS classes (css/app.css, "robot").
// Everything Mati says goes through say(): the bubble shows it, the voice reads it,
// and the mouth moves while it talks.

import { $, el } from './util.js';
import { rich, spoken } from './math.js';
import { speak, stopSpeaking } from './speech.js';

const SVG = `
<svg class="bot" viewBox="0 0 260 330" aria-hidden="true">
  <defs>
    <linearGradient id="bot-shell" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f4f6ff"/><stop offset=".55" stop-color="#c9d2ff"/><stop offset="1" stop-color="#8f9df0"/>
    </linearGradient>
    <linearGradient id="bot-accent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#a78bfa"/><stop offset="1" stop-color="#f472b6"/>
    </linearGradient>
    <linearGradient id="bot-glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#101536"/><stop offset="1" stop-color="#05071a"/>
    </linearGradient>
    <linearGradient id="bot-flame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff7c2"/><stop offset=".4" stop-color="#fb923c"/><stop offset="1" stop-color="#f472b6" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bot-beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#34d399" stop-opacity=".75"/><stop offset="1" stop-color="#34d399" stop-opacity="0"/>
    </linearGradient>
    <filter id="bot-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <ellipse class="bot-shadow" cx="130" cy="318" rx="60" ry="8"/>

  <g class="bot-all">
    <path class="bot-jet" d="M108 262 Q130 330 152 262 Z" fill="url(#bot-flame)"/>

    <g class="bot-orbit">
      <text x="22" y="60">×</text><text x="226" y="86">÷</text><text x="206" y="22">½</text><text x="40" y="150">+</text>
    </g>

    <g class="bot-arm bot-arm-l">
      <rect x="50" y="186" width="22" height="58" rx="11" fill="url(#bot-shell)"/>
      <circle cx="61" cy="248" r="14" fill="url(#bot-accent)"/>
    </g>
    <g class="bot-arm bot-arm-r">
      <rect x="188" y="186" width="22" height="58" rx="11" fill="url(#bot-shell)"/>
      <circle cx="199" cy="248" r="14" fill="url(#bot-accent)"/>
    </g>

    <g class="bot-body">
      <rect x="76" y="172" width="108" height="94" rx="32" fill="url(#bot-shell)"/>
      <rect x="76" y="172" width="108" height="94" rx="32" fill="none" stroke="url(#bot-accent)" stroke-width="2.5" opacity=".7"/>
      <rect x="96" y="190" width="68" height="46" rx="13" fill="url(#bot-glass)"/>
      <text class="bot-chest" x="130" y="223" text-anchor="middle">×</text>
      <circle class="bot-led l1" cx="104" cy="250" r="4"/><circle class="bot-led l2" cx="118" cy="250" r="4"/><circle class="bot-led l3" cx="132" cy="250" r="4"/>
    </g>

    <g class="bot-head">
      <line x1="130" y1="60" x2="130" y2="36" stroke="#c9d2ff" stroke-width="5" stroke-linecap="round"/>
      <circle class="bot-bulb" cx="130" cy="28" r="10" filter="url(#bot-glow)"/>
      <rect x="30" y="98" width="16" height="36" rx="8" fill="url(#bot-accent)"/>
      <rect x="214" y="98" width="16" height="36" rx="8" fill="url(#bot-accent)"/>
      <rect x="42" y="56" width="176" height="120" rx="44" fill="url(#bot-shell)"/>
      <rect x="58" y="72" width="144" height="88" rx="32" fill="url(#bot-glass)"/>
      <path class="bot-shine" d="M72 92 Q78 78 96 78" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".25"/>

      <polygon class="bot-beam" points="96,118 164,118 230,330 30,330" fill="url(#bot-beam)"/>

      <g class="bot-eyes" filter="url(#bot-glow)">
        <rect class="eye eye-l" x="88" y="94" width="22" height="32" rx="11"/>
        <rect class="eye eye-r" x="150" y="94" width="22" height="32" rx="11"/>
        <path class="eye-joy" d="M86 116 Q99 96 112 116 M148 116 Q161 96 174 116"/>
      </g>
      <circle class="bot-cheek" cx="80" cy="134" r="8"/><circle class="bot-cheek" cx="180" cy="134" r="8"/>

      <g class="bot-mouth">
        <path class="mouth-smile" d="M114 138 Q130 152 146 138"/>
        <path class="mouth-flat" d="M118 146 Q130 138 142 146"/>
        <g class="mouth-bars">
          <rect x="110" y="136" width="6" height="12" rx="3"/><rect x="119" y="136" width="6" height="12" rx="3"/>
          <rect x="128" y="136" width="6" height="12" rx="3"/><rect x="137" y="136" width="6" height="12" rx="3"/>
          <rect x="146" y="136" width="6" height="12" rx="3"/>
        </g>
      </g>
    </g>
  </g>
</svg>`;

const root = el('div', { class: 'mati', 'data-mood': 'idle' },
    el('div', { class: 'mati-bot', html: SVG }),
    el('div', { class: 'bubble', hidden: true },
        el('div', { class: 'bubble-text', 'aria-live': 'polite' }),
        el('button', { class: 'bubble-replay', type: 'button', 'aria-label': 'השמיעו שוב', text: '🔊' })),
);
const bubble = $('.bubble', root);
const bubbleText = $('.bubble-text', root);
const chest = $('.bot-chest', root);
const eyes = $('.bot-eyes', root);

let lastSaid = '';
let moodTimer = 0;
let sayToken = 0;

function setMood(mood, ms) {
    clearTimeout(moodTimer);
    root.dataset.mood = mood;
    if (ms) moodTimer = setTimeout(() => { root.dataset.mood = 'idle'; }, ms);
}

/**
 * Show text in the bubble and read it out loud. The mouth moves while talking (mood "talk");
 * `feel` is a second, lasting look (happy, oops, think, scan, point, wave), so a happy Mati can also talk.
 */
async function say(text, { feel = '', chestSign, quiet = false, after = 'idle' } = {}) {
    const my = ++sayToken;
    lastSaid = text;
    bubbleText.innerHTML = rich(text);
    bubble.hidden = false;
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');
    if (chestSign) chest.textContent = chestSign;
    root.dataset.feel = feel;
    if (quiet) return;
    setMood('talk');
    await speak(spoken(text));
    if (my === sayToken) setMood(after);
}

$('.bubble-replay', root).addEventListener('click', () => { if (lastSaid) say(lastSaid, { feel: root.dataset.feel }); });

// The eyes follow the pointer.
addEventListener('pointermove', e => {
    const r = root.getBoundingClientRect();
    if (!r.width) return;
    const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
    const dy = (e.clientY - (r.top + r.height / 3)) / innerHeight;
    eyes.style.transform = `translate(${Math.max(-1, Math.min(1, dx * 2)) * 7}px, ${Math.max(-1, Math.min(1, dy * 2)) * 5}px)`;
}, { passive: true });

export const mati = {
    root,
    say,
    setMood,
    /** A feeling that stays until the next say(): '', 'happy', 'oops', 'think', 'scan', 'point', 'wave'. */
    feel(f, chestSign) { root.dataset.feel = f; if (chestSign) chest.textContent = chestSign; },
    chest(sign) { chest.textContent = sign; },
    hush() { sayToken += 1; stopSpeaking(); setMood('idle'); },
    moveTo(host) { if (root.parentElement !== host) host.append(root); },
};
