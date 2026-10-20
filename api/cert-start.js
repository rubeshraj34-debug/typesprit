import crypto from 'node:crypto';
import { LEVELS, NAME_RE, makeToken, testText, body, send } from './_lib/core.js';

// POST { level, lang, name, location } -> { token, text, duration, level }
export default function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const b = body(req);
  const level = Number(b.level);
  const lv = LEVELS[level];
  if (!lv) return send(res, 400, { error: 'Invalid certification level.' });
  const lang = b.lang === 'hi' ? 'hi' : 'en';
  const name = String(b.name || '').trim().replace(/\s+/g, ' ');
  if (!NAME_RE.test(name)) return send(res, 400, { error: 'Name must use English letters only (2–60 characters) as it appears on the certificate.' });
  const location = String(b.location || '').trim().slice(0, 80);
  const seed = crypto.randomBytes(4).readUInt32BE(0);
  const iat = Date.now();
  const token = makeToken({ t: 'test', lv: level, l: lang, s: seed, n: name, loc: location, iat, nc: crypto.randomBytes(6).toString('hex') });
  return send(res, 200, { token, text: testText(seed, lang, lv.duration), duration: lv.duration, level, issuedAt: iat });
}
