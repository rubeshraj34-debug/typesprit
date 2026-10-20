// End-to-end test of the certification backend: start -> type -> submit -> verify.
import start from '../api/cert-start.js';
import submit from '../api/cert-submit.js';
import verify from '../api/verify.js';
import admin from '../api/admin-login.js';
import { makeToken, readToken } from '../api/_lib/core.js';

const call = (h, req) =>
  new Promise((resolve) => {
    const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(s) { resolve({ status: this.statusCode, body: JSON.parse(s || '{}') }); } };
    h({ method: 'POST', query: {}, url: '/', ...req }, res);
  });
const assert = (c, m) => { if (!c) { console.error('FAIL:', m); process.exit(1); } console.log('ok -', m); };

const s = await call(start, { body: { level: 1, lang: 'en', name: 'Priya Sharma', location: 'Jaipur, Rajasthan' } });
assert(s.status === 200 && s.body.text.split(' ').length > 300, 'start returns token + long passage');
assert((await call(start, { body: { level: 9, name: 'A B' } })).status === 400, 'invalid level rejected');
assert((await call(start, { body: { level: 1, name: 'प्रिया' } })).status === 400, 'non-latin certificate name rejected');

// Backdate the session to simulate a real 2-minute test (re-sign with same data but older iat).
const data = readToken(s.body.token).data;
const token = makeToken({ ...data, iat: Date.now() - 125000 });
const words = s.body.text.split(' ');
const good = words.slice(0, 60).join(' '); // ~60 words in 2 min ≈ 25+ WPM
const p = await call(submit, { body: { token, typed: good, keystrokes: good.length + 4, errors: 4 } });
assert(p.status === 200, 'submit accepted');
assert(p.body.passed === true && p.body.wpm >= 20 && p.body.accuracy >= 90, `pass computed server-side (wpm ${p.body.wpm}, acc ${p.body.accuracy})`);
assert(/^TS-L1-\d{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/.test(p.body.certificate.serial), `serial issued ${p.body.certificate.serial}`);

const slow = words.slice(0, 20).join(' ');
const f = await call(submit, { body: { token, typed: slow, keystrokes: slow.length, errors: 0 } });
assert(f.body.passed === false && !f.body.certificate, `slow typing fails (wpm ${f.body.wpm})`);

const sloppy = words.slice(0, 70).map((w, i) => (i % 3 === 0 ? 'q'.repeat(w.length) : w)).join(' ');
const g = await call(submit, { body: { token, typed: sloppy, keystrokes: sloppy.length, errors: 0 } });
assert(g.body.passed === false && g.body.accuracy < 90, `inaccurate typing fails despite client claiming 0 errors (acc ${g.body.accuracy})`);

const fresh = await call(submit, { body: { token: s.body.token, typed: words.slice(0, 200).join(' '), keystrokes: 1500, errors: 0 } });
assert(fresh.status === 422, 'implausibly fast submission rejected');

const tampered = token.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'));
assert((await call(submit, { body: { token: tampered, typed: good, keystrokes: 400, errors: 0 } })).status === 401, 'tampered session token rejected');

const v = await call(verify, { method: 'GET', query: { code: p.body.certificate.code } });
assert(v.body.valid && v.body.certificate.serial === p.body.certificate.serial && v.body.certificate.name === 'Priya Sharma', 'public verify confirms certificate');
const forged = p.body.certificate.code.replace(/^./, (c) => (c === 'e' ? 'f' : 'e'));
assert((await call(verify, { method: 'GET', query: { code: forged } })).body.valid === false, 'forged certificate code rejected');
assert((await call(verify, { method: 'GET', query: { code: 'https://x.app/verify/' + p.body.certificate.code } })).body.valid, 'verify accepts full URL');

assert((await call(admin, { body: { key: 'wrong' } })).status === 401, 'admin wrong key rejected');
assert((await call(admin, { body: { key: 'TypeSprint@Admin2026' } })).body.ok, 'admin key accepted');
console.log('\nAll certification flow tests passed.');
