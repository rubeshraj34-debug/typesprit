import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, ShieldX, Search, ShieldAlert } from 'lucide-react';
import PublicHeader from '../components/PublicHeader';
import CertificatePreview from '../components/CertificatePreview';
import { ErrorBox, Spinner } from '../components/ui';
import { verifyCode, type ServerCertificate } from '../lib/cert';
import { lookupSerial } from '../lib/db';

type State = { status: 'idle' } | { status: 'loading' } | { status: 'valid'; cert: Omit<ServerCertificate, 'code'>; revoked: boolean } | { status: 'invalid'; reason: string } | { status: 'error'; message: string };

const SERIAL_RE = /^TS-L[123]-\d{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/i;

export default function Verify() {
  const { code: routeCode } = useParams();
  const nav = useNavigate();
  const [input, setInput] = useState(routeCode ?? '');
  const [state, setState] = useState<State>({ status: 'idle' });

  const run = async (raw: string) => {
    let value = raw.trim();
    if (!value) return;
    setState({ status: 'loading' });
    try {
      let revoked = false;
      if (SERIAL_RE.test(value)) {
        const local = await lookupSerial(value).catch(() => null);
        if (!local) {
          setState({ status: 'invalid', reason: 'Serial numbers are verified using the certificate’s verification link or QR code. Please scan the QR code on the certificate, or paste the full verification link printed beneath it.' });
          return;
        }
        value = local.code;
        revoked = local.revoked;
      }
      const r = await verifyCode(value);
      if (r.valid && r.certificate) {
        const local = await lookupSerial(r.certificate.serial).catch(() => null);
        setState({ status: 'valid', cert: r.certificate, revoked: revoked || !!local?.revoked });
      } else setState({ status: 'invalid', reason: r.reason ?? 'Certificate could not be verified.' });
    } catch (e) {
      setState({ status: 'error', message: e instanceof Error ? e.message : 'Verification failed.' });
    }
  };

  useEffect(() => {
    if (routeCode) run(routeCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeCode]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = input.trim();
    const m = v.match(/verify\/([A-Za-z0-9_\-.]+)/);
    if (m) nav(`/verify/${m[1]}`);
    else run(v);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />
      <main className="flex-1 bg-grid">
        <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
          <div className="font-mono text-sm font-bold text-accent uppercase tracking-widest">Public verification</div>
          <h1 className="font-display text-4xl sm:text-5xl mt-2">Verify Certificate</h1>
          <p className="text-muted mt-3">Scan the QR code on a TypeSprint certificate, or paste its verification link / code below. Verification is checked against our digital signature server.</p>

          <form onSubmit={submit} className="card-b p-4 sm:p-5 mt-8 flex flex-col sm:flex-row gap-3">
            <label htmlFor="vcode" className="sr-only">Verification link, code or serial</label>
            <input id="vcode" className="input-b font-mono text-sm" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Paste verification link, code or serial (TS-L2-2026-…)" />
            <button type="submit" disabled={state.status === 'loading' || !input.trim()} className="btn bg-accent">
              {state.status === 'loading' ? <Spinner className="w-4 h-4" /> : <Search className="w-4 h-4" />} Verify
            </button>
          </form>

          <div className="mt-8">
            {state.status === 'error' && <ErrorBox message={state.message} onRetry={() => run(input)} />}
            {state.status === 'invalid' && (
              <div className="card-b bg-bad-soft p-6 flex gap-4">
                <ShieldX className="w-10 h-10 text-bad shrink-0" />
                <div>
                  <h2 className="font-display text-2xl">Not verified</h2>
                  <p className="text-sm mt-1">{state.reason}</p>
                </div>
              </div>
            )}
            {state.status === 'valid' && (
              <div className="space-y-5">
                <div className={`card-b p-5 flex gap-4 items-start ${state.revoked ? 'bg-bad-soft' : 'bg-go text-white'}`}>
                  {state.revoked ? <ShieldAlert className="w-10 h-10 text-bad shrink-0" /> : <BadgeCheck className="w-10 h-10 shrink-0" />}
                  <div>
                    <h2 className="font-display text-2xl">{state.revoked ? 'Certificate revoked' : 'Genuine certificate'}</h2>
                    <p className="text-sm mt-1 opacity-90">{state.revoked ? 'This certificate was genuinely issued but has since been revoked by a TypeSprint administrator.' : 'This certificate was issued by TypeSprint and its details have not been altered.'}</p>
                  </div>
                </div>
                <div className="card-b overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        ['Serial number', <span className="font-mono font-bold">{state.cert.serial}</span>],
                        ['Name', state.cert.name],
                        ['Location', state.cert.location || '—'],
                        ['Level', `Level ${state.cert.level} — ${state.cert.levelName}`],
                        ['Language', state.cert.lang === 'hi' ? 'Hindi' : 'English'],
                        ['Net speed', `${Math.round(state.cert.wpm)} WPM`],
                        ['Accuracy', `${state.cert.accuracy.toFixed(1)}%`],
                        ['Test duration', `${state.cert.duration / 60} minutes`],
                        ['Issued on', new Date(state.cert.issuedAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' })],
                      ].map(([k, v], i) => (
                        <tr key={i} className="border-b-2 border-ink/10 last:border-0">
                          <th className="text-left font-mono text-xs uppercase tracking-wider p-3 sm:px-5 bg-cream w-40 align-top">{k}</th>
                          <td className="p-3 sm:px-5 font-semibold">{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <CertificatePreview name={state.cert.name} level={state.cert.level} levelName={state.cert.levelName} wpm={state.cert.wpm} accuracy={state.cert.accuracy} date={state.cert.issuedAt} serial={state.cert.serial} revoked={state.revoked} />
              </div>
            )}
            {state.status === 'idle' && (
              <div className="border-2 border-dashed border-ink/40 p-6 text-sm text-muted bg-white/70">
                Every TypeSprint certificate has a QR code and a digitally signed verification link. Changing even one character of the link makes verification fail.{' '}
                <Link to="/certification" className="font-bold underline text-ink">Learn about certification</Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
