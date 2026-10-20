import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CircleCheck, CircleX, Download, RotateCcw, Copy, BadgeCheck, Award } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { getCertAttempt, type CertAttempt } from '../lib/db';
import { downloadCertificate } from '../lib/certificatePdf';
import { verifyUrl } from '../lib/cert';
import CertificatePreview from '../components/CertificatePreview';
import { ErrorBox, PageLoader, Spinner, StatTile } from '../components/ui';

export function useDownload() {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const run = async (a: CertAttempt) => {
    setBusy(a.id);
    setErr(null);
    try {
      await downloadCertificate(a);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not generate the PDF.');
    } finally {
      setBusy(null);
    }
  };
  return { busy, err, run };
}

export default function CertResult() {
  const { id = '' } = useParams();
  const { token } = useAuth();
  const [a, setA] = useState<CertAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const dl = useDownload();

  useEffect(() => {
    getCertAttempt(token, id).then(setA).catch((e) => setError(e instanceof Error ? e.message : 'Could not load result.'));
  }, [token, id]);

  if (error) return <div className="max-w-xl space-y-4"><ErrorBox message={error} /><Link to="/app/certificates" className="btn bg-white">My Certificates</Link></div>;
  if (!a) return <PageLoader label="Loading result…" />;

  const copy = async () => {
    if (!a.code) return;
    try {
      await navigator.clipboard.writeText(verifyUrl(a.code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <div className="font-mono text-xs uppercase tracking-widest font-bold text-accent">Certification result · server-validated</div>
        <h1 className="font-display text-3xl">Level {a.level} — {a.levelName}</h1>
      </div>

      <div className={`border-2 border-ink shadow-brut p-5 flex flex-wrap items-center gap-4 ${a.passed ? 'bg-go text-white' : 'bg-bad-soft'}`}>
        {a.passed ? <CircleCheck className="w-10 h-10 shrink-0" /> : <CircleX className="w-10 h-10 text-bad shrink-0" />}
        <div className="flex-1 min-w-[14rem]">
          <div className="font-display text-2xl">{a.passed ? 'Congratulations — you passed!' : 'Not passed this time'}</div>
          <div className="text-sm font-medium opacity-90">
            Required {a.requiredWpm} WPM & {a.requiredAccuracy}% accuracy. You scored {Math.round(a.wpm)} WPM at {a.accuracy.toFixed(1)}%.
            {!a.passed && (a.wpm < a.requiredWpm ? ` You need ${(a.requiredWpm - a.wpm).toFixed(1)} more WPM.` : '')}
            {!a.passed && (a.accuracy < a.requiredAccuracy ? ` Improve accuracy by ${(a.requiredAccuracy - a.accuracy).toFixed(1)}%.` : '')}
          </div>
        </div>
        {a.passed ? (
          <button onClick={() => dl.run(a)} disabled={!!dl.busy} className="btn bg-white text-ink">
            {dl.busy ? <Spinner className="w-4 h-4" /> : <Download className="w-4 h-4" />} Download PDF certificate
          </button>
        ) : (
          <Link to={`/app/certification/test/${a.registrationId}`} className="btn bg-white"><RotateCcw className="w-4 h-4" /> Retake test</Link>
        )}
      </div>
      {dl.err && <ErrorBox message={dl.err} />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Net speed" value={`${Math.round(a.wpm)} WPM`} accent={a.wpm >= a.requiredWpm ? 'bg-accent' : 'bg-white'} sub={`Raw ${Math.round(a.rawWpm)} WPM`} />
        <StatTile label="Accuracy" value={`${a.accuracy.toFixed(1)}%`} accent={a.accuracy >= a.requiredAccuracy ? 'bg-go-soft' : 'bg-bad-soft'} />
        <StatTile label="Errors" value={a.errors} sub={`${a.chars} characters typed`} />
        <StatTile label="Words ✓ / ✗" value={`${a.correctWords} / ${a.incorrectWords}`} sub={`${a.duration / 60} min test`} />
      </div>

      {a.passed && a.serial && a.code && (
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
          <CertificatePreview name={a.name} level={a.level} levelName={a.levelName} wpm={a.wpm} accuracy={a.accuracy} date={a.createdAt} serial={a.serial} revoked={a.revoked} />
          <div className="card-b p-5 space-y-3">
            <h2 className="font-display text-lg flex items-center gap-2"><Award className="w-5 h-5 text-accent" /> Your certificate</h2>
            <div className="text-sm"><span className="text-muted">Serial number</span><div className="font-mono font-bold text-base break-all">{a.serial}</div></div>
            <p className="text-sm text-muted">Share this verification link with employers. Anyone can confirm it on the public Verify page.</p>
            <div className="flex flex-wrap gap-2">
              <button onClick={copy} className="btn bg-white text-sm"><Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy verify link'}</button>
              <Link to={`/verify/${a.code}`} className="btn bg-white text-sm"><BadgeCheck className="w-4 h-4" /> Open verification</Link>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/app/certificates" className="btn bg-ink text-white">My Certificates</Link>
        {a.passed && a.level < 3 && <Link to={`/app/certification/register?level=${a.level + 1}`} className="btn bg-accent">Try Level {a.level + 1}</Link>}
        <Link to="/app/practice/timed" className="btn bg-white">Practise more</Link>
      </div>
    </div>
  );
}
