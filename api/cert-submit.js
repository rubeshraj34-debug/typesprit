import crypto from 'node:crypto';
import { LEVELS, readToken, makeToken, testText, score, body, send, certInfo } from './_lib/core.js';

const MAX_AGE_MS = 45 * 60 * 1000;

// POST { token, typed, keystrokes, errors } -> server-validated score + signed certificate if passed
export default function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const b = body(req);
  const tok = readToken(b.token);
  if (!tok || tok.data.t !== 'test') return send(res, 401, { error: 'Invalid or tampered test session.' });
  const t = tok.data;
  const lv = LEVELS[t.lv];
  if (!lv) return send(res, 400, { error: 'Invalid level.' });
  const now = Date.now();
  const elapsedSec = (now - t.iat) / 1000;
  if (now - t.iat > lv.duration * 1000 + MAX_AGE_MS) return send(res, 410, { error: 'This test session has expired. Please start a new test.' });
  if (typeof b.typed !== 'string' || b.typed.length > 20000) return send(res, 400, { error: 'Invalid typed text.' });

  let result;
  try {
    result = score({ text: testText(t.s, t.l, lv.duration), typed: b.typed, keystrokes: b.keystrokes, errors: b.errors, duration: lv.duration, elapsedSec });
  } catch (e) {
    return send(res, 422, { error: e instanceof Error ? e.message : 'Could not score submission.' });
  }
  const passed = result.wpm >= lv.wpm && result.accuracy >= lv.acc;
  const out = { ...result, level: t.lv, levelName: lv.name, duration: lv.duration, required: { wpm: lv.wpm, accuracy: lv.acc }, passed, validatedAt: now };
  if (passed) {
    const data = { t: 'cert', v: 1, n: t.n, lv: t.lv, w: result.wpm, a: result.accuracy, l: t.l, loc: t.loc, d: now, nc: crypto.randomBytes(4).toString('hex') };
    const code = makeToken(data, 16);
    const sig = Buffer.from(code.split('.')[1], 'base64url');
    out.certificate = { ...certInfo(data, sig), code };
  }
  return send(res, 200, out);
}
