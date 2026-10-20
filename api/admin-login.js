import { checkAdminKey, makeToken, body, send } from './_lib/core.js';

// POST { key } -> { ok, adminToken }
export default function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  const { key } = body(req);
  if (!checkAdminKey(key)) return send(res, 401, { ok: false, error: 'Invalid admin key.' });
  return send(res, 200, { ok: true, adminToken: makeToken({ t: 'admin', exp: Date.now() + 7 * 86400000 }) });
}
