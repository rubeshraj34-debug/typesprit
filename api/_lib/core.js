// Shared server-side logic for the TypeSprint certification system.
// Runs only in Vercel serverless functions — never shipped to the browser.
import crypto from 'node:crypto';
import { EN, HI } from './passages.js';

const SECRET = process.env.CERT_SECRET || 'ts-cert-v1::7f2c9a61e4b84d0f93a5c18e2b6d47f0::typesprint-board';
const ADMIN_KEY = process.env.ADMIN_KEY || 'TypeSprint@Admin2026';

export const LEVELS = {
  1: { name: 'Beginner', duration: 120, wpm: 20, acc: 90 },
  2: { name: 'Intermediate', duration: 300, wpm: 30, acc: 95 },
  3: { name: 'Professional', duration: 600, wpm: 40, acc: 97 },
};

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const hmac = (data) => crypto.createHmac('sha256', SECRET).update(data).digest();

export function makeToken(obj, sigLen = 32) {
  const payload = b64u(JSON.stringify(obj));
  return `${payload}.${b64u(hmac(payload).subarray(0, sigLen))}`;
}

export function readToken(token, sigLen = 32) {
  if (typeof token !== 'string' || token.length > 4000) return null;
  const parts = token.trim().split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = hmac(payload).subarray(0, sigLen);
  let given;
  try {
    given = Buffer.from(sig, 'base64url');
  } catch {
    return null;
  }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    return { data: JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')), sig: given };
  } catch {
    return null;
  }
}

export function serialFor(sig, level, issuedAt) {
  const hex = Buffer.from(sig).toString('hex').toUpperCase();
  return `TS-L${level}-${new Date(issuedAt).getUTCFullYear()}-${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Deterministic passage text for a seed, long enough that nobody can finish it.
export function testText(seed, lang, duration) {
  const src = lang === 'hi' ? HI : EN;
  const r = rng(seed);
  const need = Math.ceil((duration / 60) * 170);
  const out = [];
  let count = 0;
  while (count < need) {
    const order = src.map((p, i) => [r(), i]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);
    for (const i of order) {
      out.push(src[i]);
      count += src[i].split(/\s+/).length;
      if (count >= need) break;
    }
  }
  return out.join(' ');
}

// Authoritative scoring. Recomputes everything from the passage and the typed text.
export function score({ text, typed, keystrokes, errors, duration, elapsedSec }) {
  const words = text.trim().split(/\s+/);
  const clean = String(typed || '').replace(/\r?\n/g, ' ').replace(/ +/g, ' ').replace(/^ /, '').replace(/ $/, '');
  const tw = clean.length ? clean.split(' ') : [];
  if (tw.length > words.length) throw new Error('Typed text is longer than the test passage.');
  let correctChars = 0;
  let wrongChars = 0;
  let correctWords = 0;
  let incorrectWords = 0;
  tw.forEach((w, j) => {
    const target = words[j];
    const last = j === tw.length - 1;
    for (let k = 0; k < Math.max(w.length, last ? Math.min(w.length, target.length) : target.length); k++) {
      if (k < w.length && w[k] === target[k]) correctChars++;
      else wrongChars++;
    }
    if (w === target) {
      correctWords++;
      if (!last) correctChars++;
    } else if (!last || w.length >= target.length) {
      incorrectWords++;
    }
  });
  const typedChars = clean.length;
  const ks = Number(keystrokes);
  const err = Number(errors);
  if (!Number.isFinite(ks) || !Number.isFinite(err) || ks < 0 || err < 0 || err > ks) throw new Error('Invalid keystroke data.');
  if (typedChars > 0 && ks < typedChars) throw new Error('Keystroke count is inconsistent with the typed text.');
  // Plausibility: nobody types faster than ~220 gross WPM sustained.
  const grossWpmReal = typedChars / 5 / (Math.max(elapsedSec, 1) / 60);
  if (typedChars > 50 && grossWpmReal > 220) throw new Error('Submission rejected: typing speed is not humanly plausible for the elapsed time.');

  const charAcc = typedChars ? (correctChars / Math.max(1, correctChars + wrongChars)) * 100 : 0;
  const ksAcc = ks ? ((ks - err) / ks) * 100 : 0;
  const accuracy = Math.round(Math.max(0, Math.min(charAcc, ksAcc)) * 10) / 10;
  const wpm = Math.round((correctChars / 5 / (duration / 60)) * 10) / 10;
  const rawWpm = Math.round((typedChars / 5 / (duration / 60)) * 10) / 10;
  return { wpm, rawWpm, accuracy, errors: Math.max(err, wrongChars), correctWords, incorrectWords, chars: typedChars };
}

export const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,59}$/;

export function checkAdminKey(key) {
  if (typeof key !== 'string') return false;
  const a = crypto.createHash('sha256').update(key).digest();
  const b = crypto.createHash('sha256').update(ADMIN_KEY).digest();
  return crypto.timingSafeEqual(a, b);
}

export function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export function send(res, status, data, cors = false) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  if (cors) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  res.statusCode = status;
  res.end(JSON.stringify(data));
}

export function certInfo(data, sig) {
  const lv = LEVELS[data.lv];
  return {
    serial: serialFor(sig, data.lv, data.d),
    name: data.n,
    level: data.lv,
    levelName: lv ? lv.name : 'Unknown',
    wpm: data.w,
    accuracy: data.a,
    duration: lv ? lv.duration : 0,
    lang: data.l,
    location: data.loc || '',
    issuedAt: data.d,
  };
}
