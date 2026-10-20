import { readToken, body, send, certInfo } from './_lib/core.js';

// Public verification endpoint. GET /api/verify?code=...  (or POST { code })
export default function handler(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {}, true);
  const raw = req.method === 'POST' ? body(req).code : req.query?.code ?? new URL(req.url, 'http://x').searchParams.get('code');
  let code = String(raw || '').trim();
  const m = code.match(/verify\/([A-Za-z0-9_\-.]+)/);
  if (m) code = m[1];
  if (!code) return send(res, 400, { valid: false, reason: 'No verification code provided.' }, true);
  const tok = readToken(code, 16);
  if (!tok || tok.data.t !== 'cert') return send(res, 200, { valid: false, reason: 'This code does not match any genuine TypeSprint certificate. It may be mistyped or forged.' }, true);
  return send(res, 200, { valid: true, certificate: certInfo(tok.data, tok.sig) }, true);
}
